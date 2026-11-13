// Componentes base no padrão do shadcn/ui (DEC-14), escritos aqui, sem a biblioteca nem o
// Radix: mesmas variantes, nomes e classes Tailwind que qualquer dev reconhece.

import type { ComponentProps, ReactNode } from 'react';

/** Junta classes (o shadcn usa clsx + tailwind-merge; aqui basta isto). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function Card({ className, ...p }: ComponentProps<'section'>) {
  return <section className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...p} />;
}

export function CardHeader({ className, ...p }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} {...p} />;
}

export function CardTitle({ className, ...p }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-lg leading-tight font-semibold tracking-tight', className)} {...p} />;
}

export function CardDescription({ className, ...p }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...p} />;
}

export function CardContent({ className, ...p }: ComponentProps<'div'>) {
  return <div className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...p} />;
}

export function CardFooter({ className, ...p }: ComponentProps<'div'>) {
  return <div className={cn('border-t px-5 py-4 text-xs text-muted-foreground sm:px-6', className)} {...p} />;
}

export function Badge({ className, variante = 'secondary', ...p }: ComponentProps<'span'> & { variante?: 'secondary' | 'outline' | 'default' }) {
  const estilos = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'text-foreground',
  };
  return <span className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', estilos[variante], className)} {...p} />;
}

export function botao(variante: 'default' | 'outline' | 'ghost' | 'link' = 'default', tamanho: 'default' | 'sm' | 'lg' = 'default'): string {
  const v = {
    default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:no-underline',
    outline: 'border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:no-underline',
    ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground hover:no-underline',
    link: 'text-primary underline-offset-4 hover:underline',
  };
  const t = { default: 'h-11 px-4', sm: 'h-11 px-3 text-sm', lg: 'h-12 px-6 text-base' };
  return cn('inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', v[variante], t[tamanho]);
}

/** Classes do Input do shadcn/ui, com espaço para ícone à esquerda. */
export const classeInput =
  'flex h-11 w-full rounded-lg border border-input bg-background pr-3 pl-10 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/25 md:text-sm';

export function Separator({ className }: { className?: string }) {
  return <hr className={cn('my-4 border-t', className)} />;
}

/** Ícone dentro do campo, à esquerda (padrão de busca). */
export function CampoComIcone({ icone, children, className }: { icone: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">{icone}</span>
      {children}
    </div>
  );
}

/** Select no mesmo padrão do Input (sem o espaço do ícone). */
export const classeSelect = classeInput.replace('pl-10', 'pl-3');
