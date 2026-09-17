import { useCallback, useState, type ImgHTMLAttributes } from 'react'
import { ImageOff } from 'lucide-react'
import { responsiveSrcSet } from '@/data/images'
import { cn } from '@/lib/utils'

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string
  alt: string
  /** Wrapper classes (aspect ratio, radius, etc.) */
  frameClassName?: string
  /** `sizes` attribute for responsive selection */
  sizes?: string
  priority?: boolean
}

/**
 * Image with a soft placeholder while loading, lazy loading by default, an
 * automatic srcSet for Unsplash sources, and a graceful broken-image state.
 */
export function SmartImage({ src, alt, frameClassName, className, sizes, priority, ...rest }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  // Reset when the source changes (render-time state adjustment), so a row whose
  // image URL was edited does not keep the previous load/fail state.
  const [lastSrc, setLastSrc] = useState(src)
  if (lastSrc !== src) {
    setLastSrc(src)
    setLoaded(false)
    setFailed(false)
  }

  // Catch images that finished loading (from cache) before React attached onLoad.
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true)
  }, [])

  const decorative = alt === ''

  return (
    <div className={cn('relative overflow-hidden bg-cream', frameClassName)}>
      {!loaded && !failed && <div aria-hidden className="shimmer absolute inset-0" />}
      {failed ? (
        <div
          {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': alt })}
          className="absolute inset-0 flex items-center justify-center text-muted/60"
        >
          <ImageOff className="size-7" aria-hidden />
        </div>
      ) : (
        <img
          ref={ref}
          src={src}
          srcSet={responsiveSrcSet(src)}
          sizes={sizes ?? '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'size-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            className,
          )}
          {...rest}
        />
      )}
    </div>
  )
}
