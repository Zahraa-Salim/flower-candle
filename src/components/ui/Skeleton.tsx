import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('shimmer rounded-md', className)} />
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  )
}
