# Veo Watermark Remover - Chrome Extension

## Descripción General
Este directorio contiene el código fuente para la implementación de Veo Watermark Remover como extensión para el navegador Google Chrome. El propósito de este módulo es proporcionar una integración en el navegador para la eliminación automatizada de marcas de agua en videos generados mediante plataformas soportadas (como Google Veo y afines).

## Arquitectura y Componentes
La extensión se estructura mediante los siguientes componentes principales:

- `manifest.json`: Archivo de configuración que define los metadatos, permisos y recursos fundamentales requeridos por el navegador Chrome.
- **Service Workers / Background Scripts** (`background.js`, `background_wrapper.js`): Gestionan los eventos del ciclo de vida de la extensión, interceptan solicitudes y coordinan la comunicación entre los distintos contextos de ejecución.
- **Content Scripts** (`content.js`, `inject.js`): Inyectados en el contexto de las páginas web objetivo para interactuar con el Modelo de Objetos del Documento (DOM), detectar flujos de video soportados e iniciar el proceso de extracción.
- **Procesamiento de Video** (`processor.js`, `ffmpeg-core.js`, `ffmpeg-core.wasm`, `814.ffmpeg.js`, `ffmpeg.min.js`): Núcleo de la herramienta encargado de aplicar el algoritmo de un-compositing mediante lectura de alpha-maps y procesamiento local vía WebAssembly. Operan del lado del cliente sin dependencia de servidores externos.
- **Interfaz de Usuario** (`popup.html`/`.js`, `options.html`/`.js`, `dashboard.html`/`.js`, `processor.html`): Vistas y controladores que proporcionan la operabilidad de usuario y las configuraciones de la herramienta.
- **Internacionalización** (`i18n.js`): Módulo de manejo de idiomas para la coherencia en la interfaz.

## Funcionalidad
La extensión detecta automáticamente videos generados e inserta la lógica de reconstrucción de cuadros (frames). Mediante la utilización de técnicas de interpolación y un-compositing matemático, neutraliza los píxeles afectados por las marcas de agua sin aplicar degradaciones severas a la calidad general del metraje. Posteriormente, recompila el flujo multimedia y proporciona el archivo resultante al usuario de manera local.

## Requisitos y Configuración
El entorno de ejecución requiere un navegador compatible con Chromium (Google Chrome, Edge, Brave, etc). Para su instalación en crudo (modo desarrollador):
1. Navegue hacia la vista de gestión de extensiones: `chrome://extensions/`.
2. Habilite el selector de "Modo de desarrollador".
3. Ejecute la acción "Cargar desempaquetada" y seleccione la ruta hacia este directorio particular (`/chrome`).

## Consideraciones de Diseño y Legalidad
Todo procesamiento se circunscribe a la máquina del usuario. Consulte el archivo de licencia MIT ubicado en el directorio raíz del repositorio para los términos de uso, modificación y distribución aplicables a este software.
