import { z } from 'zod';

/**
 * Validation schemas for contact forms.
 * Used by both client (form validation) and server (API route).
 */

const phoneRegex = /^[0-9\s\-\(\)]{6,20}$/;
const countryCodeRegex = /^\+\d{1,4}$/;

export const clienteFormSchema = z.object({
  type: z.literal('cliente'),
  empresa: z.string().min(1, 'Nombre de empresa requerido').max(150),
  nombreContacto: z.string().min(1, 'Nombre de contacto requerido').max(150),
  cargo: z.enum(['Compras', 'Calidad', 'Supply', 'Otro']),
  email: z.string().email('Email no válido'),
  countryCode: z.string().regex(countryCodeRegex, 'Lada no válida'),
  telefono: z.string().regex(phoneRegex, 'Teléfono no válido'),
  ubicacion: z.string().min(1, 'Ubicación requerida').max(200),
  productos: z.string().min(1, 'Productos de interés requeridos').max(500),
  volumen: z.string().min(1, 'Volumen requerido').max(200),
  mensaje: z.string().max(2000).optional().default(''),
  consentimiento: z.literal(true, { message: 'Debes aceptar para continuar' }),
});

export const productorFormSchema = z.object({
  type: z.literal('productor'),
  nombreCompleto: z.string().min(1, 'Nombre completo requerido').max(150),
  email: z.string().email('Email no válido').optional().or(z.literal('')),
  countryCode: z.string().regex(countryCodeRegex, 'Lada no válida'),
  celular: z.string().regex(phoneRegex, 'Celular no válido'),
  ubicacionPredio: z.string().min(1, 'Ubicación del predio requerida').max(200),
  hectareas: z.coerce.number().positive('Hectáreas debe ser mayor a 0'),
  pozoRiego: z.enum(['si', 'no']),
  experiencia: z.coerce.number().min(0, 'Años de experiencia inválidos').max(80),
  productosExperiencia: z.string().min(1, 'Productos requeridos').max(500),
  edad: z.coerce.number().min(18, 'Debes ser mayor de edad').max(100),
  consentimiento: z.literal(true, { message: 'Debes aceptar para continuar' }),
});

export const contactFormSchema = z.discriminatedUnion('type', [
  clienteFormSchema,
  productorFormSchema,
]);

export type ClienteFormData = z.infer<typeof clienteFormSchema>;
export type ProductorFormData = z.infer<typeof productorFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
