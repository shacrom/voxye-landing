# Guion — Vídeo demo de Voxye (flujo completo)

Objetivo: un único vídeo (~60–90 s) que muestre el flujo real del producto:
**crear presupuesto → convertirlo en contrato → emitir factura proforma**.
Es la misma historia que cuenta la landing ("Cinco pasos, un solo expediente"),
así que el vídeo la refuerza en lugar de dispersarse.

Destino del archivo: `public/demo/voxye-demo.mp4` (sustituye al actual).
Poster opcional: `public/demo/voxye-demo-poster.jpg`.

---

## 1. Datos de demo (ficticios, verosímiles)

Usar EXACTAMENTE estos datos en el tenant de demo. Ningún nombre, dirección,
teléfono o email debe corresponder a personas o empresas reales.

> **Grabación automatizada**: este guion lo ejecuta el script
> `voxye-automation/src/tasks/landing-demo-video.ts` (Playwright, headed —
> el visor PDF de Chromium no renderiza en headless). Regrabar = relanzar
> el script con el front local y Supabase local levantados.

### Empresa / tienda
| Campo | Valor |
|---|---|
| Empresa demo | Cocinas y Baños Demo (tenant local, companyId=1) |
| Usuario en cámara | Admin Demo (admin-demo@voxye.es) |

### Cliente
| Campo | Valor |
|---|---|
| Nombre | Elena Roldán Vega |
| Dirección de obra | Calle del Almendro 27, 2ºA — Valencia |
| Teléfono | 612 000 341 |
| Email | elena.roldan@ejemplo.es |

> El dominio `ejemplo.es` evita emails reales. No usar dominios comerciales.

### Proyecto
| Campo | Valor |
|---|---|
| Título | Reforma integral de baño — Almendro 27 |

### Partidas del presupuesto
| Partida | Importe (base) |
|---|---|
| Demolición y retirada de sanitarios | 890,00 € |
| Alicatado y solado porcelánico | 2.140,00 € |
| Plato de ducha y mampara | 1.320,00 € |
| Mueble de baño y espejo | 940,00 € |
| Fontanería y desagües | 760,00 € |
| **Subtotal** | **6.050,00 €** |
| IVA 21% | 1.270,50 € |
| **Total** | **7.320,50 €** |

### Anticipo (para la proforma)
| Concepto | Valor |
|---|---|
| Anticipo a cuenta a la firma | 2.196,15 € (30 %) |

---

## 2. Preparación antes de grabar

- [ ] Tenant de demo limpio: sin documentos con nombres reales, sin "Sin título",
      sin datos de prueba tipo "asdf".
- [ ] Usuario de demo sin nombre personal visible (p. ej. "Demo Aldabra").
- [ ] Cliente Elena Roldán ya creado en fichas de clientes (ahorra tiempo en cámara).
- [ ] Catálogo con las 5 partidas cargadas (o precios a mano, según fluidez).
- [ ] Navegador: pantalla limpia, sin marcadores personales, sin otras pestañas,
      zoom al 100 %, notificaciones desactivadas.
- [ ] Resolución de grabación: 1920×1080 mínimo.

---

## 3. Escenas

### Escena 1 — Presupuesto (0:00 – 0:35)
1. Desde el listado de presupuestos, pulsar **Nuevo presupuesto**.
2. Seleccionar cliente: *Elena Roldán Vega*. Título: *Reforma integral de baño — Almendro 27*.
3. Añadir 3–4 partidas del catálogo (no hace falta las cinco en cámara; que se vea el gesto).
4. Mostrar la **vista previa PDF en tiempo real** mientras se añade una partida
   (es el momento estrella: lo que ves = lo que recibe el cliente).
5. Añadir un descuento y que se vea el recálculo automático de totales e IVA.
6. Cambiar estado a **Aceptado**.

### Escena 2 — Contrato (0:35 – 0:50)
1. Desde el presupuesto aceptado, pulsar **Convertir en contrato**.
2. Mostrar que el contrato hereda contenido y numeración vinculada
   (que se vea la referencia al presupuesto de origen).
3. Registrar el anticipo del 30 % si el flujo lo permite en pantalla.

### Escena 3 — Factura proforma (0:50 – 1:15)
1. Desde el contrato, crear **proforma a cuenta**.
2. Mostrar el anticipo **deducido automáticamente** (el importe restante ya calculado).
3. Abrir el PDF generado.
4. Cierre: volver al expediente donde se ven los tres documentos vinculados
   (presupuesto → contrato → proforma). Ese plano final ES el mensaje de la landing.

---

## 4. Reglas de grabación

- Ritmo tranquilo: pausa de ~1 s tras cada acción para que el espectador la procese.
- Sin audio ni locución (el vídeo de la landing se reproduce silenciado).
- Movimientos de ratón directos, sin vueltas.
- Si un paso sale mal, repetir la escena entera: cortar a mitad se nota.
- Revisar el resultado fotograma a fotograma antes de exportar: ningún dato real
  debe aparecer ni un instante (búsquedas, autocompletados, historiales).
