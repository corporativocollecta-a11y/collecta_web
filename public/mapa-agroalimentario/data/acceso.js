// Generado por scripts/construir_acceso.py. Acceso fitosanitario y arancel para fruta/hortaliza fresca de México.
window.ACCESO = {
 "actualizado": "2026-09",
 "mercados": {
  "EUA": {
   "nombre": "Estados Unidos",
   "fuente": "USDA APHIS ACIR (requisitos por país/producto); USITC HTS (arancel T-MEC)",
   "url": "https://acir.aphis.usda.gov/s/acir-global-search?category=Plants-and-Plant-Products-Not-for-Propagation",
   "nombre_en": "United States"
  },
  "CAN": {
   "nombre": "Canadá",
   "fuente": "CFIA AIRS (origen México, consumo humano); CBSA Customs Tariff 2026 (MXT/T-MEC)",
   "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
   "nombre_en": "Canada"
  },
  "UE": {
   "nombre": "Unión Europea",
   "fuente": "Reglamento de Ejecución (UE) 2019/2072 consolidado 06-07-2026 (Anexos VI, VII y XI); EU Access2Markets (arancel origen MX)",
   "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
   "nombre_en": "European Union"
  },
  "RU": {
   "nombre": "Reino Unido",
   "fuente": "DEFRA Plant Health Portal (categorías de riesgo BTOM); 2019/2072 versión GB (legislation.gov.uk); UK Trade Tariff (país MX)",
   "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
   "nombre_en": "United Kingdom"
  },
  "JPN": {
   "nombre": "Japón",
   "fuente": "MAFF Plant Protection Station, Tabla Anexa 2 (plantas de importación prohibida); Aduana de Japón, arancel 08-08-2026 (columna EPA México)",
   "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
   "nombre_en": "Japan"
  },
  "CHN": {
   "nombre": "China",
   "fuente": "GACC listas de frutas y hortalizas frescas con acceso (actualizadas ago-2026); Arancel de la RPC 2026 (NMF, sin TLC con México)",
   "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
   "nombre_en": "China"
  },
  "KOR": {
   "nombre": "Corea del Sur",
   "fuente": "Reglamento de la Ley de Protección Fitosanitaria, anexo 1 y normas APQA de excepción para México (law.go.kr); Ley de Aduanas, tabla arancelaria (tasa básica, sin TLC)",
   "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
   "nombre_en": "South Korea"
  }
 },
 "productos": {
  "jitomate": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC) + antidumping 17.09% (orden AD desde 14-jul-2025)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmSYLYA3&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://www.federalregister.gov/documents/2025/07/17/2025-13453/fresh-tomatoes-from-mexico-termination-of-suspension-agreement-rescission-of-administrative-reviews",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA) + 17.09% antidumping (AD order since 14-Jul-2025)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Cert. fitosanitario con declaración de país/área/lugar libre de B. cockerelli, Neoleucinodes y Keiferia (Anexo VII 67-69)",
    "arancel": "0% con precio de entrada (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0702009999&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary cert. declaring country/area/place free of B. cockerelli, Neoleucinodes and Keiferia (Annex VII 67-69)",
    "arancel_en": "0% with entry price (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "con_condiciones",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; declaraciones sobre B. cockerelli y otras plagas (Anexo VII 100-102)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://www.legislation.gov.uk/eur/2019/2072/annex/VII",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0702009999?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; declarations on B. cockerelli and other pests (Annex VII 100-102)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Solo con envío directo de México a Japón (Apéndice 47 de la Tabla Anexa 2)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Only with direct shipment from Mexico to Japan (Appendix 47 of Annexed Table 2)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "chile": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000fsWRVYA2&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0709.60",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Área o lugar de producción libre de Anthonomus eugenii; declaraciones sobre B. cockerelli y Neoleucinodes (Anexo VII 67, 68, 72)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0709609990&origin=MX&destination=ES",
    "requisito_en": "Area or place of production free of Anthonomus eugenii; declarations on B. cockerelli and Neoleucinodes (Annex VII 67, 68, 72)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "con_condiciones",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; área/lugar libre de Anthonomus eugenii (Anexo VII 105) y B. cockerelli",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://www.legislation.gov.uk/eur/2019/2072/annex/VII",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0709609990?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; area/place free of Anthonomus eugenii (Annex VII 105) and B. cockerelli",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Solo pimiento morrón (var. grossum) con envío directo (Apéndice 92); chiles picantes prohibidos (ítem 12)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Bell pepper (var. grossum) only, direct shipment (Appendix 92); hot chili peppers prohibited (item 12)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "50% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "50% (basic rate, no FTA)"
   }
  },
  "aguacate": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Hass solo de Michoacán o Jalisco; envíos comerciales; cert. fitosanitario con declaración adicional; otros estados sin permiso",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000CGfoHYAT&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0804.40",
    "requisito_en": "Hass only from Michoacán or Jalisco; commercial shipments; phytosanitary cert. with additional declaration; other states not permitted",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0804400010&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0804400010?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "con_condiciones",
    "requisito": "Solo variedad Hass. Protocolo GACC: huertos, empacadoras y almacenes registrados; certificado fitosanitario",
    "arancel": "7% (tasa provisional NMF; NMF 25%)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Hass variety only. GACC protocol: registered orchards, packinghouses and cold stores; phytosanitary certificate",
    "arancel_en": "7% (provisional MFN rate; MFN 25%)"
   },
   "KOR": {
    "estado": "con_condiciones",
    "requisito": "Solo Hass de Michoacán; huertos y empacadoras registrados, trampeo de moscas, cert. con declaración (norma APQA 2025-26)",
    "arancel": "30% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000263646",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Hass from Michoacán only; registered orchards and packinghouses, fruit-fly trapping, cert. with declaration (APQA rule 2025-26)",
    "arancel_en": "30% (basic rate, no FTA)"
   }
  },
  "limon": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Limón persa/agrio: cert. fitosanitario con declaración adicional de limpieza en empacadora",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000frAUfYAM&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0805.50",
    "requisito_en": "Persian/sour lime: phytosanitary cert. with additional declaration of packinghouse cleaning",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Sin pedúnculo ni hojas; declaración oficial sobre cancro de los cítricos y moscas Tephritidae (Anexo VII 57-61)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0805509010&origin=MX&destination=ES",
    "requisito_en": "Free of peduncles and leaves; official statement on citrus canker and Tephritidae fruit flies (Annex VII 57-61)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación (cítricos)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0805509010?country=MX",
    "requisito_en": "Low risk (BTOM): no phytosanitary certificate or pre-notification (citrus)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "Lima persa y mexicana y limón excluidos de las prohibiciones por Anastrepha (Tabla Anexa 2, ítems 18 y 20)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Persian and Mexican lime and lemon excluded from the Anastrepha prohibitions (Annexed Table 2, items 18 and 20)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "11% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "11% (MFN)"
   },
   "KOR": {
    "estado": "con_condiciones",
    "requisito": "Solo limón persa; huertos y empacadoras registrados ante SENASICA, inspección en campo (norma APQA 2026-36, 21-ago-2026)",
    "arancel": "50% (limón persa) (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000284198",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Persian lime only; orchards and packinghouses registered with SENASICA, field inspection (APQA rule 2026-36, 21-Aug-2026)",
    "arancel_en": "50% (Persian lime) (basic rate, no FTA)"
   }
  },
  "naranja": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Zona libre de mosca de la fruta o tratamiento cuarentenario (frío, vapor, irradiación, aire forzado); solo puertos continentales",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000ObTwTYAV&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0805.10",
    "requisito_en": "Fruit-fly-free area or quarantine treatment (cold, vapor heat, irradiation, forced air); continental ports only",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Sin pedúnculo ni hojas; declaración sobre cancro, mancha negra y moscas Tephritidae (Anexo VII 57-61)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0805102890&origin=MX&destination=ES",
    "requisito_en": "Free of peduncles and leaves; statement on canker, citrus black spot and Tephritidae fruit flies (Annex VII 57-61)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación (cítricos)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0805102290?country=MX",
    "requisito_en": "Low risk (BTOM): no phytosanitary certificate or pre-notification (citrus)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Envío directo y cumplir normas del MAFF (Apéndice 86); hospedero de Anastrepha ludens y striata",
    "arancel": "5% jun-nov / 10% dic-may en cupo AAE; fuera de cupo 16%/32%",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Direct shipment and compliance with MAFF standards (Appendix 86); host of Anastrepha ludens and striata",
    "arancel_en": "5% Jun-Nov / 10% Dec-May within EPA quota; out of quota 16%/32%"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "11% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "11% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "50% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "50% (basic rate, no FTA)"
   }
  },
  "mango": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Zona libre de mosca de la fruta o tratamiento (agua caliente, irradiación, aire forzado, vapor); solo comercial",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000oOr81YAC&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0804.50",
    "requisito_en": "Fruit-fly-free area or treatment (hot water, irradiation, forced air, vapor heat); commercial only",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Declaración oficial sobre moscas Tephritidae: país, área o lugar libre, o tratamiento eficaz (Anexo VII 61)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0804500040&origin=MX&destination=ES",
    "requisito_en": "Official statement on Tephritidae fruit flies: pest-free country, area or place, or effective treatment (Annex VII 61)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación",
    "arancel": "0% (NMF)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0804500040?country=MX",
    "requisito_en": "Low risk (BTOM): no phytosanitary certificate or pre-notification",
    "arancel_en": "0% (MFN)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Envío directo y cumplir normas del MAFF (Apéndice 87)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Direct shipment and compliance with MAFF standards (Appendix 87)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "15% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "15% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "30% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "30% (basic rate, no FTA)"
   }
  },
  "papa": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Cert. fitosanitario con declaraciones adicionales (Globodera, semilla certificada, plagas listadas); etiqueta 'no para siembra'",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000jmXSnYAM&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0701.90",
    "requisito_en": "Phytosanitary cert. with additional declarations (Globodera, certified seed, listed pests); 'not for planting' label",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "cerrado",
    "requisito": "Requiere aprobación previa del CFIA (análisis de riesgo de plagas) y permiso de importación; sin acceso vigente",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Requires prior CFIA approval (pest risk analysis) and an import permit; no current access",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "cerrado",
    "requisito": "Tubérculos de Solanum prohibidos desde México (Anexo VI, punto 17)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0701909090&origin=MX&destination=ES",
    "requisito_en": "Solanum tubers prohibited from Mexico (Annex VI, point 17)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "cerrado",
    "requisito": "Tubérculos de Solanum prohibidos desde México (2019/2072 GB, Anexo VI, punto 17)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "legislation.gov.uk",
    "url": "https://www.legislation.gov.uk/eur/2019/2072/annex/VI",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0701909090?country=MX",
    "requisito_en": "Solanum tubers prohibited from Mexico (2019/2072 GB, Annex VI, point 17)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "cerrado",
    "requisito": "Tubérculos de solanáceas prohibidos desde México (nematodo dorado, ítem 10)",
    "arancel": "4.3% (NMF; sin preferencia AAE)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Solanaceous tubers prohibited from Mexico (golden nematode, item 10)",
    "arancel_en": "4.3% (MFN; no EPA preference)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Partes subterráneas de solanáceas prohibidas desde México (anexo 1, puntos 7 y 9)",
    "arancel": "30% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Underground parts of Solanaceae prohibited from Mexico (Annex 1, points 7 and 9)",
    "arancel_en": "30% (basic rate, no FTA)"
   }
  },
  "cebolla": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmRu1YAF&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0703.10",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado sin suelo: licencia SFC y DRC; sin certificado fitosanitario (directiva D-94-26)",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved if soil-free: SFC licence and DRC; no phytosanitary certificate (directive D-94-26)",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=07031019&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio B (BTOM): certificado fitosanitario, sin prenotificación",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0703101900?country=MX",
    "requisito_en": "Medium risk B (BTOM): phytosanitary certificate, no pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "abierto",
    "requisito": "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección",
    "arancel": "50% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Not listed as a prohibited plant for Mexico (Annex 1); phytosanitary certificate and inspection",
    "arancel_en": "50% (basic rate, no FTA)"
   }
  },
  "brocoli": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Cert. fitosanitario: libre de Copitarsia (o Mexicali, área sin la plaga); sin él, fumigación con bromuro de metilo",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000qkxSVYAY&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0704.10",
    "requisito_en": "Phytosanitary cert.: free of Copitarsia (or Mexicali, pest-free area); without it, methyl bromide fumigation",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0704101010&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio B (BTOM): certificado fitosanitario, sin prenotificación",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0704101010?country=MX",
    "requisito_en": "Medium risk B (BTOM): phytosanitary certificate, no pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "11% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "11% (MFN)"
   },
   "KOR": {
    "estado": "abierto",
    "requisito": "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección",
    "arancel": "27% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Not listed as a prohibited plant for Mexico (Annex 1); phytosanitary certificate and inspection",
    "arancel_en": "27% (basic rate, no FTA)"
   }
  },
  "fresa": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmSOfYAN&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0810.10",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=081010&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0810100000?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "14% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "14% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "pepino": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmOGEYA3&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0707",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% con precio de entrada (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0707000599&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% with entry price (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (cucurbitáceas de América)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0707000599?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (cucurbits from the Americas)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "27% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "27% (basic rate, no FTA)"
   }
  },
  "calabacita": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3) (Cucurbita spp.)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000J6zlrYAB&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0709.93",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3) (Cucurbita spp.)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% con precio de entrada (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=07099310&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% with entry price (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (cucurbitáceas de América)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0709931000?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (cucurbits from the Americas)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "27% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "27% (basic rate, no FTA)"
   }
  },
  "zanahoria": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmX8DYAV&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0706.10",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado sin suelo: licencia SFC y DRC; sin certificado fitosanitario (directiva D-94-26)",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved if soil-free: SFC licence and DRC; no phytosanitary certificate (directive D-94-26)",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0706100010&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (raíces)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0706100010?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (root vegetables)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Partes subterráneas de zanahoria prohibidas desde México (nematodos Radopholus, anexo 1, punto 14)",
    "arancel": "30% o 134 KRW/kg, el mayor (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Underground parts of carrot prohibited from Mexico (Radopholus nematodes, Annex 1, point 14)",
    "arancel_en": "30% or 134 KRW/kg, whichever is higher (basic rate, no FTA)"
   }
  },
  "lechuga": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000kUde9YAC&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0705.11",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=070511&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio B (BTOM): certificado fitosanitario, sin prenotificación",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0705110000?country=MX",
    "requisito_en": "Medium risk B (BTOM): phytosanitary certificate, no pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "10% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "10% (MFN)"
   },
   "KOR": {
    "estado": "abierto",
    "requisito": "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Not listed as a prohibited plant for Mexico (Annex 1); phytosanitary certificate and inspection",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "sandia": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmSmrYAF&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0807.11",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=080711&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (cucurbitáceas de América)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0807110000?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (cucurbits from the Americas)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "25% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "25% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "melon": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0j3d000000Sz2ZAAS&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0807.19",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "8.8% (NMF; sin preferencia para México)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0807190090&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "8.8% (MFN; no preference for Mexico)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (cucurbitáceas de América)",
    "arancel": "0% (suspensión arancelaria RU hasta 2028; NMF 8%)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0807190090?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (cucurbits from the Americas)",
    "arancel_en": "0% (UK tariff suspension until 2028; MFN 8%)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "12% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "12% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "papaya": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Cert. fitosanitario con estado de origen y declaración adicional; Chiapas solo huertos aprobados; prohibido a Hawái",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000fsVYfYAM&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0807.20",
    "requisito_en": "Phytosanitary cert. with state of origin and additional declaration; Chiapas approved orchards only; not to Hawaii",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (NMF)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=080720&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (MFN)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación",
    "arancel": "0% (NMF)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0807200000?country=MX",
    "requisito_en": "Low risk (BTOM): no phytosanitary certificate or pre-notification",
    "arancel_en": "0% (MFN)"
   },
   "JPN": {
    "estado": "cerrado",
    "requisito": "Hospedero de Anastrepha striata (ítem 23) sin excepción para México; el Apéndice 84 solo exime del ítem 18",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Host of Anastrepha striata (item 23) with no exemption for Mexico; Appendix 84 only exempts from item 18",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "25% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "25% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "30% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "30% (basic rate, no FTA)"
   }
  },
  "pina": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3); no a Hawái",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jt000001Ahr5RAAR&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0804.30",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3); not to Hawaii",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Sin certificado fitosanitario (Anexo XI, parte C)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0804300090&origin=MX&destination=ES",
    "requisito_en": "No phytosanitary certificate required (Annex XI, Part C)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0804300090?country=MX",
    "requisito_en": "Low risk (BTOM): no phytosanitary certificate or pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "17% (NMF; sin preferencia AAE)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "17% (MFN; no EPA preference)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "12% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "12% (MFN)"
   },
   "KOR": {
    "estado": "abierto",
    "requisito": "Piña permitida desde México por el anexo 1 (punto 2); certificado fitosanitario e inspección",
    "arancel": "30% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Pineapple permitted from Mexico under Annex 1 (point 2); phytosanitary certificate and inspection",
    "arancel_en": "30% (basic rate, no FTA)"
   }
  },
  "uva": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmcHZYAZ&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0806.10",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "14.1% NMF con precio de entrada (al 28-sep-2026; estacional); sin preferencia para México",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0806101090&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "14.1% MFN with entry price (as of 28-Sep-2026; seasonal); no preference for Mexico"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS",
    "arancel": "0% (suspensión arancelaria RU hasta 2028; NMF 8%)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0806101090?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification",
    "arancel_en": "0% (UK tariff suspension until 2028; MFN 8%)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 80)",
    "arancel": "0% abr-jul (AAE); resto del año NMF 17% (mar-oct) o 7.8% (nov-feb)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Except Chiapas and no transit through item 18 areas (Appendix 80)",
    "arancel_en": "0% Apr-Jul (EPA); rest of year MFN 17% (Mar-Oct) or 7.8% (Nov-Feb)"
   },
   "CHN": {
    "estado": "con_condiciones",
    "requisito": "Protocolo GACC: huertos, empacadoras y almacenes registrados; certificado fitosanitario",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "GACC protocol: registered orchards, packinghouses and cold stores; phytosanitary certificate",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "con_condiciones",
    "requisito": "Solo uva de Sonora; huertos registrados, trampeo de moscas y pruebas de Xylella fastidiosa (norma APQA 2026-5)",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000272914",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Sonora grapes only; registered orchards, fruit-fly trapping and Xylella fastidiosa testing (APQA rule 2026-5)",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "toronja": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Zona libre de mosca de la fruta o tratamiento (irradiación, frío, vapor, aire forzado, bromuro de metilo)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000OVY9FYAX&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0805.40",
    "requisito_en": "Fruit-fly-free area or treatment (irradiation, cold, vapor heat, forced air, methyl bromide)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Sin pedúnculo ni hojas; declaración sobre cancro, mancha negra y moscas Tephritidae (Anexo VII 57-61)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0805400011&origin=MX&destination=ES",
    "requisito_en": "Free of peduncles and leaves; statement on canker, citrus black spot and Tephritidae fruit flies (Annex VII 57-61)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación (cítricos)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0805400011?country=MX",
    "requisito_en": "Low risk (BTOM): no phytosanitary certificate or pre-notification (citrus)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Envío directo y cumplir normas del MAFF (Apéndice 86)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Direct shipment and compliance with MAFF standards (Appendix 86)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "12% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "12% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "30% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "30% (basic rate, no FTA)"
   }
  },
  "berenjena": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmU0iYAF&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0709.30",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Declaraciones de país/área/lugar libre de B. cockerelli, Neoleucinodes, Keiferia y Thrips palmi (Anexo VII 67-70)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0709300005&origin=MX&destination=ES",
    "requisito_en": "Declarations of country/area/place free of B. cockerelli, Neoleucinodes, Keiferia and Thrips palmi (Annex VII 67-70)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "con_condiciones",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; declaraciones sobre B. cockerelli y otras plagas (Anexo VII 100-103)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://www.legislation.gov.uk/eur/2019/2072/annex/VII",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0709300005?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; declarations on B. cockerelli and other pests (Annex VII 100-103)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "cerrado",
    "requisito": "Frutos de solanáceas prohibidos desde México (moho azul, ítem 12)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Solanaceous fruits prohibited from Mexico (blue mold, item 12)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "27% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "27% (basic rate, no FTA)"
   }
  },
  "esparrago": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000NUEOUYA5&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0709.20",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% dentro de cupo (TLCUEM); fuera de cupo 10.2%",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0709200010&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% within quota (EU-Mexico agreement); out of quota 10.2%"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS (espárrago de América)",
    "arancel": "0% dentro de cupo (acuerdo RU-México); fuera 10%",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0709200010?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification (asparagus from the Americas)",
    "arancel_en": "0% within quota (UK-Mexico agreement); out of quota 10%"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "abierto",
    "requisito": "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección",
    "arancel": "27% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Not listed as a prohibited plant for Mexico (Annex 1); phytosanitary certificate and inspection",
    "arancel_en": "27% (basic rate, no FTA)"
   }
  },
  "arandano": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmNvIYAV&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0810.40",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "con_condiciones",
    "requisito": "Certificado fitosanitario (emitido ≤14 días antes); libre de suelo, hojas y plagas",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Phytosanitary certificate (issued ≤14 days before); free of soil, leaves and pests",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Área o lugar libre de Grapholita packardi, o enfoque de sistemas/tratamiento (Anexo VII 63, específico México)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=08104050&origin=MX&destination=ES",
    "requisito_en": "Area or place free of Grapholita packardi, or systems approach/treatment (Annex VII 63, Mexico-specific)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "con_condiciones",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; área/lugar libre de Grapholita packardi o tratamiento (Anexo VII 96, México)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://www.legislation.gov.uk/eur/2019/2072/annex/VII",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0810405000?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; area/place free of Grapholita packardi or treatment (Annex VII 96, Mexico)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 83)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Except Chiapas and no transit through item 18 areas (Appendix 83)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "con_condiciones",
    "requisito": "Protocolo GACC: huertos, empacadoras y almacenes registrados; certificado fitosanitario",
    "arancel": "30% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "GACC protocol: registered orchards, packinghouses and cold stores; phytosanitary certificate",
    "arancel_en": "30% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "frambuesa": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmSA9YAN&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0810.20",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=08102010&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0810201000?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 82)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Except Chiapas and no transit through item 18 areas (Appendix 82)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "con_condiciones",
    "requisito": "Protocolo GACC: huertos, empacadoras y almacenes registrados; certificado fitosanitario",
    "arancel": "25% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "GACC protocol: registered orchards, packinghouses and cold stores; phytosanitary certificate",
    "arancel_en": "25% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "zarzamora": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmTkXYAV&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0810.20",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=08102090&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0810209000?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "con_condiciones",
    "requisito": "Excepto Chiapas y sin tránsito por zonas del ítem 18 (Apéndice 82)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Except Chiapas and no transit through item 18 areas (Appendix 82)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "con_condiciones",
    "requisito": "Protocolo GACC: huertos, empacadoras y almacenes registrados; certificado fitosanitario",
    "arancel": "25% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "GACC protocol: registered orchards, packinghouses and cold stores; phytosanitary certificate",
    "arancel_en": "25% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "45% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "45% (basic rate, no FTA)"
   }
  },
  "guayaba": {
   "EUA": {
    "estado": "con_condiciones",
    "requisito": "Solo comercial; irradiación obligatoria (mín. 400 Gy) en origen o a la llegada",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000OVwLGYA1&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0804.50",
    "requisito_en": "Commercial only; mandatory irradiation (min. 400 Gy) at origin or on arrival",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0804500030&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo bajo (BTOM): sin certificado fitosanitario ni prenotificación",
    "arancel": "0% (NMF)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0804500030?country=MX",
    "requisito_en": "Low risk (BTOM): no phytosanitary certificate or pre-notification",
    "arancel_en": "0% (MFN)"
   },
   "JPN": {
    "estado": "cerrado",
    "requisito": "Hospedero de moscas Anastrepha presentes en México (ítems 18, 20, 21 y 23)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Host of Anastrepha fruit flies present in Mexico (items 18, 20, 21 and 23)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "15% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "15% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "30% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "30% (basic rate, no FTA)"
   }
  },
  "nopal": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3) (tuna y nopal)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000cgzCTYAY&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0709.99",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3) (prickly pear fruit and cactus pad)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Certificado fitosanitario; sin requisitos especiales para México en el Anexo VII",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0709999090&origin=MX&destination=ES",
    "requisito_en": "Phytosanitary certificate; no special requirements for Mexico in Annex VII",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio B (BTOM): certificado fitosanitario, sin prenotificación",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0709999090?country=MX",
    "requisito_en": "Medium risk B (BTOM): phytosanitary certificate, no pre-notification",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Not listed as prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "abierto",
    "requisito": "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección",
    "arancel": "27% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Not listed as a prohibited plant for Mexico (Annex 1); phytosanitary certificate and inspection",
    "arancel_en": "27% (basic rate, no FTA)"
   }
  },
  "tomate_verde": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3)",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000Ic65HYAR&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0709.99",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3)",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador y membresía DRC; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch07-eng.html",
    "requisito_en": "Approved: importer SFC licence and DRC membership; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "con_condiciones",
    "requisito": "Solanácea: declaración de país/área/lugar libre de Bactericera cockerelli (Anexo VII 67)",
    "arancel": "0% (TLCUEM)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=0709999090&origin=MX&destination=ES",
    "requisito_en": "Solanaceous: declaration of country/area/place free of Bactericera cockerelli (Annex VII 67)",
    "arancel_en": "0% (EU-Mexico agreement)"
   },
   "RU": {
    "estado": "con_condiciones",
    "requisito": "Riesgo medio A: cert. fitosanitario y prenotificación IPAFFS; solanácea de América: declaración sobre Bactericera cockerelli (Anexo VII 100)",
    "arancel": "0% (acuerdo RU-México)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://www.legislation.gov.uk/eur/2019/2072/annex/VII",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0709999090?country=MX",
    "requisito_en": "Medium risk A: phytosanitary cert. and IPAFFS pre-notification; solanaceous from the Americas: B. cockerelli declaration (Annex VII 100)",
    "arancel_en": "0% (UK-Mexico agreement)"
   },
   "JPN": {
    "estado": "cerrado",
    "requisito": "Frutos de solanáceas prohibidos desde México (moho azul, ítem 12)",
    "arancel": "0% (AAE México-Japón)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_07.htm",
    "requisito_en": "Solanaceous fruits prohibited from Mexico (blue mold, item 12)",
    "arancel_en": "0% (Mexico-Japan EPA)"
   },
   "CHN": {
    "estado": "cerrado",
    "requisito": "No figura en la lista GACC de productos frescos con acceso para México (ago-2026)",
    "arancel": "13% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not on the GACC list of fresh products with access for Mexico (Aug-2026)",
    "arancel_en": "13% (MFN)"
   },
   "KOR": {
    "estado": "cerrado",
    "requisito": "Fruto hospedero de moscas de la fruta: prohibido desde México (anexo 1, punto 2); sin norma de excepción vigente",
    "arancel": "27% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Fruit-fly host fruit: prohibited from Mexico (Annex 1, point 2); no exemption rule in force",
    "arancel_en": "27% (basic rate, no FTA)"
   }
  },
  "nuez": {
   "EUA": {
    "estado": "abierto",
    "requisito": "Permiso de importación APHIS e inspección en puerto (7 CFR 319.56-3) (documento ACIR 'Pecan (Fruit)')",
    "arancel": "0% (T-MEC)",
    "fuente": "USDA APHIS ACIR",
    "url": "https://acir.aphis.usda.gov/s/acir-document-detail?rowId=a0jSJ00000BmF87YAF&Document_Type=Commodity%20Import%20Requirements",
    "url_arancel": "https://hts.usitc.gov/search?query=0802.99",
    "requisito_en": "APHIS import permit and port-of-entry inspection (7 CFR 319.56-3) (ACIR document 'Pecan (Fruit)')",
    "arancel_en": "0% (USMCA)"
   },
   "CAN": {
    "estado": "abierto",
    "requisito": "Aprobado: licencia SFC del importador; sin certificado fitosanitario",
    "arancel": "0% (T-MEC)",
    "fuente": "CFIA AIRS",
    "url": "https://airs-sari.inspection.gc.ca/airs_external/english/decisions-eng.aspx",
    "url_arancel": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/html/00/ch08-eng.html",
    "requisito_en": "Approved: importer SFC licence; no phytosanitary certificate",
    "arancel_en": "0% (USMCA)"
   },
   "UE": {
    "estado": "abierto",
    "requisito": "Sin prohibición ni requisito especial en el Reg. (UE) 2019/2072",
    "arancel": "0% (NMF)",
    "fuente": "Reg. (UE) 2019/2072; Access2Markets",
    "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019R2072-20260706",
    "url_arancel": "https://trade.ec.europa.eu/access-to-markets/en/results?product=08029910&origin=MX&destination=ES",
    "requisito_en": "No prohibition or special requirement in Reg. (EU) 2019/2072",
    "arancel_en": "0% (MFN)"
   },
   "RU": {
    "estado": "abierto",
    "requisito": "Riesgo medio B (BTOM): certificado fitosanitario, sin prenotificación",
    "arancel": "0% (NMF)",
    "fuente": "DEFRA BTOM; UK Trade Tariff",
    "url": "https://planthealthportal.defra.gov.uk/trade/imports/target-operating-model-tom/btom-risk-categorisations/",
    "url_arancel": "https://www.trade-tariff.service.gov.uk/commodities/0802991000?country=MX",
    "requisito_en": "Medium risk B (BTOM): phytosanitary certificate, no pre-notification",
    "arancel_en": "0% (MFN)"
   },
   "JPN": {
    "estado": "abierto",
    "requisito": "No figura como prohibido para México en la Tabla Anexa 2; certificado fitosanitario e inspección (el ítem 5 solo aplica a Juglans)",
    "arancel": "4.5% (NMF; sin preferencia AAE)",
    "fuente": "MAFF PPS Tabla Anexa 2; Aduana de Japón",
    "url": "https://www.maff.go.jp/pps/j/law/houki/shorei/E_Annexed_Table2.html",
    "url_arancel": "https://www.customs.go.jp/english/tariff/2026_08_08/data/e_08.htm",
    "requisito_en": "Not prohibited for Mexico in Annexed Table 2; phytosanitary certificate and inspection (item 5 applies only to Juglans)",
    "arancel_en": "4.5% (MFN; no EPA preference)"
   },
   "CHN": {
    "estado": "sin_dato",
    "requisito": "No verificado (nueces con cáscara fuera de las listas de frutas y hortalizas frescas)",
    "arancel": "24% (NMF)",
    "fuente": "GACC; Arancel RPC 2026",
    "url": "http://dzs.customs.gov.cn/dzs/2020-05/19/article_2025123119301257348.html",
    "url_arancel": "https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm",
    "requisito_en": "Not verified (in-shell nuts are outside the fresh fruit and vegetable lists)",
    "arancel_en": "24% (MFN)"
   },
   "KOR": {
    "estado": "abierto",
    "requisito": "No figura como planta prohibida para México (anexo 1); certificado fitosanitario e inspección (el punto 3 solo aplica a nogal Juglans)",
    "arancel": "30% (tasa básica, sin TLC)",
    "fuente": "APQA/law.go.kr; Ley de Aduanas",
    "url": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=285619",
    "url_arancel": "https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=288689",
    "requisito_en": "Not listed as prohibited for Mexico (Annex 1); phytosanitary certificate and inspection (point 3 applies only to Juglans walnut)",
    "arancel_en": "30% (basic rate, no FTA)"
   }
  }
 }
};
