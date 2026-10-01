"""Actualiza reporte/hallazgos-agroalimentarios.html con los módulos de septiembre de 2026: flete y Europa en la
sección de frontera/oportunidades, y secciones nuevas de calendario y competencia, acceso a mercados y sequía.
Cifras calculadas con los datos del mapa (precios_eua.js, competencia_eua.js, acceso.js, sequia.js, precios_ue.js).
Se corre una sola vez sobre la versión anterior del reporte (verifica cada reemplazo)."""
from pathlib import Path

f = Path(__file__).resolve().parent.parent / "reporte" / "hallazgos-agroalimentarios.html"
t = f.read_text(encoding="utf-8")


def rep(a, b):
    global t
    assert t.count(a) == 1, (a[:90], t.count(a))
    t = t.replace(a, b)


# ---- 10 Frontera: flete de camión ----
rep('''      <p>El producto mexicano es la mitad o más de lo que se cotiza en esos mercados''',
    '''      <p>El flete no explica la diferencia: llevar un tráiler refrigerado de Nogales a Los Ángeles cuesta US$1,550 (US$0.09/kg) y a Boston US$7,150 (US$0.39/kg). En pimiento morrón, que cruza a US$1.99/kg, el producto llega a Baltimore en US$2.33 y se vende a US$4.80: 52% del precio de mayoreo queda entre importador y mayorista.</p>
      <p>El producto mexicano es la mitad o más de lo que se cotiza en esos mercados''')
rep('''y reporte semanal de embarques (1,000 cwt = 45.4 t).''',
    '''reporte semanal de embarques (1,000 cwt = 45.4 t) y tarifas semanales de camión refrigerado por ruta (National Truck Rate Report; 40,000 lb por carga).''')

# ---- 11 Oportunidades: precio del productor europeo ----
rep('''    <p class="nota">Fuente: FAOSTAT 2024, comercio por país y matriz detallada de comercio''',
    '''    <div class="lectura">
      <p>En Europa, el productor local recibe más que el mexicano en la frontera con Estados Unidos en varios de estos productos: en la empacadora, el jitomate se paga 70% más (US$1.65/kg contra US$0.97), el pepino tres veces más (US$1.50 contra US$0.48), la lechuga el doble y el melón 61% más. En pimiento y uva ocurre lo contrario: el europeo cobra 27% y 41% menos, con producción de invernadero y de temporada propia.</p>
    </div>
    <p class="nota">Fuente: FAOSTAT 2024, comercio por país y matriz detallada de comercio''')
rep('''Los flujos pequeños de México pueden no aparecer en la matriz, por lo que su participación en algunos mercados (por ejemplo, berries en Canadá) puede estar subestimada.</p>''',
    '''Los flujos pequeños de México pueden no aparecer en la matriz, por lo que su participación en algunos mercados (por ejemplo, berries en Canadá) puede estar subestimada. Precios europeos: mediana 2025 del precio en empacadora por país (Comisión Europea, Agri-food data portal), todas las variedades; no incluyen flete a Europa ni aranceles.</p>''')

# ---- Numeración: 12-14 nuevas; Propuestas 15, Método 16 ----
rep('<span class="etq"><b>12</b> · Propuestas</span>', '<span class="etq"><b>15</b> · Propuestas</span>')
rep('<span class="etq"><b>13</b> · Método</span>', '<span class="etq"><b>16</b> · Método</span>')

