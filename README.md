# Collecta Web

Sitio de collectaproduce.com: Next.js 16 (App Router), Tailwind v4, motion.

- `/` inglés (predeterminado), `/es` español. Cada componente guarda su texto como `{ en, es }` junto al markup.
- `/privacidad` y `/terminos`: texto legal (español).
- `/api/contact`: recibe el formulario (Resend + webhook opcional; ver `DEPLOY.md` para las variables de entorno).
- `/plataforma` redirige a https://app.collectaproduce.com.

```bash
npm install
npm run dev
```
