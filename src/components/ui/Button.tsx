import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'whatsapp'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium select-none whitespace-nowrap ' +
  'transition-[background-color,color,border-color,transform,box-shadow,filter] duration-200 ease-(--ease-soft) ' +
  'active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100'

// Contrast (WCAG AA): the light sage / muted-rose fills keep the brief's palette, so they carry
// the darkest brown as text (5.08 and 5.65 against the fills) instead of white (2.25 / 2.55).
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brown text-ivory hover:bg-brown-2',
  secondary: 'bg-rose-soft text-brown hover:brightness-95',
  outline: 'border border-line-strong text-brown bg-transparent hover:bg-brown/5 hover:border-brown-2',
  ghost: 'text-brown hover:bg-brown/5',
  danger: 'bg-danger-soft text-danger hover:bg-danger hover:text-paper',
  whatsapp: 'bg-sage text-brown hover:brightness-95',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 sm:h-13 px-6 text-base',
}

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  block?: boolean
  icon?: ReactNode
  iconEnd?: ReactNode
  className?: string
  children?: ReactNode
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, block, icon, iconEnd, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {!loading && iconEnd}
    </button>
  )
})

export type ButtonLinkProps = CommonProps & LinkProps

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  iconEnd,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], block && 'w-full', className)} {...rest}>
      {icon}
      {children}
      {iconEnd}
    </Link>
  )
}

export function ButtonAnchor({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  iconEnd,
  className,
  children,
  ...rest
}: CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(base, variants[variant], sizes[size], block && 'w-full', className)} {...rest}>
      {icon}
      {children}
      {iconEnd}
    </a>
  )
}

/** Square icon-only button that always meets the 44px touch target. */
export function IconButton({
  label,
  className,
  children,
  variant = 'ghost',
  ...rest
}: { label: string } & Omit<ButtonProps, 'icon' | 'iconEnd' | 'size' | 'children'> & { children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-md transition-colors duration-200',
        'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
