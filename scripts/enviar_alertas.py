"""
Correo semanal con los movimientos de precio y embarques (data/alertas_precio.js, scripts/construir_alertas.py).

Lo corre GitHub Actions en collecta_web cada martes a las 16:00 de la Ciudad de México
(.github/workflows/alertas-correo.yml); publicar_web.py copia este archivo a collecta_web/scripts/enviar_alertas.py.
Solo biblioteca estándar.

Envío por Gmail (SMTP con SSL, smtp.gmail.com:465) con una contraseña de aplicación de Google. Secretos de GitHub:
  GMAIL_USUARIO      cuenta que envía (p. ej. corporativocollecta@gmail.com)
  GMAIL_CLAVE_APP    contraseña de aplicación de 16 letras (myaccount.google.com/apppasswords; requiere 2 pasos)
  ALERTAS_PARA       destinatarios (van en copia oculta: no se ven entre sí).
                     Simple: "a@x.com, b@y.com" → todos reciben todo.
                     Por producto: "a@x.com: jitomate, aguacate; b@y.com; c@z.com: limón" → b recibe todo.
Si las alertas tienen más de 9 días (no se corrió la actualización semanal), el correo lo dice al principio.

Uso:
  python scripts/enviar_alertas.py --datos public/mapa-agroalimentario/data            (envía)
  python scripts/enviar_alertas.py --datos data --prueba salida.html [--para "..."]    (no envía: muestra qué recibe cada quien)
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
    v = f" ({a['ref'].lower()})" if a.get("ref") else ""   # variedad de referencia (p. ej. chile: pimiento morrón en EE. UU., jalapeño en México)
    if t == "precio_eua":
        return f"Precio en EE. UU.{v} {'subió' if sube else 'bajó'} {c} en dos semanas (US${a['precio']:.2f} el kg)"
    if t == "precio_mx":
        return f"Mayoreo en México{v} {'subió' if sube else 'bajó'} {c} en dos semanas (${a['precio']:.2f} el kg)"
    if t == "anual_eua":
        return f"Precio en EE. UU.{v} {c} {'más alto' if sube else 'más bajo'} que hace un año"
    if t == "anual_mx":
        return f"Mayoreo en México{v} {c} {'más caro' if sube else 'más barato'} que hace un año"
    if t == "pronostico_eua":
        return f"Pronóstico en EE. UU.{v}: {'sube' if sube else 'baja'} {c} en 8 semanas (suele fallar ±{pct(a['error'])})"
    if t == "pronostico_mx":
        return f"Pronóstico en México{v}: {'sube' if sube else 'baja'} {c} en 8 semanas (suele fallar ±{pct(a['error'])})"
    if t == "embarques_mx":
        return f"Cruzó de México {c} {'más' if sube else 'menos'} que hace un año ({round(a['t']):,} t en dos semanas)"
    mes = f"{MES[int(a['mes'][5:7]) - 1]} {a['mes'][:4]}" if a.get("mes") else ""
    if t == "internacional_mes":
        return f"Precio internacional {'subió' if sube else 'bajó'} {c} en el mes (US${round(a['precio']):,} la tonelada, {mes})"
    if t == "internacional_anual":
        return f"Precio internacional {c} {'más alto' if sube else 'más bajo'} que hace un año (US${round(a['precio']):,} la tonelada, {mes})"
    return ""


def armar(datos, productos=None):
    """(asunto, html, texto plano, número de productos con alertas); productos = claves a incluir (None = todos)."""
    A = leer(Path(datos) / "alertas_precio.js")
    N = nombres(datos)
    grupos = {}
    for a in A["alertas"]:
        if a["k"] in N and (productos is None or a["k"] in productos):
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
    sus = (f'<p style="margin:0 0 12px;color:#555">Tus productos: {", ".join(sorted(N[k] for k in productos if k in N))}.</p>'
           if productos is not None else "")
    cuerpo = (f'<table style="border-collapse:collapse;width:100%">{filas}</table>' if orden else
              '<p style="background:#eef6ee;padding:8px 10px;border-radius:6px">Esta semana no hubo movimientos fuertes de precio '
              "ni de embarques en tus productos.</p>")
    html = f"""<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;max-width:680px">
  <h2 style="color:#1f3d2b;margin:0 0 4px">Movimientos de la semana</h2>
  <p style="margin:0 0 12px;color:#555">USDA al {fecha(A['semanaEUA'])} · SNIIM al {fecha(A['semanaMX'])} · {sum(len(v) for v in grupos.values())} señales en {len(orden)} productos</p>
  {sus}{aviso}
  {cuerpo}
  <p style="color:#666;font-size:12px;margin-top:14px">Umbrales: precio ±15% en dos semanas o ±30% contra hace un año; pronóstico ±20% en 8 semanas
  (solo si suele fallar menos de ±30%); embarques de México ±30% contra hace un año; precio internacional de granos ±8% en el mes
  o ±25% contra hace un año. Fuentes: USDA AMS Market News, SNIIM y Banco Mundial.
  Detalle en <a href="{MAPA}">el mapa agroalimentario de Collecta</a>.</p>
