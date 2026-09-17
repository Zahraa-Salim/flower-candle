import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { Hero } from '@/components/sections/Hero'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { Categories } from '@/components/sections/Categories'
import { BrandStory } from '@/components/sections/BrandStory'
import { Process } from '@/components/sections/Process'
import { GiftSection } from '@/components/sections/GiftSection'
import { Gallery } from '@/components/sections/Gallery'
import { WhatsAppCta } from '@/components/sections/WhatsAppCta'

export default function HomePage() {
  useDocumentMeta()
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Categories />
      <BrandStory />
      <Process />
      <GiftSection />
      <Gallery />
      <WhatsAppCta />
    </>
  )
}
