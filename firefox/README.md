# Veo Watermark Remover - Firefox Extension

## Descripción General
Este directorio alberga el código fuente específico para el empaquetado y funcionamiento de Veo Watermark Remover como un complemento para el navegador Mozilla Firefox. Su objetivo principal es la supresión de las marcas de agua incorporadas en videos generados por modelos como Google Veo, proveyendo un entorno íntegramente aislado y seguro dentro de las capacidades de Firefox.

## Arquitectura y Componentes
Este módulo ha sido optimizado para cumplir rigurosamente con las directrices de complementos de Mozilla (Add-ons). Sus archivos primordiales comprenden:

- `manifest.json`: Declaración de configuración adaptada al motor Gecko/Quantum de Firefox, delimitando las políticas de permisos y asegurando el apego al modelo de extensión libre de telemtría innecesaria.
- **Background Scripts** (`background.js`): Controlador principal de eventos en segundo plano que garantiza la sincronización del procesamiento sin interferir en el hilo principal de la interfaz de usuario de Firefox.
- **Content Scripts** (`content.js`): Interfaz lógica inyectada superficialmente en las páginas provistas para identificar nodos multimedia.
- **Motor de Reconstrucción Matemática** (`processor.js`, dependencias WebAssembly de FFmpeg): Subsistema responsable de implementar la lógica fundamental de remoción mediante la interpolación de mapas alfa (alpha-maps) unificada a un desenfoque direccional (Gaussian blur). Ejecuta el re-empaquetado del flujo audiovisual íntegramente de manera local.
- **Componentes de Interfaz** (`popup.html`/`.js`, `options.html`/`.js`, `dashboard.html`/`.js`, `processor.html`): Segmentos normalizados para la gestión de preferencias por parte del destinatario del software.
- **Adaptabilidad Lingüística** (`i18n.js`): Gestiona recursos de múltiples idiomas.

## Principio de Procesamiento Local
El complemento provee un cálculo sistemático para el reordenamiento de espacios de color píxel por píxel. Acorde a principios de estandarización en privacidad, esto no se delega en servicios ajenos; el flujo completo de transcodificación, recomposición selectiva y regeneración en formatos universales (H.264 o VP9) se aloja puramente en la memoria local (RAM) del equipo utilizado.

## Despliegue de Desarrollo
Para testear y cargar esta extensión de forma provisoria sobre la instancia de Firefox:
1. Acceda al módulo principal de inspección ingresando `about:debugging#/runtime/this-firefox` en la barra de navegación.
2. Presione la opción designada como "Cargar complemento temporal...".
3. Localice este directorio raíz y seleccione el documento `manifest.json`.

## Privacidad y Distribución
El producto no recolecta historial de navegación ni realiza escaneo masivo sobre el comportamiento del usuario. Todo accionar derivado de la instalación está dictaminado en los términos descritos por la Licencia MIT global del proyecto en la raíz del repositorio.
