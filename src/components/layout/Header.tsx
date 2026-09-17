import { useCallback, useState, useSyncExternalStore } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Search, ShoppingBag } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { useCart } from '@/hooks/useCart'
import { cn, pluralize, plurals } from '@/lib/utils'
import { MobileMenu } from './MobileMenu'

const publicNav = [
  { to: '/products', label: 'المنتجات' },
  { to: '/about', label: 'قصتنا' },
]

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

export function Header() {
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const scrolled = useSyncExternalStore(subscribeScroll, () => window.scrollY > 12, () => false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const { pathname } = useLocation()

  // Close the menu on any navigation, including browser back/forward (render-time state adjustment).
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMenuOpen(false)
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative inline-flex h-11 items-center px-1 text-[15px] transition-colors',
      'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-rose-ink after:transition-transform after:duration-300',
      isActive ? 'text-brown after:scale-x-100' : 'text-brown-2 hover:text-brown hover:after:scale-x-100',
    )

  return (
    <>
      <a
        href="#main"
        onClick={(e) => {
          // Global smooth scrolling is off (it animated every navigation); keep it for this one in-page jump.
          const main = document.getElementById('main')
          if (!main) return
          e.preventDefault()
          main.focus({ preventScroll: true })
          main.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:rounded-md focus:bg-brown focus:px-4 focus:py-2 focus:text-ivory"
      >
        انتقلي إلى المحتوى
      </a>
      <header
        className={cn(
          'sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300',
          scrolled ? 'border-b border-line bg-ivory/90 backdrop-blur-md' : 'border-b border-transparent bg-ivory',
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          <Link to="/" className="flex items-baseline gap-3" aria-label={`${siteConfig.name} — الصفحة الرئيسية`}>
            <span className="text-[1.75rem] font-light leading-none text-brown lg:text-[2rem]">{siteConfig.name}</span>
            <span className="hidden text-xs text-muted md:inline">{siteConfig.tagline}</span>
          </Link>

          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-7 lg:flex">
            {publicNav.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link
              to="/products?focus=search"
              aria-label="البحث في المنتجات"
              className="inline-flex size-11 items-center justify-center rounded-md text-brown-2 transition-colors hover:bg-brown/5 hover:text-brown"
            >
              <Search className="size-5" aria-hidden />
            </Link>
            <Link
              to="/cart"
              aria-label={count > 0 ? `السلة، ${pluralize(count, plurals.piece)}` : 'السلة فارغة'}
              className="relative inline-flex size-11 items-center justify-center rounded-md text-brown-2 transition-colors hover:bg-brown/5 hover:text-brown"
            >
              <ShoppingBag className="size-5" aria-hidden />
              {count > 0 && (
                <span className="num absolute top-1 end-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-ink px-1 text-[11px] font-medium leading-none text-paper">
                  {count}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              className="inline-flex size-11 items-center justify-center rounded-md text-brown-2 transition-colors hover:bg-brown/5 hover:text-brown lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  )
}
