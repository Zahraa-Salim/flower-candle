import { ArrowLeft } from 'lucide-react'
import { images } from '@/data/images'
import { ButtonLink } from '@/components/ui/Button'
import { SmartImage } from '@/components/ui/SmartImage'

export function GiftSection() {
  return (
    <section aria-labelledby="gift-title" className="bg-blush/60">
      <div className="container-x grid items-center gap-8 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
        <div className="lg:col-span-5">
          <SmartImage
            src={images.gift}
            alt="علبة هدية مغلّفة بورق مزهر وشريط وردي حريري"
            sizes="(min-width: 1024px) 40vw, 90vw"
            frameClassName="aspect-[4/3] rounded-md lg:aspect-[4/5]"
          />
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <h2 id="gift-title" className="h-section">
            هدية فيها شغف
          </h2>
          <p className="mt-5 max-w-lg text-xl font-light leading-relaxed text-brown sm:text-2xl">
            لأن الهدية الجميلة لا تحتاج إلى مناسبة… أحياناً يكفي أن تقول لشخص ما: فكرت فيك.
          </p>
          <ButtonLink
            to="/products?category=gifts"
            size="lg"
            variant="secondary"
            className="mt-8"
            iconEnd={<ArrowLeft className="size-4" aria-hidden />}
          >
            اكتشفي الهدايا
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
