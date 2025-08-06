import { Flame } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Flame className="h-10 w-10 text-primary" />
      <h1 className="font-headline text-4xl font-bold text-primary">QueryFire</h1>
    </div>
  );
}
