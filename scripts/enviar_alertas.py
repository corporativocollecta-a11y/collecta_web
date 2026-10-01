"""
Correo semanal con los movimientos de precio y embarques (data/alertas_precio.js, scripts/construir_alertas.py).

Lo corre GitHub Actions en collecta_web cada lunes (.github/workflows/alertas-correo.yml); publicar_web.py copia este
archivo a collecta_web/scripts/enviar_alertas.py. Solo biblioteca estándar.

Envío por Gmail (SMTP con SSL, smtp.gmail.com:465) con una contraseña de aplicación de Google. Secretos de GitHub:
  GMAIL_USUARIO      cuenta que envía (p. ej. corporativocollecta@gmail.com)
  GMAIL_CLAVE_APP    contraseña de aplicación de 16 letras (myaccount.google.com/apppasswords; requiere 2 pasos)
  ALERTAS_PARA       destinatarios separados por coma (van en copia oculta: no se ven entre sí)
Si las alertas tienen más de 9 días (no se corrió la actualización semanal), el correo lo dice al principio.

Uso:
  python scripts/enviar_alertas.py --datos public/mapa-agroalimentario/data            (envía)
  python scripts/enviar_alertas.py --datos data --prueba salida.html                   (solo escribe el HTML)
"""
import argparse
import json
import os
import re
import smtplib
import ssl
from datetime import date
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path

MAPA = "https://collectaproduce.com/mapa-agroalimentario"
MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def leer(ruta):
    t = Path(ruta).read_text(encoding="utf-8")
    i = t.index("{", t.index(" = "))
    return json.JSONDecoder().raw_decode(t[i:])[0]


def nombres(datos):
    """{clave: nombre} de data/productos.js (objeto JS, no JSON: se leen solo las claves y sus nombres)."""
    t = (Path(datos) / "productos.js").read_text(encoding="utf-8")
    # cada producto abre con "  clave: {" y su nombre viene en las líneas siguientes (a veces después de "nota")
    return dict(re.findall(r'^ {2}(\w+): \{[^{}]*?\bnombre: "([^"]+)"', t, flags=re.M | re.S))


def fecha(iso):
    a, m, d = map(int, iso.split("-"))
    return f"{d} {MES[m - 1]} {a}"


def pct(x):
    return f"{abs(round(x * 100))}%"


def texto(a):
    """Mismo texto que js/alertas.js."""
    sube, c = a["cambio"] > 0, pct(a["cambio"])
    t = a["tipo"]
    if t == "precio_eua":
        return f"Precio en EE. UU. {'subió' if sube else 'bajó'} {c} en dos semanas (US${a['precio']:.2f} el kg)"
    if t == "precio_mx":
        return f"Mayoreo en México {'subió' if sube else 'bajó'} {c} en dos semanas (${a['precio']:.2f} el kg)"
    if t == "anual_eua":
        return f"Precio en EE. UU. {c} {'más alto' if sube else 'más bajo'} que hace un año"
    if t == "anual_mx":
        return f"Mayoreo en México {c} {'más caro' if sube else 'más barato'} que hace un año"
    if t == "pronostico_eua":
        return f"Pronóstico en EE. UU.: {'sube' if sube else 'baja'} {c} en 8 semanas (error típico {pct(a['error'])})"
    if t == "pronostico_mx":
        return f"Pronóstico en México: {'sube' if sube else 'baja'} {c} en 8 semanas (error típico {pct(a['error'])})"
    if t == "embarques_mx":
        return f"Cruzó de México {c} {'más' if sube else 'menos'} que hace un año ({round(a['t']):,} t en dos semanas)"
    return ""


