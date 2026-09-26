"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/lang-provider";
import type { Copy, Lang } from "@/lib/i18n";

/* International dialling code picker: the trigger shows the code, the list shows every
   country by name with its code and can be searched by either ("mex", "52", "+1"). */

type Country = { iso: string; name: Record<Lang, string>; code: string };

// Collecta's markets and neighbours first, then the rest of the Americas and Europe
const TOP: Country[] = [
  { iso: "MX", name: { en: "Mexico", es: "México" }, code: "+52" },
  { iso: "US", name: { en: "United States", es: "Estados Unidos" }, code: "+1" },
  { iso: "CA", name: { en: "Canada", es: "Canadá" }, code: "+1" },
];
const REST: Country[] = [
  { iso: "AR", name: { en: "Argentina", es: "Argentina" }, code: "+54" },
  { iso: "BZ", name: { en: "Belize", es: "Belice" }, code: "+501" },
  { iso: "BO", name: { en: "Bolivia", es: "Bolivia" }, code: "+591" },
  { iso: "BR", name: { en: "Brazil", es: "Brasil" }, code: "+55" },
  { iso: "CL", name: { en: "Chile", es: "Chile" }, code: "+56" },
  { iso: "CO", name: { en: "Colombia", es: "Colombia" }, code: "+57" },
  { iso: "CR", name: { en: "Costa Rica", es: "Costa Rica" }, code: "+506" },
  { iso: "CU", name: { en: "Cuba", es: "Cuba" }, code: "+53" },
  { iso: "EC", name: { en: "Ecuador", es: "Ecuador" }, code: "+593" },
  { iso: "SV", name: { en: "El Salvador", es: "El Salvador" }, code: "+503" },
  { iso: "GT", name: { en: "Guatemala", es: "Guatemala" }, code: "+502" },
  { iso: "HN", name: { en: "Honduras", es: "Honduras" }, code: "+504" },
  { iso: "NI", name: { en: "Nicaragua", es: "Nicaragua" }, code: "+505" },
  { iso: "PA", name: { en: "Panama", es: "Panamá" }, code: "+507" },
  { iso: "PY", name: { en: "Paraguay", es: "Paraguay" }, code: "+595" },
  { iso: "PE", name: { en: "Peru", es: "Perú" }, code: "+51" },
  { iso: "PR", name: { en: "Puerto Rico", es: "Puerto Rico" }, code: "+1" },
  {
    iso: "DO",
    name: { en: "Dominican Republic", es: "República Dominicana" },
    code: "+1",
  },
  { iso: "UY", name: { en: "Uruguay", es: "Uruguay" }, code: "+598" },
  { iso: "VE", name: { en: "Venezuela", es: "Venezuela" }, code: "+58" },
  { iso: "DE", name: { en: "Germany", es: "Alemania" }, code: "+49" },
  { iso: "ES", name: { en: "Spain", es: "España" }, code: "+34" },
  { iso: "FR", name: { en: "France", es: "Francia" }, code: "+33" },
  { iso: "IT", name: { en: "Italy", es: "Italia" }, code: "+39" },
  { iso: "NL", name: { en: "Netherlands", es: "Países Bajos" }, code: "+31" },
  { iso: "GB", name: { en: "United Kingdom", es: "Reino Unido" }, code: "+44" },
  { iso: "CN", name: { en: "China", es: "China" }, code: "+86" },
  { iso: "KR", name: { en: "South Korea", es: "Corea del Sur" }, code: "+82" },
  { iso: "JP", name: { en: "Japan", es: "Japón" }, code: "+81" },
];
const ALL = [...TOP, ...REST];
// the rest of the list, alphabetical by the name the visitor reads
const SORTED: Copy<Country[]> = {
  en: [...REST].sort((a, b) => a.name.en.localeCompare(b.name.en, "en")),
  es: [...REST].sort((a, b) => a.name.es.localeCompare(b.name.es, "es")),
};

const T: Copy<{
  lada: string;
  search: string;
  empty: string;
  top: string;
  all: string;
}> = {
  en: {
    lada: "Country code",
    search: "Search country or code",
    empty: "No results",
    top: "Main",
    all: "All countries",
  },
  es: {
    lada: "Lada",
    search: "Busca país o lada",
    empty: "Sin resultados",
    top: "Principales",
    all: "Todos los países",
  },
};

export function CountryCode({
  id,
  iso,
  onChange,
}: {
  id: string;
  iso: string;
  onChange: (c: Country) => void;
}) {
  const lang = useLang();
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const current = ALL.find((c) => c.iso === iso) ?? TOP[0];

  const item = (c: Country) => (
    <CommandItem
      key={c.iso}
      value={`${c.name[lang]} ${c.code} ${c.iso}`}
      data-checked={c.iso === current.iso}
      onSelect={() => {
        onChange(c);
        setOpen(false);
      }}
      className="gap-3 py-2"
    >
      <span className="w-6 font-mono text-[11px] text-muted-foreground">
        {c.iso}
      </span>
      <span className="flex-1">{c.name[lang]}</span>
      <span className="font-mono text-xs text-foreground/70">{c.code}</span>
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={`${t.lada}: ${current.name[lang]} ${current.code}`}
          className="press flex h-12 w-[6.5rem] shrink-0 items-center justify-between gap-1 rounded-xl border border-(--line) bg-foreground/[0.03] px-3 text-base text-foreground transition-[border-color,background-color] duration-150 ease-(--ease-out) hover:border-foreground/25 focus-visible:border-primary focus-visible:outline-none data-[state=open]:border-primary"
        >
          <span className="flex items-baseline gap-1.5">
            <span className="font-mono text-[10px] text-muted-foreground">
              {current.iso}
            </span>
            {current.code}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-foreground/50 transition-transform duration-200 ease-(--ease-out)",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={t.search} />
          <CommandList className="max-h-72">
            <CommandEmpty>{t.empty}</CommandEmpty>
            <CommandGroup heading={t.top}>{TOP.map(item)}</CommandGroup>
            <CommandGroup heading={t.all}>
              {SORTED[lang].map(item)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
