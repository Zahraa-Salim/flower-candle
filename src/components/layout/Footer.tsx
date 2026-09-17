import { Link } from 'react-router-dom'
import { siteConfig } from '@/config/site'
import { generalWhatsappUrl } from '@/lib/whatsapp'
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/BrandIcons'
import { Petal } from '@/components/ui/Petal'

const nav = [
  { to: '/products', label: 'المنتجات' },
  { to: '/about', label: 'قصتنا' },
  { to: '/cart', label: 'السلة' },
]

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-line bg-cream/60">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-16">
        <div>
          <p className="text-[2rem] font-light leading-none text-brown">{siteConfig.name}</p>
          <p className="mt-3 max-w-xs text-brown-2">{siteConfig.tagline}</p>
          <p className="mt-4 max-w-sm text-sm text-muted">
            شموع على شكل ورود وباقات مصنوعة يدوياً، تُهدى لمن نحب.
          </p>
        </div>

        <nav aria-label="روابط التذييل">
          <h2 className="mb-4 text-sm font-medium text-brown">تصفحي</h2>
          <ul className="flex flex-col gap-2.5">
            {nav.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="inline-flex min-h-8 items-center text-brown-2 transition-colors hover:text-brown">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-sm font-medium text-brown">تواصلي معنا</h2>
          <ul className="flex flex-col gap-2.5">
            <li>
              <a
                href={generalWhatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-2 text-brown-2 transition-colors hover:text-brown"
              >
                <WhatsAppIcon className="size-4 text-sage-deep" />
                واتساب
              </a>
            </li>
            {siteConfig.social.instagram && (
              <li>
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-8 items-center gap-2 text-brown-2 transition-colors hover:text-brown"
                >
                  <InstagramIcon className="size-4 text-rose-deep" />
                  إنستغرام
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-start gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2">
            <Petal className="size-3.5 text-rose" />
            <span className="num">© {year}</span> {siteConfig.name}. جميع الحقوق محفوظة.
          </p>
          <p>صُنع بكل حب وشغف.</p>
        </div>
      </div>
    </footer>
  )
}
