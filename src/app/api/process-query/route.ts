
import {NextRequest, NextResponse} from 'next/server';
import {processQuery} from '@/ai/flows/process-query';

export async function POST(req: NextRequest) {
  try {
    const {documentUrl, queries} = await req.json();

    if (!documentUrl || !queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json(
        {error: 'documentUrl and a non-empty queries array are required.'},
        {status: 400}
      );
    }

    // Process each query in parallel
    const results = await Promise.all(
      queries.map(async (query: string) => {
        const result = await processQuery({documentUrl, query});
        return {
          ...result,
          questionText: query, // Add the original question to the response
        };
      })
    );

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error processing query in API route:', error);
    // Provide a more generic error to the client
    return NextResponse.json(
      {error: 'An unexpected error occurred on the server.'},
      {status: 500}
    );
  }
}
