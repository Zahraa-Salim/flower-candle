import { generalWhatsappUrl } from '@/lib/whatsapp'
import { ButtonAnchor } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { Petal } from '@/components/ui/Petal'

export function WhatsAppCta() {
  return (
    <section aria-labelledby="wa-title" className="bg-sage-soft/60">
      <div className="container-x flex flex-col items-center py-16 text-center sm:py-20 lg:py-24">
        <Petal className="mb-4 size-6 text-sage-deep" />
        <h2 id="wa-title" className="h-section">
          وجدتِ شيئاً من شغف؟
        </h2>
        <p className="lead mt-4 max-w-md">أرسلي لنا القطعة التي أعجبتك، وسنساعدك في معرفة التفاصيل والتوفر.</p>
        <ButtonAnchor
          href={generalWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          size="lg"
          className="mt-8"
          icon={<WhatsAppIcon className="size-5" />}
        >
          تواصلي معنا عبر واتساب
        </ButtonAnchor>
      </div>
    </section>
  )
}
