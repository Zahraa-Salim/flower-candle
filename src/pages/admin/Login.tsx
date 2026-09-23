import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { useAuth } from '@/hooks/useAuth'
import { useSiteContent } from '@/hooks/useSiteContent'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { InputField } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Petal } from '@/components/ui/Petal'
import { SmartImage } from '@/components/ui/SmartImage'

export default function AdminLoginPage() {
  useDocumentMeta('تسجيل الدخول')
  const { isAuthenticated, isConfigured, signIn } = useAuth()
  const { content } = useSiteContent()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to={from} replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (username.trim() === '') next.username = 'أدخلي اسم المستخدم'
    if (password === '') next.password = 'أدخلي كلمة المرور'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await signIn(username, password)
      navigate(from, { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'تعذّر تسجيل الدخول' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-dvh bg-ivory lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <Link to="/" className="inline-flex h-10 items-center gap-2 self-start text-sm text-muted hover:text-brown">
          <ArrowLeft className="size-4 rotate-180" aria-hidden />
          العودة إلى المتجر
        </Link>

        <div className="my-auto w-full max-w-sm py-10">
          <Petal className="mb-4 size-6 text-rose" />
          <p className="text-[2.25rem] font-light leading-none text-brown">{siteConfig.name}</p>
          <h1 className="mt-4 text-xl font-medium text-brown">تسجيل الدخول إلى لوحة الإدارة</h1>
          <p className="mt-1 text-sm text-muted">أدخلي بياناتك للمتابعة.</p>

          {!isConfigured && (
            <p role="alert" className="mt-6 rounded-md bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              لم يتم ضبط بيانات الدخول للوضع التجريبي. أضيفي <span className="num" dir="ltr">VITE_ADMIN_USERNAME</span> و{' '}
              <span className="num" dir="ltr">VITE_ADMIN_PASSWORD</span> في ملف <span className="num" dir="ltr">.env</span> ثم أعيدي التشغيل.
            </p>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-8 flex flex-col gap-5">
            <InputField
              label="اسم المستخدم"
              type="text"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              dir="ltr"
              className="[&_input]:text-start"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setErrors((prev) => ({ ...prev, username: undefined, form: undefined }))
              }}
              error={errors.username}
              required
            />
            <div className="relative">
              <InputField
                label="كلمة المرور"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                dir="ltr"
                className="[&_input]:text-start [&_input]:pe-12"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors((prev) => ({ ...prev, password: undefined, form: undefined }))
                }}
                error={errors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-pressed={showPassword}
                className="absolute top-[1.85rem] start-1 inline-flex size-10 items-center justify-center rounded-sm text-muted hover:text-brown"
              >
                {showPassword ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
              </button>
            </div>

            {errors.form && (
              <p role="alert" className="rounded-md bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                {errors.form}
              </p>
            )}

            <Button type="submit" size="lg" loading={submitting} disabled={!isConfigured} block>
              تسجيل الدخول
            </Button>
          </form>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <SmartImage src={content.hero.main} alt="" priority sizes="50vw" frameClassName="absolute inset-0 size-full" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brown/40 to-transparent" />
        <p className="absolute bottom-10 start-10 max-w-sm text-2xl font-light leading-relaxed text-ivory">{siteConfig.tagline}</p>
      </div>
    </div>
  )
}
