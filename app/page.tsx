import HeroInmersivo from '@/components/sections/HeroInmersivo';
import { Ecosistema } from '@/components/sections/Ecosistema';
import { Clientes } from '@/components/sections/Clientes';
import { Productores } from '@/components/sections/Productores';
import { Impacto } from '@/components/sections/Impacto';
import { Contacto } from '@/components/sections/Contacto';
import { CompanyStats } from '@/components/sections/CompanyStats';
import QuienesSomos from '@/components/sections/QuienesSomos';
import { MisionVision } from '@/components/sections/MisionVision';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SectionContainer } from '@/components/layout/SectionContainer';

export default function Home() {
  return (
    <>
      <Header />

      <main className="flex flex-col w-full">
        {/* HOME HERO SECTION */}
        <HeroInmersivo
          showHudCards={false}
          kicker=""
          chipBL=""
          chipBR=""
          stats={[]}
          scrollLabel=""
          ctas={[]}
        />

        {/* QUIÉNES SOMOS — dark Boomitra-style section with 3D globe */}
        <QuienesSomos />

        {/* Operación en números — sits up against QuienesSomos above on
            desktop; on mobile we relax the negative margin so both blocks
            breathe more (the globe sits lower and Stats follows). */}
        <SectionContainer background="white" padding="lg" className="!pt-0 !pb-28 -mt-4 lg:-mt-16">
          <CompanyStats />
        </SectionContainer>

        {/* MISIÓN Y VISIÓN */}
        <MisionVision />

        {/* ECOSISTEMA */}
        <Ecosistema />

        {/* CLIENTES */}
        <Clientes />

        {/* PRODUCTORES */}
        <Productores />

        {/* IMPACTO */}
        <Impacto />

        {/* CONTACTO */}
        <Contacto />
      </main>

      <Footer />
    </>
  );
}
