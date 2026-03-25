import HeroSection         from '@/components/home/HeroSection'
import MaatwerkSection     from '@/components/home/MaatwerkSection'
import DesignToolSection   from '@/components/home/DesignToolSection'
import ProductsSection     from '@/components/home/ProductsSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import DiyMaatwerkSection  from '@/components/home/DiyMaatwerkSection'
import PracticalInfoSection from '@/components/home/PracticalInfoSection'
import FinalCTA            from '@/components/home/FinalCTA'

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <DesignToolSection />
      <MaatwerkSection />
      <ProductsSection />
      <TestimonialsSection />
      <DiyMaatwerkSection />
      <PracticalInfoSection />
      <FinalCTA />
    </main>
  )
}