</div>"""
    lineas = "\n".join(f"{N[k]}: " + "; ".join(f"{'+' if a['cambio'] > 0 else '-'}{pct(a['cambio'])} {texto(a)}" for a in lista)
                       for k, lista in orden)
    plano = (f"Movimientos de la semana (USDA al {fecha(A['semanaEUA'])}, SNIIM al {fecha(A['semanaMX'])})\n\n"
             + (lineas or "Sin movimientos fuertes esta semana en tus productos.") + f"\n\n{MAPA}\n")
    return asunto, html, plano, len(orden)


def sin_acentos(t):
    import unicodedata
    return unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower().strip()


def destinatarios(texto, N):
    """ALERTAS_PARA → [(correo, {claves} o None)].
    Formato simple (como antes): "a@x.com, b@y.com" → todos los productos.
    Con filtro: entradas separadas por ";" o renglón, cada una "correo: producto, producto" (nombre del mapa o clave, con
    o sin acentos; basta el inicio: "chile" = "Chile verde y pimiento morrón"); una entrada sin ":" recibe todo."""
    if not any(c in texto for c in ";:\n"):
        return [(x.strip(), None) for x in texto.split(",") if x.strip()]
    buscar = {}
    for k, n in N.items():
        buscar[sin_acentos(k).replace("_", " ")] = k
        buscar[sin_acentos(n)] = k
    salida = []
    for entrada in re.split(r"[;\n]", texto):
        if not entrada.strip():
            continue
        correo, _, prods = entrada.partition(":")
        if not prods.strip():
            salida.append((correo.strip(), None))
            continue
        claves = set()
        for pr in prods.split(","):
            q = sin_acentos(pr)
            if not q:
                continue
            k = buscar.get(q) or next((v for nom, v in buscar.items() if nom.startswith(q)), None)
            if k:
                claves.add(k)
            else:
                print(f"::warning::Producto no reconocido para {correo.strip()}: {pr.strip()}")
        # si no se reconoció ninguno (errata), mejor recibe todo que un correo siempre vacío
        salida.append((correo.strip(), claves or None))
    return salida


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--datos", required=True, help="carpeta de los data/*.js")
    ap.add_argument("--prueba", help="escribe el HTML (del primer destinatario de --para, o general) y no envía")
    ap.add_argument("--para", help="con --prueba: simula un ALERTAS_PARA y muestra qué recibiría cada quien")
    a = ap.parse_args()
    N = nombres(a.datos)
    if a.prueba:
        lista = destinatarios(a.para, N) if a.para else [("(todos)", None)]
        for correo, prods in lista:
            n = armar(a.datos, prods)[3]
            print(f"{correo}: {n} productos con alertas" + (f" de {len(prods)} suscritos" if prods is not None else ""))
        Path(a.prueba).write_text(armar(a.datos, lista[0][1])[1], encoding="utf-8")
        print(f"-> {a.prueba} (no se envió)")
        return
    usuario, clave = os.environ.get("GMAIL_USUARIO", "").strip(), os.environ.get("GMAIL_CLAVE_APP", "").replace(" ", "")
    para = destinatarios(os.environ.get("ALERTAS_PARA", ""), N)
    if not (usuario and clave and para):
        # sin secretos todavía: aviso en GitHub Actions, sin marcar la corrida como fallida
        print("::warning::No se envió: faltan los secretos GMAIL_USUARIO, GMAIL_CLAVE_APP o ALERTAS_PARA")
        return
    # Sin filtros: un solo correo en copia oculta. Con filtros: uno por cada combinación de productos.
    grupos = {}
    for correo, prods in para:
        grupos.setdefault(None if prods is None else frozenset(prods), []).append(correo)
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ssl.create_default_context()) as s:
        s.login(usuario, clave)
        for prods, correos in grupos.items():
            asunto, html, plano, n = armar(a.datos, None if prods is None else set(prods))
            msg = EmailMessage()
            msg["Subject"] = asunto
            msg["From"] = formataddr(("Mapa agroalimentario Collecta", usuario))
            msg["To"] = usuario            # destinatarios en copia oculta: no ven las direcciones de los demás
            msg["Bcc"] = ", ".join(correos)
            msg.set_content(plano)
            msg.add_alternative(html, subtype="html")
            s.send_message(msg)
            print(f"Enviado: {asunto} → {len(correos)} destinatario(s), {n} productos con alertas"
                  + ("" if prods is None else f" (filtro de {len(prods)} productos)"))


if __name__ == "__main__":
    main()
