# Datos del CV — webPersonal

Contenido de `data/`:

| Archivo | Qué es |
|---|---|
| `cv.json` | Fuente única de datos del CV. Bilingüe ES/EN. |
| `CV_JoseCarlosZorrilla_ES.docx` | CV en Word (español), para descarga desde la web. |
| `CV_JoseCarlosZorrilla_EN.docx` | CV en Word (inglés), para descarga desde la web. |

Actualizado: 2026-11-23.

## Forma de `cv.json`

Los campos de texto traducibles son objetos `{ "es": "...", "en": "..." }`. El resto
(fechas, URLs, listas de tecnologías) son valores planos comunes a los dos idiomas.

Bloques de primer nivel:

- `basics` — nombre, titular, ubicación, contacto, perfiles y resumen.
- `work[]` — experiencia, ya ordenada de más reciente a más antigua.
  `current: true` marca los puestos en activo; `endDate: null` va con ellos.
- `education[]` — `expected: true` indica que `endDate` es la graduación prevista.
- `certificates[]`, `skills[]`, `languages[]`, `projects[]`, `volunteer`.

## Al generar la web

1. **`basics.phone` es `null`.** No está decidido si el teléfono va en la web.
   La plantilla debe omitir el bloque cuando el valor sea `null`, no imprimir "null".
2. **`projects[]` son proyectos técnicos, no webs de portfolio.** Si la web necesita
   casos de clientes de Andes Systems, hay que decidir antes cuáles son públicos.
3. El idioma por defecto es `es`; `en` está completo, así que el selector de idioma
   puede leer la misma estructura sin ramas especiales.
4. Las fechas van como `YYYY` o `YYYY-MM`, sin día. Formatear en la capa de vista.
