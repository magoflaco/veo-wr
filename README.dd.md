# [Veo Watermark Remover](https://veowr.pages.dev/) 🎬

**Website:** [https://veowr.pages.dev/](https://veowr.pages.dev/)

Bienvenido al repositorio de **Veo Watermark Remover**, una herramienta técnica híbrida (Web + Extensión) diseñada para eliminar de forma las marcas de agua de videos generados por Veo en plataformas de Google AI (Gemini, Labs, etc.).


---

## 🔬 Funcionamiento Técnico

El proyecto fue desarrollado tras una amplia etapa experimental, donde se extrajeron las marcas de agua directamente de los videos generados, en distintas resoluciones y formatos, y se perfeccionó el algoritmo matemático para retirarlas sin dañar el fondo.

El motor principal opera bajo la lógica de **Un-compositing con Alpha-maps** seguido de un **Micro-blur Direccional y Proporcional**.

### 1. Extracción y Detección de Logos (`LOGO_DATA`)
La marca de agua de Veo cambia de tamaño y de posición exacta basándose en la resolución total del video (720p vs 1080p) y en la orientación (horizontal vs vertical). En los scripts de análisis de color, logramos aislar el parche exacto con los pixeles de la marca.

El sistema en la versión web y en `processor.js` (parcialmente, 1080p no está implementado) detecta de forma automática la variante correspondiente al momento de cargar el video en memoria:

| Variant | Logo Size | Position | Max Alpha |
|---------|-----------|----------|-----------|
| Horizontal 720p | 130×70 | (1150, 650) | 0.529 |
| Horizontal 1080p | 220×110 | (1700, 970) | 0.675 |
| Vertical 720p | 130×80 | (590, 1200) | 0.533 |
| Vertical 1080p | 200×120 | (880, 1800) | 0.741 |
| Gemini WebApp | 130×70 | (1150, 650) | 0.529 |

- La marca de agua es **perfectamente gris** (R=G=B) en todas las variantes
- La opacidad de la marca de agua es **constante** en los 192 fotogramas (sin fundido de entrada)
- Los logotipos H y V difieren ligeramente → logotipos separados por orientación


### 2. Mapa Alpha (`calculateAlphaMap`)
La marca original es blanca ("255, 255, 255") inyectada en el video con cierta opacidad (Alpha).
Al cargar el pre-renderizado correspondiente en un canvas virtual, el script evalúa dinámicamente el nivel de transparencia (Alpha) de cada píxel de logo usando el valor máximo del color `RGB`.
```javascript
  const maxVal = Math.max(r, g, b);
  alpha[i] = maxVal / 255.0;
  if (alpha[i] < 0.008) alpha[i] = 0; // Padding
```

### 3. Alpha-map Un-compositing
Con el parche de transparencia exacto, para cada píxel afectado (donde `alpha > 0.005`), sabemos que:
`Color Visualizado = (Color Original * (1 - Alpha)) + (Color del Logo [255] * Alpha)`

Despejando matemáticamente para recuperar el **`Color Original`** que está "debajo" del logo:
```javascript
  const original = (displayed - clampedA * LOGO_VALUE) / (1 - clampedA);
```
Con este solo paso, el 90% del logo desaparece, sin embargo, genera artefactos o "fantasmas" debidos a la compresión H.264 o VP9 original que alteró sutilmente los pixeles intermedios.

### 4. Micro-blur Proporcional (`postProcessBlur`)
Para arreglar los pixeles distorsionados por la compresión y la división matemática, se aplica un **Filtro Gaussiano Inteligente** en tiempo real *únicamente* sobre el área de la caja del logo. 
La magia del script es que mezcla los pixeles basándose en su nivel de daño (Alpha):
- Los pixeles *afectados gravemente* aportan muy poca de su propia información al desenfoque y toman mucha de sus vecinos.
- Los vecinos limpios (donde el alpha original era 0) inyectan sus colores limpios para "curar" los huecos sin emborronar todo el video.

### 5. Compresión Local via WebAssembly (`FFmpeg.wasm`)
El pipeline intercepta la descarga y redirige el flujo (o convierte directamente en la Web) sin enviar los videos a ningún servidor:
1. Extrae los frames del video renderizándolos cuadro por cuadro en JPEG.
2. Escribe los cuadros corregidos en la memoria ram local.
3. Llama a `FFmpeg.min.js` e inicializa el `ffmpeg-core.wasm` (descargado y en cache local) para compilar inmediatamente los cuadros a formatos como `MP4`, `WebM`, o `MOV` a 30 FPS.
4. Genera el Blob y fuerza la descarga del nombre con el prefijo adaptativo (`no_watermark_` o `sin_marca_`).

---

## Estructura del Repositorio

- `/firefox/`: Módulo primario de la Extensión de Firefox.
- `/web/`: Landing page y Web-App standalone que implementa el mismo algoritmo en formato cliente local, con integración de monetización Ads.

---

## Licencia 
Este proyecto se rige por la licencia abierta **MIT**. Ver [LICENSE](./LICENSE) para más detalles.

**Créditos y Autor:** Desarrollado por [@magoflaco](https://github.com/magoflaco).  
Contacto vía WhatsApp: [+593983941273](https://wa.me/593983941273)
