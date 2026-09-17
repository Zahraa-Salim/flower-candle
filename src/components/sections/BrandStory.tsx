import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { images } from '@/data/images'
import { SmartImage } from '@/components/ui/SmartImage'
import { Petal } from '@/components/ui/Petal'

export function BrandStory() {
  return (
    <section aria-labelledby="story-title" className="bg-cream">
      <div className="container-x grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-28">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <Petal className="mb-4 size-5 text-rose" />
          <h2 id="story-title" className="h-section">
            وراء كل تفصيل… شغف
          </h2>
          <p className="lead mt-6 max-w-lg">
            في شغف، نؤمن أن أجمل الهدايا هي التي تحمل جزءاً من الشعور الذي صُنعت به. لذلك نصنع كل شمعة يدوياً،
            وننسّق كل وردة وباقة بعناية، لنحوّل التفاصيل الصغيرة إلى لحظات تستحق أن تُحفظ.
          </p>
          <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
            <div>
              <dt className="text-xs text-muted">الصناعة</dt>
              <dd className="mt-1 text-[15px] font-medium text-brown">يدوية بالكامل</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">المواد</dt>
              <dd className="mt-1 text-[15px] font-medium text-brown">شمع نباتي</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">التغليف</dt>
              <dd className="mt-1 text-[15px] font-medium text-brown">جاهز للإهداء</dd>
            </div>
          </dl>
          <Link to="/about" className="group mt-8 inline-flex h-11 items-center gap-2 text-brown-2 hover:text-brown">
            اقرئي قصتنا كاملة
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-sm lg:order-2 lg:col-span-5 lg:col-start-8 lg:max-w-none">
          <SmartImage
            src={images.story}
            alt="وردة وردية واحدة في قارورة زجاجية على جدار وردي يضيئه ضوء النافذة"
            sizes="(min-width: 1024px) 40vw, 90vw"
            frameClassName="arch aspect-[4/5]"
          />
          <div
            aria-hidden
            className="absolute -bottom-5 -start-5 flex size-24 items-center justify-center rounded-full border border-rose/40 bg-ivory text-center text-[11px] leading-tight text-rose-deep lg:size-28 lg:text-xs"
          >
            صُنع
            <br />
            يدوياً
            <br />
            بحب
          </div>
        </div>
      </div>
    </section>
  )
}
