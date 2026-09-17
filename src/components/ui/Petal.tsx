import { cn } from '@/lib/utils'

/** The brand ornament: a single soft petal. Used sparingly as a section marker. */
export function Petal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-5', className)} fill="currentColor">
      <path d="M12 2.5c-2.6 5.2-8 7.9-8 13.6A8 8 0 0 0 20 16.1C20 10.4 14.6 7.7 12 2.5Z" opacity="0.9" />
      <path d="M12 9c-1.1 2.4-3.6 3.7-3.6 6.3a3.6 3.6 0 0 0 7.2 0C15.6 12.7 13.1 11.4 12 9Z" fill="#FBF7F2" opacity="0.7" />
    </svg>
  )
}

/** A rose bud silhouette used for the process step icons. */
export function RoseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-5', className)} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21v-6" />
      <path d="M12 15c-3.5 0-6-2.5-6-6a6 6 0 0 1 12 0c0 3.5-2.5 6-6 6Z" />
      <path d="M9.5 9.5c.5 1.5 1.5 2.5 2.5 2.5s2-1 2.5-2.5" />
      <path d="M8 18c1.5-1 3-1 4 0" />
    </svg>
  )
}
