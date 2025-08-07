
'use client';

import {useState} from 'react';
import {useForm, useFieldArray} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {AlertTriangle} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {Logo} from '@/components/logo';

interface ProcessQueryOutput {
  answer: string;
  explanation: string;
  source: string;
  questionText: string;
}

const schema = z.object({
  documentUrl: z.string().url({message: 'Please enter a valid URL.'}),
  questions: z
    .array(
      z.object({
        question: z.string().min(5, {message: 'Question must be at least 5 characters.'}),
      })
    )
    .min(1, {message: 'At least one question is required.'}),
});

type FormValues = z.infer<typeof schema>;

// Client-side function to call our new API route
const processQueryOnClient = async (data: {documentUrl: string; queries: string[]}) => {
  try {
    const response = await fetch('/api/process-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const result = await response.json();
    return {data: result};
  } catch (error: any) {
    console.error('Error calling processQuery API:', error);
    return {error: error.message || 'An unknown error occurred.'};
  }
};

export default function Home() {
  const [responses, setResponses] = useState<ProcessQueryOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {toast} = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: {errors},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentUrl: '',
      questions: [{question: ''}],
    },
  });

  const {fields, append, remove} = useFieldArray({
    control,
    name: 'questions',
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setResponses([]);
    setError(null);

    try {
      const questionsArray = values.questions.map(q => q.question);

      const result = await processQueryOnClient({
        documentUrl: values.documentUrl,
        queries: questionsArray,
      });

      if (result.error) {
        const errorMessage = result.error || 'An unexpected error occurred.';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
      } else if (result.data) {
        setResponses(result.data);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      const errorMessage = err.message || 'An unexpected error occurred on the client.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="container mx-auto flex items-center justify-between py-8 sm:py-12">
        <Logo />
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Query a Document</CardTitle>
            <CardDescription>
              Enter the URL of a document and ask one or more questions about its content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="documentUrl">Document URL</Label>
                <Input
                  id="documentUrl"
                  {...register('documentUrl')}
                  placeholder="https://example.com/document.pdf"
                />
                {errors.documentUrl && (
                  <p className="text-sm text-destructive">{errors.documentUrl.message}</p>
                )}
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2 relative group">
                    <Label htmlFor={`questions.${index}.question`}>Question {index + 1}</Label>
                    <Textarea
                      id={`questions.${index}.question`}
                      {...register(`questions.${index}.question` as const)}
                      placeholder="e.g., What are the terms for a refund?"
                    />
                    {errors.questions?.[index]?.question && (
                      <p className="text-sm text-destructive">
                        {errors.questions[index]?.question?.message}
                      </p>
                    )}
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={() => append({question: ''})}>
                  Add Question
                </Button>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Processing...' : 'Submit Query'}
              </Button>

              {error && !loading && (
                <Card className="bg-destructive/10 border-destructive text-destructive mt-4">
                  <CardContent className="p-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-5 w-5" />
                      An Error Occurred
                    </CardTitle>
                    <p className="text-sm mt-2">{error}</p>
                  </CardContent>
                </Card>
              )}
            </form>
          </CardContent>
        </Card>

        {responses.length > 0 && (
          <div className="max-w-3xl mx-auto mt-8 space-y-4">
            <h2 className="text-2xl font-bold font-headline">Responses</h2>
            {responses.map((res, idx) => (
              <Card key={idx} className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Q: {res.questionText}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-primary">Answer</h3>
                    <p>{res.answer}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Explanation</h3>
                    <p className="text-muted-foreground">{res.explanation}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Source</h3>
                    <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground">
                      {res.source}
                    </blockquote>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
