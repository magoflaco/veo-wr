# Veo Watermark Remover - Web Application

## Descripción General
Este segmento del proyecto contiene la implementación autónoma de Veo Watermark Remover orientada a ser expuesta como aplicación web interactiva (Web-App). Desarrollada como plataforma completamente independiente en el navegador, facilita el procesamiento y supresión de marcas de agua sobre videos proveídos directamente del almacenamiento del usuario, haciendo innecesaria cualquier instalación de complementos de terceros.

## Arquitectura y Dependencias
El flujo lógico de la aplicación acaece en su totalidad en el plano del cliente (Client-Side). La arquitectura reposa sobre:

- `index.html`: Base del DOM y punto de inicialización del programa, gestionando la experiencia de carga, visualización y descarga de archivos de video.
- **Contenedores de Compilación e Interfaz FFmpeg** (`814.ffmpeg.js`, `ffmpeg.min.js`): Puentes lógicos diseñados para instruir al entorno WebAssembly la labor intensiva de decodificar y transcodificar el flujo multimedia dentro de las limitantes de resguardo del navegador.
- **Módulos Utilitarios** (`util.min.js`): Colección modular de métodos encargados del mantenimiento de estructuras de datos persistentes y variables de entorno provisorias a nivel computacional.
- **Service Worker Secundario** (`firebase-messaging-sw.js`): Elemento precautorio destinado a la manipulación en segundo plano.
- Componentes gráficos de la interfaz (e.g. `icon-96.png`).

## Principio de Ejecución
A pesar de la portabilidad a formato web, la aplicación se mantiene con rigidez a los principios matemáticos implementados en los módulos troncales del proyecto.
El flujo se resume en las siguientes fases críticas:
1. **Decodificación Temporal**: Lectura progresiva del mapa de fotogramas del medio subido.
2. **Reversión Un-compositing**: Emplea máscaras matemáticas (alpha maps preestablecidos) adaptativas sobre posiciones precalculadas y matrices de resolución predeterminada (principalmente 720p/1080p variantes horizontal y vertical).
3. **Correlación Diferencial Secundaría**: Aplica filtros correctivos de convolución (Gaussian Matrix) para asegurar que el área expuesta subyace sin ruido aparente a la compresión H.264 o VP9 preexistente en el pixel original.
4. **Acoplamiento WebM/MP4**: Ensamblado sin transmisión sobre la red para salvaguardar el video modificado al sistema de archivos del operador.

## Publicación y Entorno de Producción
El directorio está compuesto como un entorno de Sitio Estático. Carece de llamadas al servidor (backendless). Para su funcionamiento universal, este subdirectorio es compatible con métodos de publicación directa con repositorios de páginas estáticas estipuladas, como plataformas Vercel, Netlify o Cloudflare Pages.

## Conformidad Legal Subyacente
Esta vertiente, al igual que los complementos, se emite bajo los términos permisivos establecidos en la licencia global MIT detallada en instancias de mayor nivel en este repositorio.
