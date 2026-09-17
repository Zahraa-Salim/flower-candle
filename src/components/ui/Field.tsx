import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

interface FieldShellProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}

function FieldShell({ label, hint, error, required, className, children }: FieldShellProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-brown">
        {label}
        {required && (
          <span className="text-rose-deep ms-1" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export const controlClass =
  'w-full rounded-md border bg-paper px-3.5 text-brown placeholder:text-muted/70 ' +
  'transition-[border-color,box-shadow] duration-200 ' +
  'focus:outline-none focus:border-rose focus:ring-3 focus:ring-rose/15 ' +
  'disabled:bg-cream disabled:text-muted disabled:cursor-not-allowed'

const okBorder = 'border-line hover:border-brown/25'
const errBorder = 'border-danger focus:border-danger focus:ring-danger/15'

type InputFieldProps = Omit<FieldShellProps, 'children'> & InputHTMLAttributes<HTMLInputElement>

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, hint, error, required, className, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(controlClass, 'h-11', invalid ? errBorder : okBorder)}
          {...rest}
        />
      )}
    </FieldShell>
  )
})

type TextareaFieldProps = Omit<FieldShellProps, 'children'> & TextareaHTMLAttributes<HTMLTextAreaElement>

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { label, hint, error, required, className, rows = 4, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(controlClass, 'py-2.5 resize-y min-h-24', invalid ? errBorder : okBorder)}
          {...rest}
        />
      )}
    </FieldShell>
  )
})

type SelectFieldProps = Omit<FieldShellProps, 'children'> &
  SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, required, className, children, ...rest },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(controlClass, 'h-11 appearance-none bg-no-repeat pe-10', invalid ? errBorder : okBorder)}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%237B706A' stroke-width='1.5' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundPosition: 'left 0.875rem center',
          }}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  )
})

/** Toggle switch with a visible label; state is also announced via aria-checked. */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-brown cursor-pointer">
          {label}
        </label>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200',
          // Invisible 44px hit area around the 28px track (touch target), without changing the visual.
          "before:absolute before:-inset-2 before:content-['']",
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-sage border-sage' : 'bg-cream border-line',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 size-5.5 rounded-full bg-paper shadow-sm transition-transform duration-200',
            'start-0.5',
            checked ? '-translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}
