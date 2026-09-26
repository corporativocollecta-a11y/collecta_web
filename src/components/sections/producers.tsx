import { ProducerCarousel } from "@/components/producer-carousel";
import type { Lang } from "@/lib/i18n";

export function Producers({ lang }: { lang: Lang }) {
  return (
    <section id="productores" className="relative isolate overflow-hidden pb-18 sm:pb-24">
      <ProducerCarousel lang={lang} />
    </section>
  );
}
