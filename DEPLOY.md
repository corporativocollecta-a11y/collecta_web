# Deployment Guide - Collecta Web

Esta guía cubre deploy local, build de producción y deploy a Vercel.

---

## 1. Local - Desarrollo

```bash
npm install
npm run dev
# Abre http://localhost:3000
```

---

## 2. Variables de entorno

Copia `.env.example` a `.env.local` y configura las que apliquen:

```bash
cp .env.example .env.local
```

| Variable | Required | Para qué |
|----------|----------|----------|
| `RESEND_API_KEY` | Opcional | Recibir formularios por email |
| `CONTACT_EMAIL_TO` | Opcional | Email destino (default: contacto@collectaproduce.com) |
| `CONTACT_EMAIL_FROM` | Opcional | Email remitente verificado |
| `CONTACT_WEBHOOK_URL` | Opcional | Notificaciones a Slack/Discord/Zapier |

**Sin variables**: el sitio funciona, los formularios se logean en consola del servidor.
**Con Resend**: emails reales llegan a `CONTACT_EMAIL_TO`.
**Con Webhook**: notificaciones inmediatas en Slack/Discord/etc.

---

## 3. Build de producción local

```bash
npm run build
npm run start
```

Esto crea una build optimizada y la sirve en localhost:3000.

---

## 4. Deploy a Vercel (recomendado)

### Opción A: Deploy via CLI

```bash
# Instala Vercel CLI (una vez)
npm i -g vercel

# Login (una vez)
vercel login

# Deploy de prueba (preview)
vercel

# Deploy a producción
vercel --prod
```

### Opción B: Deploy via GitHub + Vercel dashboard

1. Sube el proyecto a un repo de GitHub
2. Ve a https://vercel.com/new
3. Importa el repo
4. Configura variables de entorno (Settings > Environment Variables):
   - `RESEND_API_KEY`
   - `CONTACT_EMAIL_TO`
   - `CONTACT_EMAIL_FROM`
   - `CONTACT_WEBHOOK_URL`
5. Click "Deploy"

Vercel detecta automáticamente que es Next.js y usa el preset correcto.

---

## 5. Conectar dominio collectagroup.com

En el dashboard de Vercel:

1. **Settings > Domains**
2. Agrega `collectagroup.com`
3. Vercel te dará registros DNS para configurar:
   - `A record` (apunta a IP de Vercel)
   - `CNAME` (apunta a `cname.vercel-dns.com`)
4. Configura los DNS donde tengas el dominio (GoDaddy, Cloudflare, etc.)
5. Espera propagación (15 min - 24 hrs)

Vercel emitirá un certificado SSL automáticamente.

---

## 6. Configurar Resend (envío de emails)

1. **Regístrate**: https://resend.com (100 emails/día gratis)
2. **Verifica el dominio** `collectagroup.com`:
   - Dashboard > Domains > Add Domain
   - Agrega los registros DNS que te indique (DKIM, SPF)
   - Espera verificación (~5 min)
3. **Crea API key**: Dashboard > API Keys > Create
4. **Pega el key** en Vercel: Settings > Environment Variables > `RESEND_API_KEY`
5. **Redeploy** para que tome la variable

---

## 7. Configurar Webhook (opcional)

### Slack:
1. https://api.slack.com/apps > Create New App > From scratch
2. Incoming Webhooks > Activate > Add New Webhook to Workspace
3. Selecciona canal (ej: `#contactos-collecta`)
4. Copia URL en `CONTACT_WEBHOOK_URL`

### Discord:
1. Server > Settings > Integrations > Webhooks > New Webhook
2. Copia URL en `CONTACT_WEBHOOK_URL`

### Zapier (más flexible):
1. Crea Zap con trigger "Webhooks by Zapier - Catch Hook"
2. Copia la URL del webhook
3. Agrega acciones (Sheets, Email, CRM, etc.)
4. Pon URL en `CONTACT_WEBHOOK_URL`

---

## 8. Performance / Lighthouse

Después del deploy, verifica:
- https://pagespeed.web.dev/
- Métricas objetivo: LCP < 2.5s, CLS < 0.1, FID < 100ms

---

## 9. Checklist post-deploy

- [ ] Sitio carga en `collecta-web.vercel.app`
- [ ] Dominio `collectagroup.com` apunta correctamente
- [ ] SSL funcionando (candado verde)
- [ ] Formularios envían emails reales
- [ ] Notificaciones webhook funcionando
- [ ] Lighthouse score 90+
- [ ] Responsive en mobile

---

## Soporte

Para cambios al código, contacta al equipo de desarrollo.
Para issues de hosting/Vercel, https://vercel.com/support
