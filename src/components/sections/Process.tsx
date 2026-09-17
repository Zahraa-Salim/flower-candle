import { Gift, Hand, Heart } from 'lucide-react'
import { RoseMark } from '@/components/ui/Petal'
import { SectionHeading } from '@/components/ui/SectionHeading'

const steps = [
  {
    n: '01',
    title: 'نختار التفاصيل',
    text: 'الشمع، الألوان، والروائح الهادئة التي تناسب كل قطعة.',
    Icon: RoseMark,
  },
  {
    n: '02',
    title: 'نصنعها يدوياً',
    text: 'كل وردة تُصبّ وتُشكّل بالأيدي، بتلة بعد بتلة.',
    Icon: Hand,
  },
  {
    n: '03',
    title: 'ننسّقها بحب',
    text: 'نرتّب الورود في باقات وتشكيلات متوازنة الألوان.',
    Icon: Heart,
  },
  {
    n: '04',
    title: 'تصبح جاهزة لتُهدى',
    text: 'نغلّفها بعناية لتصل كما تخيّلتِها تماماً.',
    Icon: Gift,
  },
]

export function Process() {
  return (
    <section aria-labelledby="process-title" className="section-y">
      <div className="container-x">
        <SectionHeading id="process-title" title="نصنعها بشغف" lead="أربع خطوات هادئة تمرّ بها كل قطعة قبل أن تصل إليك." />
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-x-reverse lg:divide-line">
          {steps.map(({ n, title, text, Icon }) => (
            <li key={n} className="flex flex-col lg:px-6 lg:first:ps-0 lg:last:pe-0">
              <div className="flex items-center justify-between">
                <span className="num text-3xl font-light text-rose">{n}</span>
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-blush text-rose-deep">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
              </div>
              <h3 className="mt-5 text-lg font-medium text-brown">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-brown-2">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
