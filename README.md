# Veo Watermark Remover

**Website:** [https://veowr.pages.dev/](https://veowr.pages.dev/)

## Descripción General

**Veo Watermark Remover** es una herramienta técnica híbrida (compuesta por módulos Web y extensiones de navegador) cuya finalidad es la supresión de las marcas de agua incrustadas en secuencias de video generadas por Veo 3. 

---

## Descargo de Responsabilidad (Disclaimer)

**Este proyecto ha sido desarrollado con fines estricta y exclusivamente educativos, así como para la investigación en procesamiento digital de señales de video.**

El código fuente provee un caso de estudio sobre técnicas de procesamiento digital de imágenes en cliente mediante el uso de algoritmos de *un-compositing* usando mapas alfa y transcodificación basada en WebAssembly. 

El autor y los contribuidores de este repositorio **no se hacen responsables** por el uso que los usuarios finales puedan darle a esta herramienta, las posibles infracciones a los términos de servicio de plataformas de terceros, ni de las repercusiones o consecuencias legales derivadas de la remoción deliberada de marcas de agua o alteraciones al material intelectual. Es absoluta responsabilidad del usuario asegurar que su interacción con esta herramienta se alinee y respete las normativas de derechos de autor y propiedad intelectual vigentes en su jurisdicción.

---

## Funcionamiento Técnico

El paradigma operativo del proyecto radica en un análisis precomputado de la incrustación digital, empleando la lógica de **Un-compositing con Alpha-maps**, seguido de un algoritmo de **Micro-blur Direccional y Proporcional**. El proceso transcurre íntegramente del lado del cliente, garantizando la privacidad de los datos al no enviar la información a servidores externos.

### 1. Extracción y Detección de Parámetros (`LOGO_DATA`)

Las marcas de agua generadas por el modelo de IA varían en dependencia directa de la resolución de exportación (720p frente a 1080p) y la orientación de la secuencia (horizontal frente a vertical). El sistema reconoce e intercepta las siguientes variaciones para determinar el mapa óptimo de procesamiento:

| Variante | Dimensiones | Posición Relativa | Nivel Alfa Máximo |
|----------|-------------|-------------------|-------------------|
| Horizontal 720p | 130×70 | (1150, 650) | 0.529 |
| Horizontal 1080p | 220×110 | (1700, 970) | 0.675 |
| Vertical 720p | 130×80 | (590, 1200) | 0.533 |
| Vertical 1080p | 200×120 | (880, 1800) | 0.741 |
| Gemini WebApp | 130×70 | (1150, 650) | 0.529 |

### 2. Generación del Mapa Alfa (`calculateAlphaMap`)

A partir de la premisa de inyección pura (color blanco), el algoritmo evalúa dinámicamente la matriz de transparencia (Alfa) subyacente de cada píxel en el lienzo. El valor alfa se obtiene mediante una lectura de la magnitud relativa de canal.
```javascript
  const maxVal = Math.max(r, g, b);
  alpha[i] = maxVal / 255.0;
  if (alpha[i] < 0.008) alpha[i] = 0; // Margen algorítmico de seguridad temporal
```

### 3. Reversión de Composición (Un-compositing)

Una vez delineada la matriz de transparencia por fotograma, se procede a aislar los espacios corrompidos aplicando una interpolación inversa al canal del espectro original:

`Color Visible = (Color Subyacente * (1 - Alfa)) + (Píxel Blanco * Alfa)`

Despejando analíticamente para reconstruir la tonalidad originaria mitigada por el logo (`Color Subyacente`):
```javascript
  const original = (displayed - clampedA * LOGO_VALUE) / (1 - clampedA);
```
Esta inferencia neutraliza un alto porcentaje de la incrustación; no obstante, debe ser depurada debido a las deficiencias residuales originadas por compresión H.264.

### 4. Interpolación por Micro-desenfoque Proporcional (`postProcessBlur`)

Para mitigar los artefactos persistentes resultantes de la primera reconstrucción, se administra localmente un **Filtro Gaussiano Adaptativo**. Su nivel de aplicación en el *canvas* se ajusta de acuerdo con el daño de refracción del píxel en cuestión; de modo que los píxeles sanos colindantes colaboran activamente aportando canales limpios, recomponiendo el fragmento visual dañado y limitando el efecto de emborronamiento integral que resultaría perjudicial.

### 5. Transcodificación Local mediante WebAssembly (`FFmpeg.wasm`)

El acoplamiento final se orquesta a gran velocidad por medio del ecosistema WebAssembly a nivel local:
1. Intercepción del flujo originario y conversión visual hacia memorias intermedias por fotograma.
2. Inyección de las retículas calculadas pos-procesadas.
3. Desencadenamiento del entorno local `ffmpeg-core.wasm`.
4. Encodificación binaria de salida en resoluciones compatibles (e.g. `MP4` o `WebM`) conservando las cadencias requeridas (alrededor de 30 FPS constantes en modo auto).
5. Despacho directo del contenido como objeto binario estático que desencadena la descarga local gestionada por el visor del navegador.

---

## Estructura del Repositorio

La arquitectura del proyecto se segrega en tres ramificaciones directas de uso, abarcando diferentes plataformas objetivos:

- [/chrome/](./chrome): Compilación integral en la forma de Extensión Manifest V3 para el entorno visual Chromium.
- [/firefox/](./firefox/): Arquitectura adaptada para la plataforma Add-on de Mozilla.
- [/web/](./web/): Infraestructura empaquetada e independiente; constituye una [Web-App](https://veowr.pages.dev/) monolítica capacitada para funcionar *backendless* (en formato cliente local) desde cualquier solución Serveless o Edge Network.

---

## Licencia

Este proyecto opera bajo los términos permisivos estipulados por la licencia **MIT**. Consulte el archivo [LICENSE](./LICENSE) para obtener detalles relativos a los límites de responsabilidad, condiciones de compartición y demás directivas legales intrínsecas del código abierto.

**Créditos y Autor:**  
Desarrollado por [@magoflaco](https://github.com/magoflaco).  
Contacto vía WhatsApp: [+593983941273](https://wa.me/593983941273)
