import HeroInmersivo from '@/components/sections/HeroInmersivo';
import { Ecosistema } from '@/components/sections/Ecosistema';
import { Clientes } from '@/components/sections/Clientes';
import { Productores } from '@/components/sections/Productores';
import { Impacto } from '@/components/sections/Impacto';
import { Contacto } from '@/components/sections/Contacto';
import { CompanyStats } from '@/components/sections/CompanyStats';
import QuienesSomos from '@/components/sections/QuienesSomos';
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

        {/* Operación en números — sits up against QuienesSomos above */}
        <SectionContainer background="white" padding="lg" className="!pt-0 !pb-28 -mt-16">
          <CompanyStats title="Operación en números" />
        </SectionContainer>

        {/* MISIÓN Y VISIÓN */}
        <section
          className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
          style={{ background: '#0f1612' }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <p
                className="text-xl sm:text-2xl font-bold mb-8"
                style={{ color: '#4ADE80' }}
              >
                Nuestra razón de ser
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Misión card */}
              <a
                href="#productores"
                className="group relative rounded-3xl overflow-hidden block min-h-[432px] sm:min-h-[468px] shadow-xl hover:shadow-2xl transition-shadow duration-500"
              >
                <img
                  src="/mision-vision/mision.jpeg"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ objectPosition: '50% 0%' }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(22, 65, 40, 0) 0%, rgba(22, 65, 40, 0) 55%, rgba(35, 95, 60, 0.65) 70%, rgba(22, 65, 40, 0.92) 100%)',
                  }}
                />
                <div className="relative z-10 px-8 sm:px-10 lg:px-12 pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-9 lg:pb-10 flex flex-col h-full justify-end min-h-[432px] sm:min-h-[468px]">
                  <h3 className="font-sans text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
                    Misión
                  </h3>
                  <p className="text-[1.2rem] sm:text-[1.35rem] text-white/90 leading-relaxed min-h-[6.5rem] sm:min-h-[7.5rem]">
                    Fortalecer a los productores agrícolas que sostienen el sistema alimentario
                    del mundo.
                  </p>
                </div>
              </a>

              {/* Visión card */}
              <a
                href="#ecosistema"
                className="group relative rounded-3xl overflow-hidden block min-h-[432px] sm:min-h-[468px] shadow-xl hover:shadow-2xl transition-shadow duration-500"
              >
                <img
                  src="/mision-vision/vision.jpeg"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(15, 30, 55, 0) 0%, rgba(15, 30, 55, 0) 55%, rgba(30, 58, 95, 0.65) 70%, rgba(15, 30, 55, 0.92) 100%)',
                  }}
                />
                <div className="relative z-10 px-8 sm:px-10 lg:px-12 pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-9 lg:pb-10 flex flex-col h-full justify-end min-h-[432px] sm:min-h-[468px]">
                  <h3 className="font-sans text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
                    Visión
                  </h3>
                  <p className="text-[1.2rem] sm:text-[1.35rem] text-white/90 leading-relaxed min-h-[6.5rem] sm:min-h-[7.5rem]">
                    Transformar estructuralmente el sistema agroalimentario en una operación
                    trazable, tecnológica y sostenible, generando valor para productores,
                    mercados y comunidades.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </section>

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
