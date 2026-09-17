import { NavLink } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { generalWhatsappUrl } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { Drawer } from '@/components/ui/Drawer'
import { ButtonAnchor } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'

const links = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/products', label: 'المنتجات' },
  { to: '/about', label: 'قصتنا' },
  { to: '/cart', label: 'السلة' },
]

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={siteConfig.name}
      footer={
        <ButtonAnchor
          href={generalWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          block
          icon={<WhatsAppIcon className="size-5" />}
        >
          تواصلي معنا عبر واتساب
        </ButtonAnchor>
      }
    >
      <p className="mb-6 text-sm text-muted">{siteConfig.tagline}</p>
      <nav aria-label="قائمة الجوال" className="flex flex-col">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'group flex min-h-13 items-center justify-between border-b border-line py-3 text-lg transition-colors',
                isActive ? 'text-brown' : 'text-brown-2 hover:text-brown',
              )
            }
          >
            {item.label}
            <ArrowLeft className="size-4 text-rose opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
          </NavLink>
        ))}
      </nav>
    </Drawer>
  )
}
