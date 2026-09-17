import { useEffect } from 'react'
import { NavLink, Outlet, ScrollRestoration, useNavigate } from 'react-router-dom'
import { ExternalLink, LayoutDashboard, LogOut, Package } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/admin', label: 'لوحة التحكم', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'المنتجات', Icon: Package, end: false },
]

export function AdminLayout() {
  const { session, signOut } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()

  // Lets global overlays (toast viewport) offset themselves above the admin bottom nav.
  useEffect(() => {
    document.body.dataset.shell = 'admin'
    return () => {
      delete document.body.dataset.shell
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    show('تم تسجيل الخروج', 'info')
    navigate('/admin/login', { replace: true })
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex h-11 items-center gap-3 rounded-md px-3 text-[15px] transition-colors',
      isActive ? 'bg-blush text-brown' : 'text-brown-2 hover:bg-brown/5 hover:text-brown',
    )

  return (
    <div className="flex min-h-dvh flex-col bg-ivory lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-line bg-cream/50 px-4 py-6 lg:flex">
        <div className="px-3">
          <p className="text-[1.75rem] font-light leading-none text-brown">{siteConfig.name}</p>
          <p className="mt-1 text-xs text-muted">لوحة الإدارة</p>
        </div>
        <nav aria-label="قائمة الإدارة" className="mt-8 flex flex-col gap-1">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="size-[18px]" aria-hidden />
              {label}
            </NavLink>
          ))}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-3 rounded-md px-3 text-[15px] text-brown-2 transition-colors hover:bg-brown/5 hover:text-brown"
          >
            <ExternalLink className="size-[18px]" aria-hidden />
            عرض المتجر
          </a>
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate px-3 text-xs text-muted" title={session?.username}>
            {session?.username}
          </p>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-1 flex h-11 w-full items-center gap-3 rounded-md px-3 text-[15px] text-brown-2 transition-colors hover:bg-brown/5 hover:text-brown"
          >
            <LogOut className="size-[18px]" aria-hidden />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-ivory/90 px-4 backdrop-blur-md lg:hidden">
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-light leading-none text-brown">{siteConfig.name}</span>
          <span className="text-xs text-muted">الإدارة</span>
        </p>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          aria-label="تسجيل الخروج"
          className="inline-flex size-11 items-center justify-center rounded-md text-brown-2 hover:bg-brown/5"
        >
          <LogOut className="size-5" aria-hidden />
        </button>
      </header>

      <main id="main" className="min-w-0 flex-1 pb-24 lg:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="قائمة الإدارة"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {nav.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn('flex h-16 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-brown' : 'text-muted')
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('inline-flex h-7 w-12 items-center justify-center rounded-full', isActive && 'bg-blush')}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex h-16 flex-col items-center justify-center gap-1 text-xs text-muted">
          <span className="inline-flex h-7 w-12 items-center justify-center">
            <ExternalLink className="size-5" aria-hidden />
          </span>
          المتجر
        </a>
      </nav>
      <ScrollRestoration />
    </div>
  )
}
