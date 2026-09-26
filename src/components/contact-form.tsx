"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Building2,
  Check,
  Mail,
  MessageCircle,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CountryCode } from "@/components/country-code";
import {
  CROP0,
  CropPicker,
  cropText,
  type CropValue,
} from "@/components/crop-picker";
import { EMAIL, WHATSAPP } from "@/lib/contact";
import { useLang } from "@/components/lang-provider";
import type { Copy, Lang } from "@/lib/i18n";

/* Contact form, field for field and word for word the live collectaproduce.com form,
   posting the same JSON to the same endpoint (/api/contact, type "cliente" | "productor").
   The amount of data is intentional: Collecta wants the full picture before calling.
   In this local draft the endpoint doesn't exist yet, so a failed send says so and offers
   WhatsApp and email instead of silently losing the request. */

const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? "/api/contact";
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type Audience = "cliente" | "productor";
type Errors = Record<string, string | undefined>;

/* `v` is what the API receives (Spanish, read by the team); `t` is only what the visitor sees */
const CARGOS: { v: string; t: Record<Lang, string> }[] = [
  { v: "Compras", t: { en: "Purchasing", es: "Compras" } },
  { v: "Calidad", t: { en: "Quality", es: "Calidad" } },
  { v: "Supply", t: { en: "Supply Chain", es: "Supply Chain" } },
  { v: "Otro", t: { en: "Other", es: "Otro" } },
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type ErrCopy = {
  required: string;
  cargo: string;
  email: string;
  tel: string;
  celular: string;
  consent: string;
  hectareas: string;
  experiencia: string;
  pozo: string;
  edad: string;
  network: string;
  send: string;
  review: string;
};
const ERRS: Copy<ErrCopy> = {
  en: {
    required: "Required",
    cargo: "Select a role",
    email: "Invalid email",
    tel: "Invalid phone number",
    celular: "Invalid mobile number",
    consent: "You must accept to continue",
    hectareas: "Must be greater than 0",
    experiencia: "Must be a valid number",
    pozo: "Select an option",
    edad: "Age must be between 18 and 100",
    network: "Connection error. Check your internet and try again.",
    review: "Your request wasn't sent. Check the fields marked in red.",
    send: "We couldn't send your message. Try again or write to us at contacto@collectaproduce.com",
  },
  es: {
    required: "Requerido",
    cargo: "Selecciona un cargo",
    email: "Email no válido",
    tel: "Teléfono no válido",
    celular: "Celular no válido",
    consent: "Debes aceptar para continuar",
    hectareas: "Debe ser mayor a 0",
    experiencia: "Debe ser un número válido",
    pozo: "Selecciona una opción",
    edad: "Edad debe estar entre 18 y 100",
    network: "Error de conexión. Verifica tu internet e intenta de nuevo.",
    review: "Tu solicitud no se envió. Revisa los campos marcados en rojo.",
    send: "No se pudo enviar el mensaje. Intenta de nuevo o escríbenos a contacto@collectaproduce.com",
  },
};
const SUCCESS: Copy<Record<Audience, { t: string; d: string }>> = {
  en: {
    cliente: {
      t: "Message received!",
      d: "Thanks for your interest in Collecta. Our team will get in touch with you shortly to see how we can work together.",
    },
    productor: {
      t: "Thanks for your interest!",
      d: "We've received your information. Someone from our technical team will reach out to learn about your farm and talk through co-production.",
    },
  },
  es: {
    cliente: {
      t: "¡Mensaje recibido!",
      d: "Gracias por tu interés en Collecta. Nuestro equipo se pondrá en contacto contigo a la brevedad para explorar cómo podemos colaborar.",
    },
    productor: {
      t: "¡Gracias por tu interés!",
      d: "Hemos recibido tu información. Un miembro de nuestro equipo técnico se comunicará contigo para conocer tu predio y explorar la coproducción.",
    },
  },
};

/* Everything else the visitor reads. Placeholders and labels only: none of it is posted. */
const T: Copy<{
  who: string;
  audiences: Record<Audience, { t: string; s: string }>;
  empresa: string;
  empresaPh: string;
  nombreContacto: string;
  nombreContactoPh: string;
  cargo: string;
  cargoPh: string;
  cargoOtro: string;
  cargoOtroPh: string;
  emailCorp: string;
  emailCorpPh: string;
  telefono: string;
  ubicacion: string;
  ubicacionPh: string;
  productos: string;
  productosHint: string;
  volumen: string;
  volumenHint: string;
  volumenPh: string;
  mensaje: string;
  mensajePh: string;
  nombreCompleto: string;
  nombreCompletoPh: string;
  email: string;
  emailHint: string;
  emailPh: string;
  celular: string;
  edad: string;
  edadPh: string;
  predio: string;
  predioHint: string;
  predioPh: string;
  hectareas: string;
  hectareasHint: string;
  hectareasPh: string;
  experiencia: string;
  experienciaHint: string;
  experienciaPh: string;
  pozo: string;
  si: string;
  no: string;
  productosExp: string;
  productosExpHint: string;
  consentPre: string;
  consentPost: string;
  privacyPre: string;
  privacyLink: string;
  sending: string;
  submit: string;
}> = {
  en: {
    who: "Who are you?",
    audiences: {
      cliente: { t: "I'm a buyer", s: "Corporate buyer" },
      productor: { t: "I'm a grower", s: "Farmer / farm" },
    },
    empresa: "Company name *",
    empresaPh: "e.g. Walmart, Chedraui…",
    nombreContacto: "Contact's full name *",
    nombreContactoPh: "Your name",
    cargo: "Role *",
    cargoPh: "Select your role",
    cargoOtro: "What's your role? *",
    cargoOtroPh: "e.g. General management",
    emailCorp: "Work email *",
    emailCorpPh: "you@company.com",
    telefono: "Phone with WhatsApp *",
    ubicacion: "City / State / Country *",
    ubicacionPh: "e.g. Monterrey, Nuevo León, Mexico",
    productos: "Products of interest *",
    productosHint: "Tell us which crops your company wants to source",
    volumen: "Maximum desired volume *",
    volumenHint: "Estimated shipments per month",
    volumenPh: "e.g. 10 shipments a month",
    mensaje: "Message (optional)",
    mensajePh: "Tell us anything else about what you need…",
    nombreCompleto: "Full name *",
    nombreCompletoPh: "Your full name",
    email: "Email",
    emailHint: "Optional",
    emailPh: "you@email.com",
    celular: "Mobile (with WhatsApp) *",
    edad: "Age *",
    edadPh: "e.g. 45",
    predio: "Farm location *",
    predioHint: "e.g. Sinaloa, Culiacán, Costa Rica",
    predioPh: "State, municipality, town",
    hectareas: "Total hectares available *",
    hectareasHint: "Area in hectares",
    hectareasPh: "e.g. 25",
    experiencia: "Years of experience *",
    experienciaHint: "Years working the land",
    experienciaPh: "e.g. 15",
    pozo: "Do you have a water well and/or irrigation system? *",
    si: "Yes",
    no: "No",
    productosExp: "Crops you know best *",
    productosExpHint: "The crops you have the most experience with",
    consentPre: "I want to take part in and join the",
    consentPost: "Collecta Ecosystem",
    privacyPre: "By sending this form, you accept our",
    privacyLink: "privacy notice",
    sending: "Sending…",
    submit: "Send request",
  },
  es: {
    who: "¿Quién eres?",
    audiences: {
      cliente: { t: "Soy Cliente", s: "Comprador corporativo" },
      productor: { t: "Soy Productor", s: "Agricultor / predio" },
    },
    empresa: "Nombre de la empresa *",
    empresaPh: "Ej. Walmart, Chedraui…",
    nombreContacto: "Nombre completo del contacto *",
    nombreContactoPh: "Tu nombre",
    cargo: "Cargo *",
    cargoPh: "Selecciona tu cargo",
    cargoOtro: "¿Cuál es tu cargo? *",
    cargoOtroPh: "Ej. Dirección general",
    emailCorp: "Email corporativo *",
    emailCorpPh: "tu@empresa.com",
    telefono: "Teléfono con WhatsApp *",
    ubicacion: "Ciudad / Estado / País *",
    ubicacionPh: "Ej. Monterrey, Nuevo León, México",
    productos: "Productos de interés *",
    productosHint: "Indica los cultivos que tu empresa busca abastecer",
    volumen: "Volumen máximo deseado *",
    volumenHint: "Embarques estimados por mes",
    volumenPh: "Ej. 10 embarques al mes",
    mensaje: "Mensaje (opcional)",
    mensajePh: "Cuéntanos cualquier detalle adicional sobre tu necesidad…",
    nombreCompleto: "Nombre completo *",
    nombreCompletoPh: "Tu nombre completo",
    email: "Email",
    emailHint: "Opcional",
    emailPh: "tu@email.com",
    celular: "Celular (con WhatsApp) *",
    edad: "Edad *",
    edadPh: "Ej. 45",
    predio: "Ubicación del predio *",
    predioHint: "Ej. Sinaloa, Culiacán, Costa Rica",
    predioPh: "Estado, municipio, población",
    hectareas: "Hectáreas totales disponibles *",
    hectareasHint: "Superficie en hectáreas",
    hectareasPh: "Ej. 25",
    experiencia: "Años de experiencia *",
    experienciaHint: "Años trabajando el campo",
    experienciaPh: "Ej. 15",
    pozo: "¿Cuentas con pozo de agua y/o sistema de riego? *",
    si: "Sí",
    no: "No",
    productosExp: "Productos con mayor experiencia *",
    productosExpHint: "Cultivos que dominas mejor",
    consentPre: "Manifiesto mi interés de participar e integrarme al",
    consentPost: "Ecosistema Collecta",
    privacyPre: "Al enviar este formulario, aceptas nuestro",
    privacyLink: "aviso de privacidad",
    sending: "Enviando…",
    submit: "Enviar solicitud",
  },
};

const CLIENTE0 = {
  empresa: "",
  nombreContacto: "",
  cargo: "",
  email: "",
  countryCode: "+52",
  telefono: "",
  ubicacion: "",
  productos: "",
  volumen: "",
  mensaje: "",
  consentimiento: false,
};
const PRODUCTOR0 = {
  nombreCompleto: "",
  email: "",
  countryCode: "+52",
  celular: "",
  ubicacionPredio: "",
  hectareas: "",
  pozoRiego: "",
  experiencia: "",
  productosExperiencia: "",
  edad: "",
  consentimiento: false,
};

function validateCliente(n: typeof CLIENTE0, ERR: ErrCopy): Errors {
  const e: Errors = {};
  if (!n.empresa.trim()) e.empresa = ERR.required;
  if (!n.nombreContacto.trim()) e.nombreContacto = ERR.required;
  if (!n.cargo) e.cargo = ERR.cargo;
  if (!n.email.trim()) e.email = ERR.required;
  else if (!EMAIL_RE.test(n.email)) e.email = ERR.email;
  if (!n.telefono.trim()) e.telefono = ERR.required;
  else if (n.telefono.replace(/\D/g, "").length < 7) e.telefono = ERR.tel;
  if (!n.ubicacion.trim()) e.ubicacion = ERR.required;
  if (!n.productos.trim()) e.productos = ERR.required;
  if (!n.volumen.trim()) e.volumen = ERR.required;
  if (!n.consentimiento) e.consentimiento = ERR.consent;
  return e;
}
function validateProductor(r: typeof PRODUCTOR0, ERR: ErrCopy): Errors {
  const e: Errors = {};
  if (!r.nombreCompleto.trim()) e.nombreCompleto = ERR.required;
  if (r.email.trim() && !EMAIL_RE.test(r.email)) e.email = ERR.email;
  if (!r.celular.trim()) e.celular = ERR.required;
  else if (r.celular.replace(/\D/g, "").length < 7) e.celular = ERR.celular;
  if (!r.ubicacionPredio.trim()) e.ubicacionPredio = ERR.required;
  if (!r.hectareas.trim()) e.hectareas = ERR.required;
  else if (!(Number(r.hectareas) > 0)) e.hectareas = ERR.hectareas;
  if (!r.pozoRiego) e.pozoRiego = ERR.pozo;
  if (!r.experiencia.trim()) e.experiencia = ERR.required;
  else if (!(Number(r.experiencia) >= 0)) e.experiencia = ERR.experiencia;
  if (!r.productosExperiencia.trim()) e.productosExperiencia = ERR.required;
  if (!r.edad.trim()) e.edad = ERR.required;
  else if (!(Number(r.edad) >= 18 && Number(r.edad) <= 100)) e.edad = ERR.edad;
  if (!r.consentimiento) e.consentimiento = ERR.consent;
  return e;
}

/* ------------------------------------------------ fields */
const fieldCls = (bad?: string) =>
  cn(
    "mt-2 h-12 w-full rounded-xl border bg-foreground/[0.03] px-4 text-base text-foreground placeholder:text-foreground/35 outline-none transition-[border-color,background-color] duration-150 ease-(--ease-out) focus:bg-foreground/[0.06]",
    bad
      ? "border-signal focus:border-signal"
      : "border-(--line) focus:border-primary",
  );

function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm text-foreground/80">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-signal" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function Phone({
  id,
  label,
  iso,
  value,
  error,
  onCountry,
  onValue,
}: {
  id: string;
  label: string;
  iso: string;
  value: string;
  error?: string;
  onCountry: (iso: string, code: string) => void;
  onValue: (v: string) => void;
}) {
  return (
    <Field id={id} label={label} error={error}>
      <div className="mt-2 flex gap-2">
        <CountryCode
          id={`${id}-lada`}
          iso={iso}
          onChange={(c) => onCountry(c.iso, c.code)}
        />
        <input
          id={id}
          type="tel"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder="222 000 0000"
          autoComplete="tel-national"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className={cn(fieldCls(error), "mt-0")}
        />
      </div>
    </Field>
  );
}

/* ------------------------------------------------ form */
export function ContactForm() {
  const lang = useLang();
  const t = T[lang];
  const ERR = ERRS[lang];
  const reduce = useReducedMotion() ?? false;
  const [who, setWho] = useState<Audience>("cliente");
  const [c, setC] = useState(CLIENTE0);
  const [p, setP] = useState(PRODUCTOR0);
  const [isoC, setIsoC] = useState("MX");
  const [isoP, setIsoP] = useState("MX");
  // "Otro" cargo: ask which one; it travels in the message so the live API's fields don't change
  const [cargoOtro, setCargoOtro] = useState("");
  const [cropC, setCropC] = useState<CropValue>(CROP0);
  const [cropP, setCropP] = useState<CropValue>(CROP0);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Audience | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const setCliente = (k: keyof typeof CLIENTE0, v: string | boolean) => {
    setC((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const setProductor = (k: keyof typeof PRODUCTOR0, v: string | boolean) => {
    setP((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const switchTo = (v: Audience) => {
    setWho(v);
    setErrors({});
    setFailed(null);
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFailed(null);
    const errs = who === "cliente" ? validateCliente(c, ERR) : validateProductor(p, ERR);
    if (who === "cliente" && c.cargo === "Otro" && !cargoOtro.trim())
      errs.cargoOtro = ERR.required;
    setErrors(errs);
    if (Object.keys(errs).length) {
      // bring the first problem into view (centred, so its label shows too) and focus it
      const first = Object.keys(errs)[0];
      const el = document.getElementById(`f-${first}`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
      return;
    }
    setSending(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          who === "cliente"
            ? {
                type: "cliente",
                ...c,
                mensaje:
                  c.cargo === "Otro" && cargoOtro.trim()
                    ? `Cargo: ${cargoOtro.trim()}${
                        c.mensaje
                          ? `

${c.mensaje}`
                          : ""
                      }`
                    : c.mensaje,
              }
            : { type: "productor", ...p },
        ),
      });
      if (!res.ok) throw new Error("send");
      setSent(who);
    } catch (err) {
      setFailed(
        err instanceof Error && err.message === "send" ? ERR.send : ERR.network,
      );
    } finally {
      setSending(false);
    }
  }

  const ev = (k: string) => ({
    id: `f-${k}`,
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `f-${k}-err` : undefined,
  });

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, transform: reduce ? "none" : "scale(0.97)" }}
        animate={{ opacity: 1, transform: "scale(1)" }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="flex min-h-[28rem] flex-col items-center justify-center rounded-3xl border border-(--line) bg-card p-8 text-center"
        role="status"
      >
        <span className="grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
          <Check className="size-7" aria-hidden />
        </span>
        <h3 className="text-fluid-xl mt-6 font-semibold tracking-[-0.03em]">
          {SUCCESS[lang][sent].t}
        </h3>
        <p className="mt-3 max-w-md text-foreground/75">{SUCCESS[lang][sent].d}</p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl border border-(--line) bg-card p-5 sm:p-8"
    >
      <fieldset>
        <legend className="eyebrow mb-3">{t.who}</legend>
        <div
          className="grid grid-cols-2 gap-2 rounded-2xl bg-background p-1.5"
          role="radiogroup"
          aria-label={t.who}
        >
          {(
            [
              { v: "cliente", Icon: Building2 },
              { v: "productor", Icon: Sprout },
            ] as const
          ).map(({ v, Icon }) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={who === v}
              onClick={() => switchTo(v)}
              className={cn(
                "press flex min-h-14 items-center gap-2.5 rounded-xl px-3 text-left transition-[background-color,color] duration-200 ease-(--ease-out) sm:gap-3 sm:px-4",
                who === v
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-medium whitespace-nowrap">
                  {t.audiences[v].t}
                </span>
                <span
                  className={cn(
                    "hidden text-xs sm:block",
                    who === v
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {t.audiences[v].s}
                </span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={who}
          initial={{
            opacity: 0,
            transform: reduce ? "none" : "translateY(6px)",
          }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="mt-6 grid gap-5 sm:grid-cols-2"
        >
          {who === "cliente" ? (
            <>
              <Field
                id="f-empresa"
                label={t.empresa}
                error={errors.empresa}
              >
                <input
                  {...ev("empresa")}
                  value={c.empresa}
                  onChange={(e) => setCliente("empresa", e.target.value)}
                  placeholder={t.empresaPh}
                  autoComplete="organization"
                  className={fieldCls(errors.empresa)}
                />
              </Field>
              <Field
                id="f-nombreContacto"
                label={t.nombreContacto}
                error={errors.nombreContacto}
              >
                <input
                  {...ev("nombreContacto")}
                  value={c.nombreContacto}
                  onChange={(e) => setCliente("nombreContacto", e.target.value)}
                  placeholder={t.nombreContactoPh}
                  autoComplete="name"
                  className={fieldCls(errors.nombreContacto)}
                />
              </Field>
              <Field id="f-cargo" label={t.cargo} error={errors.cargo}>
                <select
                  {...ev("cargo")}
                  value={c.cargo}
                  onChange={(e) => setCliente("cargo", e.target.value)}
                  className={cn(
                    fieldCls(errors.cargo),
                    "appearance-none",
                    !c.cargo && "text-foreground/35",
                  )}
                >
                  <option value="" disabled>
                    {t.cargoPh}
                  </option>
                  {CARGOS.map((o) => (
                    <option key={o.v} value={o.v} className="text-foreground">
                      {o.t[lang]}
                    </option>
                  ))}
                </select>
              </Field>
              <AnimatePresence initial={false}>
                {c.cargo === "Otro" && (
                  <motion.div
                    key="cargo-otro"
                    initial={{
                      opacity: 0,
                      transform: reduce ? "none" : "translateY(-4px)",
                    }}
                    animate={{ opacity: 1, transform: "translateY(0px)" }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ duration: 0.2, ease: EASE_OUT }}
                    className="sm:order-none"
                  >
                    <Field
                      id="f-cargoOtro"
                      label={t.cargoOtro}
                      error={errors.cargoOtro}
                    >
                      <input
                        {...ev("cargoOtro")}
                        value={cargoOtro}
                        onChange={(e) => {
                          setCargoOtro(e.target.value);
                          if (errors.cargoOtro)
                            setErrors((x) => ({ ...x, cargoOtro: undefined }));
                        }}
                        placeholder={t.cargoOtroPh}
                        autoComplete="organization-title"
                        className={fieldCls(errors.cargoOtro)}
                      />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
              <Field
                id="f-email"
                label={t.emailCorp}
                error={errors.email}
              >
                <input
                  {...ev("email")}
                  type="email"
                  value={c.email}
                  onChange={(e) => setCliente("email", e.target.value)}
                  placeholder={t.emailCorpPh}
                  autoComplete="email"
                  className={fieldCls(errors.email)}
                />
              </Field>
              <Phone
                id="f-telefono"
                label={t.telefono}
                iso={isoC}
                value={c.telefono}
                error={errors.telefono}
                onCountry={(i, code) => {
                  setIsoC(i);
                  setCliente("countryCode", code);
                }}
                onValue={(v) => setCliente("telefono", v)}
              />
              <Field
                id="f-ubicacion"
                label={t.ubicacion}
                error={errors.ubicacion}
              >
                <input
                  {...ev("ubicacion")}
                  value={c.ubicacion}
                  onChange={(e) => setCliente("ubicacion", e.target.value)}
                  placeholder={t.ubicacionPh}
                  className={fieldCls(errors.ubicacion)}
                />
              </Field>
              <CropPicker
                id="f-productos"
                label={t.productos}
                error={errors.productos}
                hint={t.productosHint}
                value={cropC}
                onChange={(v) => {
                  setCropC(v);
                  setCliente("productos", cropText(v));
                }}
                className="sm:col-span-2"
              />
              <Field
                id="f-volumen"
                label={t.volumen}
                error={errors.volumen}
                hint={t.volumenHint}
              >
                <input
                  {...ev("volumen")}
                  value={c.volumen}
                  onChange={(e) => setCliente("volumen", e.target.value)}
                  placeholder={t.volumenPh}
                  className={fieldCls(errors.volumen)}
                />
              </Field>
              <Field
                id="f-mensaje"
                label={t.mensaje}
                className="sm:col-span-2"
              >
                <textarea
                  id="f-mensaje"
                  rows={4}
                  value={c.mensaje}
                  onChange={(e) => setCliente("mensaje", e.target.value)}
                  placeholder={t.mensajePh}
                  className={cn(fieldCls(), "h-auto py-3")}
                />
              </Field>
            </>
          ) : (
            <>
              <Field
                id="f-nombreCompleto"
                label={t.nombreCompleto}
                error={errors.nombreCompleto}
              >
                <input
                  {...ev("nombreCompleto")}
                  value={p.nombreCompleto}
                  onChange={(e) =>
                    setProductor("nombreCompleto", e.target.value)
                  }
                  placeholder={t.nombreCompletoPh}
                  autoComplete="name"
                  className={fieldCls(errors.nombreCompleto)}
                />
              </Field>
              <Field
                id="f-email"
                label={t.email}
                error={errors.email}
                hint={t.emailHint}
              >
                <input
                  {...ev("email")}
                  type="email"
                  value={p.email}
                  onChange={(e) => setProductor("email", e.target.value)}
                  placeholder={t.emailPh}
                  autoComplete="email"
                  className={fieldCls(errors.email)}
                />
              </Field>
              <Phone
                id="f-celular"
                label={t.celular}
                iso={isoP}
                value={p.celular}
                error={errors.celular}
                onCountry={(i, code) => {
                  setIsoP(i);
                  setProductor("countryCode", code);
                }}
                onValue={(v) => setProductor("celular", v)}
              />
              <Field id="f-edad" label={t.edad} error={errors.edad}>
                <input
                  {...ev("edad")}
                  inputMode="numeric"
                  value={p.edad}
                  onChange={(e) => setProductor("edad", e.target.value)}
                  placeholder={t.edadPh}
                  className={fieldCls(errors.edad)}
                />
              </Field>
              <Field
                id="f-ubicacionPredio"
                label={t.predio}
                error={errors.ubicacionPredio}
                hint={t.predioHint}
                className="sm:col-span-2"
              >
                <input
                  {...ev("ubicacionPredio")}
                  value={p.ubicacionPredio}
                  onChange={(e) =>
                    setProductor("ubicacionPredio", e.target.value)
                  }
                  placeholder={t.predioPh}
                  className={fieldCls(errors.ubicacionPredio)}
                />
              </Field>
              <Field
                id="f-hectareas"
                label={t.hectareas}
                error={errors.hectareas}
                hint={t.hectareasHint}
              >
                <input
                  {...ev("hectareas")}
                  inputMode="decimal"
                  value={p.hectareas}
                  onChange={(e) => setProductor("hectareas", e.target.value)}
                  placeholder={t.hectareasPh}
                  className={fieldCls(errors.hectareas)}
                />
              </Field>
              <Field
                id="f-experiencia"
                label={t.experiencia}
                error={errors.experiencia}
                hint={t.experienciaHint}
              >
                <input
                  {...ev("experiencia")}
                  inputMode="numeric"
                  value={p.experiencia}
                  onChange={(e) => setProductor("experiencia", e.target.value)}
                  placeholder={t.experienciaPh}
                  className={fieldCls(errors.experiencia)}
                />
              </Field>
              <fieldset className="sm:col-span-2">
                <legend className="block text-sm text-foreground/80">
                  {t.pozo}
                </legend>
                <div className="mt-2 flex gap-2" role="radiogroup">
                  {[
                    { v: "si", t: t.si },
                    { v: "no", t: t.no },
                  ].map((o, k) => (
                    <button
                      key={o.v}
                      id={k === 0 ? "f-pozoRiego" : undefined}
                      type="button"
                      role="radio"
                      aria-checked={p.pozoRiego === o.v}
                      onClick={() => setProductor("pozoRiego", o.v)}
                      className={cn(
                        "press h-12 min-w-24 rounded-xl border px-5 text-sm transition-[background-color,border-color,color] duration-150 ease-(--ease-out)",
                        p.pozoRiego === o.v
                          ? "border-primary bg-primary text-primary-foreground"
                          : errors.pozoRiego
                            ? "border-signal text-foreground/80"
                            : "border-(--line) text-foreground/80 hover:border-foreground/30",
                      )}
                    >
                      {o.t}
                    </button>
                  ))}
                </div>
                {errors.pozoRiego && (
                  <p className="mt-1.5 text-xs text-signal" role="alert">
                    {errors.pozoRiego}
                  </p>
                )}
              </fieldset>
              <CropPicker
                id="f-productosExperiencia"
                label={t.productosExp}
                error={errors.productosExperiencia}
                hint={t.productosExpHint}
                value={cropP}
                onChange={(v) => {
                  setCropP(v);
                  setProductor("productosExperiencia", cropText(v));
                }}
                className="sm:col-span-2"
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <label className="mt-6 flex items-start gap-3 text-sm text-foreground/80">
        <input
          id="f-consentimiento"
          type="checkbox"
          checked={who === "cliente" ? c.consentimiento : p.consentimiento}
          onChange={(e) =>
            who === "cliente"
              ? setCliente("consentimiento", e.target.checked)
              : setProductor("consentimiento", e.target.checked)
          }
          aria-invalid={!!errors.consentimiento}
          className="mt-0.5 size-5 shrink-0 accent-[#9fd36a]"
        />
        <span>
          {t.consentPre}{" "}
          <span className="text-foreground">{t.consentPost}</span> *
          {errors.consentimiento && (
            <span className="mt-1 block text-xs text-signal" role="alert">
              {errors.consentimiento}
            </span>
          )}
        </span>
      </label>

      {failed && (
        <div
          className="mt-6 rounded-2xl border border-signal/40 bg-signal/[0.08] p-4"
          role="alert"
        >
          <p className="text-sm text-foreground/90">{failed}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-10 items-center gap-2 rounded-full bg-foreground/10 px-4 text-sm text-foreground hover:bg-foreground/15"
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="press inline-flex h-10 items-center gap-2 rounded-full bg-foreground/10 px-4 text-sm text-foreground hover:bg-foreground/15"
            >
              <Mail className="size-4" aria-hidden /> {EMAIL}
            </a>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {t.privacyPre}{" "}
          {/* new tab, so a half-filled form isn't lost */}
          <Link
            href="/privacidad"
            target="_blank"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {t.privacyLink}
          </Link>
          .
        </p>
        {/* said next to the button too, so a click that doesn't send never looks like it did */}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-signal sm:order-first sm:basis-full">
            {ERR.review}
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="press group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full whitespace-nowrap bg-primary px-6 font-medium text-primary-foreground hover:bg-[#b3e083] disabled:opacity-70"
        >
          {sending ? t.sending : t.submit}
          <ArrowRight
            className="size-4 transition-transform duration-200 ease-(--ease-out) [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5"
            aria-hidden
          />
        </button>
      </div>
    </form>
  );
}
