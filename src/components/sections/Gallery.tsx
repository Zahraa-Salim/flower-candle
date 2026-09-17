import { galleryImages } from '@/data/images'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { SmartImage } from '@/components/ui/SmartImage'
import { InstagramIcon } from '@/components/ui/BrandIcons'

export function Gallery() {
  return (
    <section aria-labelledby="gallery-title" className="section-y">
      <div className="container-x">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="gallery-title" className="h-section">
              لحظات من شغف
            </h2>
            <p className="lead mt-2">من الورشة إلى بيوتكم.</p>
          </div>
          {siteConfig.social.instagram && (
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 text-brown-2 hover:text-brown"
            >
              <InstagramIcon className="size-4" />
              تابعينا على إنستغرام
            </a>
          )}
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-2 sm:gap-3 lg:mt-12 lg:grid-cols-4 lg:grid-flow-dense">
          {galleryImages.map((img, i) => (
            <li key={i} className={cn(img.tall && 'row-span-2')}>
              <SmartImage
                src={img.src}
                alt={img.alt}
                sizes="(min-width: 1024px) 25vw, 50vw"
                frameClassName={cn('size-full rounded-sm', img.tall ? 'aspect-[1/2]' : 'aspect-square')}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