NUEVAS = '''<section id="calendario">
  <div class="lado"><span class="etq"><b>12</b> · Temporadas</span><span class="etq">USDA · UN Comtrade 2025</span></div>
  <div class="cuerpo">
    <h2>Perú, Guatemala y Chile llenan en Estados Unidos los meses en que México no vende</h2>
    <div class="lectura">
      <p>Con las importaciones mensuales de Estados Unidos por país de origen y los embarques semanales del USDA vemos quién abastece cada mes y cuándo sube el precio. Donde México es fuerte todo el año (jitomate, chile, aguacate, pepino) lo que cambia es el precio; donde es débil, un competidor ocupa la temporada.</p>
    </div>
    <div class="tabla">
      <table>
        <thead><tr><th>Producto</th><th class="num">México en las importaciones de EE. UU.</th><th>Principal competidor</th><th>Su temporada fuerte</th></tr></thead>
        <tbody>
          <tr><td>Arándano</td><td class="num">18%</td><td>Perú (49%)</td><td>septiembre a diciembre</td></tr>
          <tr><td>Uva</td><td class="num">20%</td><td>Perú (48%)</td><td>diciembre a febrero</td></tr>
          <tr><td>Melón</td><td class="num">18%</td><td>Guatemala (62%)</td><td>diciembre, marzo y abril</td></tr>
          <tr><td>Espárrago</td><td class="num">62%</td><td>Perú (35%)</td><td>mayo a enero</td></tr>
          <tr><td>Aguacate</td><td class="num">83%</td><td>Perú</td><td>mayo a agosto</td></tr>
          <tr><td>Brócoli</td><td class="num">63%</td><td>Canadá (34%)</td><td>julio a octubre</td></tr>
          <tr><td>Piña</td><td class="num">5%</td><td>Costa Rica (86%)</td><td>todo el año</td></tr>
        </tbody>
      </table>
    </div>
    <div class="lectura">
      <p class="clave">Los meses de mejor precio en el mayoreo de Estados Unidos: jitomate en noviembre a enero (US$2.0/kg contra US$1.72 de mediana), aguacate en enero a marzo (hasta US$6.26/kg contra US$4.59), fresa en octubre y noviembre (el doble de la mediana), mango en octubre a diciembre y limón en marzo a mayo. Son las ventanas donde conviene tener producto.</p>
    </div>
    <p class="nota">Fuentes: UN Comtrade, importaciones mensuales de EE. UU. por país (reporte de EE. UU., 2025); USDA AMS Market News, embarques semanales por procedencia y precios diarios de mayoreo en 11 mercados terminales. Temporada fuerte = meses con al menos la mitad del volumen del mes más alto del competidor. Mejores meses = precio mensual al menos 5% arriba de la mediana del año.</p>
  </div>
</section>

<section id="acceso">
  <div class="lado"><span class="etq"><b>13</b> · Acceso</span><span class="etq">Autoridades sanitarias y aduanas · sep 2026</span></div>
  <div class="cuerpo">
    <h2>Norteamérica y Europa están abiertas; China, Japón y Corea siguen casi cerradas al producto mexicano</h2>
    <div class="lectura">
      <p>Revisamos, para 29 frutas y hortalizas frescas, si el producto mexicano puede entrar a siete mercados, con qué requisito principal y con qué arancel, en las fuentes oficiales de cada país.</p>
    </div>
    <div class="tabla">
      <table>
        <thead><tr><th>Mercado</th><th class="num">Abierto</th><th class="num">Con condiciones</th><th class="num">Cerrado</th><th>Arancel para México</th></tr></thead>
        <tbody>
          <tr><td>Estados Unidos</td><td class="num">20</td><td class="num">9</td><td class="num">0</td><td>0% (T-MEC); el jitomate paga una cuota antidumping de 17.09%</td></tr>
          <tr><td>Canadá</td><td class="num">27</td><td class="num">1</td><td class="num">1</td><td>0% (T-MEC)</td></tr>
          <tr><td>Unión Europea</td><td class="num">19</td><td class="num">9</td><td class="num">1</td><td>0% en la mayoría (TLCUEM); melón 8.8% y uva de mesa 14.1% sin preferencia</td></tr>
          <tr><td>Reino Unido</td><td class="num">23</td><td class="num">5</td><td class="num">1</td><td>0% en la mayoría (acuerdo con México)</td></tr>
          <tr><td>Japón</td><td class="num">15</td><td class="num">9</td><td class="num">5</td><td>Acuerdo con México; piña 17%</td></tr>
          <tr><td>China</td><td class="num">0</td><td class="num">5</td><td class="num">23</td><td>Nación más favorecida (sin tratado); aguacate 7%</td></tr>
          <tr><td>Corea del Sur</td><td class="num">7</td><td class="num">3</td><td class="num">19</td><td>Tasa básica, sin tratado: jitomate 45%, pimiento 50%, limón persa 50%</td></tr>
        </tbody>
      </table>
    </div>
    <div class="lectura">
      <p class="clave">China solo acepta de México aguacate Hass, uva, zarzamora y frambuesa, y arándano, cada uno con protocolo de huertos y empacadoras registradas; ninguna hortaliza tiene acceso. Corea cierra las frutas hospederas de mosca de la fruta y solo abrió aguacate Hass de Michoacán, uva de Sonora y, desde agosto de 2026, limón persa. Japón cierra papa, berenjena, tomate verde, guayaba y papaya.</p>
      <p>En Estados Unidos todo entra, pero nueve productos piden condiciones: aguacate Hass solo de Michoacán y Jalisco, cítricos y mango de zonas libres de mosca o con tratamiento, guayaba irradiada, brócoli con declaración o fumigación. La Unión Europea y el Reino Unido prohíben la papa.</p>
    </div>
    <p class="nota">Fuentes: USDA APHIS ACIR y USITC HTS; CFIA AIRS y CBSA; Reglamento (UE) 2019/2072 y Access2Markets; DEFRA y UK Trade Tariff; MAFF y Aduana de Japón; GACC y arancel de China 2026; APQA y arancel de Corea. "Abierto" en la UE, Japón y Corea significa que el producto no aparece entre los prohibidos ni con requisitos especiales. No incluye límites de residuos de plaguicidas, normas de comercialización ni registro de huertos. Consulta: septiembre de 2026. En el mapa, cada casilla trae su fuente.</p>
  </div>
</section>

<section id="sequia">
  <div class="lado"><span class="etq"><b>14</b> · Riesgo</span><span class="etq">CONAGUA · SIAP</span></div>
  <div class="cuerpo">
    <h2>La mitad del espárrago y una cuarta parte del limón, la cebolla y el plátano se cultivan hoy en zonas con sequía</h2>
    <div class="lectura">
      <p>Cruzamos el Monitor de Sequía de CONAGUA, municipio por municipio, con la producción municipal del SIAP: qué parte de la cosecha de cada producto está en municipios con sequía moderada o peor.</p>
    </div>
    <div class="mini-cifras">
      <div><b>52%</b><span>del espárrago, concentrado en Sonora y Baja California</span></div>
      <div><b>24–25%</b><span>del limón, la cebolla y el plátano</span></div>
      <div><b>10%</b><span>del aguacate (11% en Michoacán)</span></div>
    </div>
    <div class="lectura">
      <p>Le siguen el mango (21%), la uva (19%), la papa (18%) y el chile (15%). La fresa, la frambuesa y el arándano están prácticamente fuera de zonas con sequía. La sequía no pega igual a todos: los cultivos de riego resisten mejor en el corto plazo, pero dependen de presas y acuíferos.</p>
    </div>
    <p class="nota">Fuente: CONAGUA / Servicio Meteorológico Nacional, Monitor de Sequía de México por municipio, corte del 15 de septiembre de 2026; SIAP, producción municipal 2025. En el mapa: vista de municipios, color "Sequía hoy", y la parte de la producción en sequía en las pestañas Producto y Entidad.</p>
  </div>
</section>

<section id="estrategias">'''
rep('<section id="estrategias">', NUEVAS)