def armar(datos):
    A = leer(Path(datos) / "alertas_precio.js")
    N = nombres(datos)
    grupos = {}
    for a in A["alertas"]:
        if a["k"] in N:
            grupos.setdefault(a["k"], []).append(a)
    orden = sorted(grupos.items(), key=lambda kv: -max(abs(a["cambio"]) for a in kv[1]))
    viejo = (date.today() - date.fromisoformat(A["generado"])).days > 9
    asunto = f"Mapa agroalimentario: movimientos de la semana ({fecha(A['semanaEUA'])})"
    filas = "".join(
        f'<tr><td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;vertical-align:top;font-weight:600;white-space:nowrap">'
        f'<a href="{MAPA}#v=mx&p={k}" style="color:#1f3d2b;text-decoration:none">{N[k]}</a></td>'
        f'<td style="padding:8px 10px;border-bottom:1px solid #e5e5e5">'
        + "<br>".join(f'<b style="color:{"#2e7d32" if a["tipo"] == "embarques_mx" else "#c0392b" if a["cambio"] > 0 else "#1565c0"}">'
                      f'{"▲" if a["cambio"] > 0 else "▼"} {pct(a["cambio"])}</b> {texto(a)}' for a in lista)
        + "</td></tr>" for k, lista in orden)
    aviso = (f'<p style="background:#fff3cd;padding:8px 10px;border-radius:6px">Ojo: estas alertas se generaron el {fecha(A["generado"])} '
             "y no se han actualizado esta semana.</p>") if viejo else ""
    html = f"""<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;max-width:680px">
  <h2 style="color:#1f3d2b;margin:0 0 4px">Movimientos de la semana</h2>
  <p style="margin:0 0 12px;color:#555">USDA al {fecha(A['semanaEUA'])} · SNIIM al {fecha(A['semanaMX'])} · {len(A['alertas'])} señales en {len(orden)} productos</p>
  {aviso}
  <table style="border-collapse:collapse;width:100%">{filas}</table>
  <p style="color:#666;font-size:12px;margin-top:14px">Umbrales: precio ±15% en dos semanas o ±30% contra hace un año; pronóstico ±20% en 8 semanas
  (solo si su error típico es menor a 30%); embarques de México ±30% contra hace un año. Fuentes: USDA AMS Market News y SNIIM.
  Detalle en <a href="{MAPA}">el mapa agroalimentario de Collecta</a>.</p>
</div>"""
    plano = f"Movimientos de la semana (USDA al {fecha(A['semanaEUA'])}, SNIIM al {fecha(A['semanaMX'])})\n\n" + "\n".join(
        f"{N[k]}: " + "; ".join(f"{'+' if a['cambio'] > 0 else '-'}{pct(a['cambio'])} {texto(a)}" for a in lista) for k, lista in orden) + f"\n\n{MAPA}\n"
    return asunto, html, plano


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--datos", required=True, help="carpeta de los data/*.js")
    ap.add_argument("--prueba", help="escribe el HTML en este archivo y no envía")
    a = ap.parse_args()
    asunto, html, plano = armar(a.datos)
    if a.prueba:
        Path(a.prueba).write_text(html, encoding="utf-8")
        print(f"{asunto}\n-> {a.prueba} (no se envió)")
        return
    usuario, clave = os.environ.get("GMAIL_USUARIO", "").strip(), os.environ.get("GMAIL_CLAVE_APP", "").replace(" ", "")
    para = [x.strip() for x in os.environ.get("ALERTAS_PARA", "").split(",") if x.strip()]
    if not (usuario and clave and para):
        # sin secretos todavía: aviso en GitHub Actions, sin marcar la corrida como fallida
        print("::warning::No se envió: faltan los secretos GMAIL_USUARIO, GMAIL_CLAVE_APP o ALERTAS_PARA")
        return
    msg = EmailMessage()
    msg["Subject"] = asunto
    msg["From"] = formataddr(("Mapa agroalimentario Collecta", usuario))
    msg["To"] = usuario            # destinatarios en copia oculta: no ven las direcciones de los demás
    msg["Bcc"] = ", ".join(para)
    msg.set_content(plano)
    msg.add_alternative(html, subtype="html")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context()) as s:
        s.login(usuario, clave)
        s.send_message(msg)
    print(f"Enviado: {asunto} → {len(para)} destinatario(s)")


if __name__ == "__main__":
    main()
