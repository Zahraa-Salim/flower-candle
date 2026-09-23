import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { useSiteContent } from '@/hooks/useSiteContent'
import { ButtonLink } from '@/components/ui/Button'
import { SmartImage } from '@/components/ui/SmartImage'

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const reduce = useReducedMotion()
  const { content, status, isCustomHero } = useSiteContent()
  // Wait for the stored content so an owner-uploaded photo is not preceded by a flash of the default.
  const ready = status !== 'loading'
  const fade = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease },
  })

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Soft organic wash behind the image side */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 top-10 h-[28rem] w-[28rem] rounded-[45%_55%_60%_40%/50%_40%_60%_50%] bg-blush/70 blur-2xl lg:-end-10 lg:top-16 lg:h-[36rem] lg:w-[36rem]"
      />

      <div className="container-x relative grid items-center gap-10 pt-10 pb-16 lg:grid-cols-12 lg:gap-8 lg:pt-16 lg:pb-24">
        <div className="lg:col-span-5">
          <motion.h1 {...fade(0)} id="hero-title" className="flex flex-col gap-3">
            <span className="display">{siteConfig.name}</span>
            {/* Whitespace node: ignored by flex layout, but keeps the accessible name from reading as one word. */}{' '}
            <span className="text-xl font-normal text-brown-2 sm:text-2xl">{siteConfig.tagline}</span>
          </motion.h1>
          <motion.p {...fade(0.12)} className="lead mt-6 max-w-md">
            شموع على شكل ورود وباقات مصنوعة يدوياً، بتفاصيل ناعمة صُممت لتكون هدية تحمل معنى.
          </motion.p>
          <motion.div {...fade(0.22)} className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/products" size="lg" iconEnd={<ArrowLeft className="size-4" aria-hidden />}>
              اكتشفي المجموعة
            </ButtonLink>
            <ButtonLink to="/about" size="lg" variant="ghost">
              قصتنا
            </ButtonLink>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="relative mx-auto w-full max-w-md lg:col-span-7 lg:col-start-6 lg:max-w-none"
        >
          <div className="lg:ms-10 lg:me-6">
            {ready ? (
              <SmartImage
                src={content.hero.main}
                alt={
                  isCustomHero('main')
                    ? `صورة من ${siteConfig.name}: شموع ورد مصنوعة يدوياً`
                    : 'شمعة وردية مضاءة بجانب ورود الرانونكولس على خلفية وردية ناعمة'
                }
                priority
                sizes="(min-width: 1024px) 50vw, 90vw"
                frameClassName="arch aspect-[4/5] lg:aspect-[5/6]"
              />
            ) : (
              <div aria-hidden className="shimmer arch aspect-[4/5] bg-cream lg:aspect-[5/6]" />
            )}
          </div>
          <div className="absolute -bottom-6 start-0 w-[38%] max-w-[13rem] lg:-bottom-10 lg:start-0">
            {ready ? (
              <SmartImage
                src={content.hero.detail}
                alt={
                  isCustomHero('detail')
                    ? `تفصيلة من منتجات ${siteConfig.name}`
                    : 'باقة ورود بألوان الخوخ والكريم مربوطة بشريط حريري'
                }
                priority
                sizes="220px"
                frameClassName="aspect-square rounded-md border-4 border-ivory shadow-lift"
              />
            ) : (
              <div aria-hidden className="shimmer aspect-square rounded-md border-4 border-ivory bg-cream shadow-lift" />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