# ---- Propuestas: evidencia de acceso y temporadas ----
rep('''        <h3>Diversificar destinos y regiones</h3>''', '''        <h3>Diversificar destinos, temporadas y regiones</h3>''')
rep('''        <p>Abrir mercados en Asia y Europa para aguacate, berries, nuez y hortalizas, y promover nuevas zonas productoras fuera de los estados que hoy concentran la oferta.</p>''',
    '''        <p>Abrir mercados en Asia y Europa para aguacate, berries, nuez y hortalizas; negociar protocolos con China, Japón y Corea, que hoy cierran la mayoría de los productos; ocupar en Estados Unidos las temporadas que hoy llenan Perú, Guatemala y Chile, y promover nuevas zonas productoras fuera de los estados que concentran la oferta y de las zonas con sequía.</p>''')

# ---- Fuentes ----
rep('''      <div><b>Latinoamérica y mundo</b>''', '''      <div><b>Competencia y acceso</b><span>UN Comtrade (importaciones mensuales de EE. UU., 2025); requisitos y aranceles de USDA APHIS, CFIA, UE, DEFRA, MAFF, GACC y APQA (septiembre de 2026).</span></div>
      <div><b>Europa y riesgo</b><span>Comisión Europea, precios en empacadora 2025; CONAGUA, Monitor de Sequía por municipio (septiembre de 2026); USDA, tarifas de camión refrigerado 2025.</span></div>
      <div><b>Latinoamérica y mundo</b>''')
f.write_text(t, encoding="utf-8")
print("reporte actualizado")
