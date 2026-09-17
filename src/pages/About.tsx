import { ArrowLeft } from 'lucide-react'
import { images } from '@/data/images'
import { siteConfig } from '@/config/site'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { SmartImage } from '@/components/ui/SmartImage'
import { ButtonLink } from '@/components/ui/Button'
import { Petal } from '@/components/ui/Petal'
import { Process } from '@/components/sections/Process'
import { WhatsAppCta } from '@/components/sections/WhatsAppCta'

const values = [
  {
    title: 'حب',
    text: 'نبدأ كل قطعة بسؤال بسيط: لمن ستُهدى؟ الجواب يقود كل قرار بعده.',
  },
  {
    title: 'حِرفية',
    text: 'كل بتلة تُشكّل يدوياً. لا قوالب متطابقة، ولا قطعتان متشابهتان تماماً.',
  },
  {
    title: 'تفاصيل',
    text: 'اللون، الرائحة، الشريط، وطريقة التغليف… كلها تُختار لتكمّل بعضها.',
  },
]

export default function AboutPage() {
  useDocumentMeta('قصتنا', 'قصة شغف: ورشة صغيرة تصنع شموعاً على شكل ورود وباقات يدوياً، بحب وشغف.')

  return (
    <>
      <section className="container-x grid items-center gap-10 pt-10 pb-16 lg:grid-cols-12 lg:gap-12 lg:pt-16 lg:pb-24">
        <div className="lg:col-span-6">
          <Petal className="mb-4 size-5 text-rose" />
          <h1 className="h-section">قصتنا</h1>
          <p className="mt-6 text-xl font-light leading-relaxed text-brown sm:text-2xl">
            بدأت {siteConfig.name} من طاولة صغيرة، وشمعة واحدة على شكل وردة، وفكرة واحدة: أن الهدية يمكن أن تكون
            شعوراً قبل أن تكون شيئاً.
          </p>
          <div className="lead mt-6 flex max-w-lg flex-col gap-4">
            <p>
              اليوم ما زلنا نصنع كل قطعة بالطريقة نفسها. نختار الشمع النباتي والألوان الهادئة، نصبّ الورود ونشكّلها
              يدوياً، ثم ننسّقها في باقات وتشكيلات صغيرة تليق بلحظة تُهدى فيها.
            </p>
            <p>
              لا نؤمن بالإنتاج بالجملة. نؤمن أن التفاصيل الصغيرة، حين تُصنع بشغف، تبقى في الذاكرة أطول من أي شيء آخر.
            </p>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm lg:col-span-5 lg:col-start-8 lg:max-w-none">
          <SmartImage
            src={images.story}
            alt="وردة وردية في قارورة زجاجية على جدار وردي"
            priority
            sizes="(min-width: 1024px) 40vw, 90vw"
            frameClassName="arch aspect-[4/5]"
          />
        </div>
      </section>

      <section aria-labelledby="values-title" className="bg-cream">
        <div className="container-x py-16 lg:py-24">
          <h2 id="values-title" className="h-section">
            ما نؤمن به
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6 lg:mt-12">
            {values.map((v) => (
              <div key={v.title} className="border-t border-rose/40 pt-5">
                <h3 className="text-2xl font-light text-brown">{v.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-brown-2">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Process />

      <section className="container-x pb-16 lg:pb-24">
        <div className="grid gap-3 sm:grid-cols-3">
          <SmartImage src={images.process} alt="يد تحمل وردة كريمية في ضوء النافذة" sizes="33vw" frameClassName="aspect-[4/5] rounded-md" />
          <SmartImage src={images.candlesTrio} alt="ثلاث شموع كريمية مضاءة" sizes="33vw" frameClassName="aspect-[4/5] rounded-md" />
          <SmartImage src={images.lisianthus} alt="ورود وردية وبيضاء مربوطة بشريط" sizes="33vw" frameClassName="aspect-[4/5] rounded-md" />
        </div>
        <div className="mt-10 flex justify-center">
          <ButtonLink to="/products" size="lg" iconEnd={<ArrowLeft className="size-4" aria-hidden />}>
            اكتشفي المجموعة
          </ButtonLink>
        </div>
      </section>

      <WhatsAppCta />
    </>
  )
}
