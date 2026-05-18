import * as React from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg' | 'xl'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_8px_24px_-8px_rgba(160,65,0,0.40)] hover:opacity-90',
  secondary: 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high',
  ghost: 'bg-transparent text-on-surface hover:bg-surface-container-low',
  outline: 'border border-outline/20 text-on-surface-variant hover:text-primary hover:border-primary/30',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
  xl: 'px-8 py-4 text-base',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    />
  )
}

