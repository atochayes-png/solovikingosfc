# Ajuste multimedia flexible para Vikingos FC

## Objetivo
Conservar cada archivo original sin alterarlo y controlar únicamente su presentación mediante tres modos: Automático, Vertical 4:5 y Horizontal 16:9. El ajuste se limitará al sistema multimedia existente.

## Cambios de datos
- Agregar preferencias de presentación con valor predeterminado `auto` y validación para `auto`, `vertical` y `horizontal` en:
  - multimedia de Vikingoteca;
  - publicaciones de La Tribuna;
  - fotografía de jugador;
  - contenido de La Vikingada.
- Mantener compatibles todos los registros actuales mediante valores predeterminados, sin modificar archivos ya almacenados.
- Incorporar una relación aditiva para adjuntos de publicaciones, permitiendo varias fotos o videos por publicación sin retirar el campo multimedia actual. Las publicaciones existentes seguirán usando su archivo actual como respaldo.
- Mantener permisos actuales: lectura pública y escritura limitada al autor o al personal autorizado.

## Presentación común
- Rehacer el visor multimedia compartido para:
  - detectar las dimensiones reales en modo Automático;
  - respetar la proporción original de fotos cuadradas, verticales u horizontales;
  - usar marcos 4:5 o 16:9 con `contain` en los modos elegidos;
  - mantener videos verticales y horizontales sin deformación;
  - limitar el ancho de contenido vertical en escritorio y aprovechar el ancho disponible en celular;
  - mostrar carga y fallback sin saltos bruscos.
- Conservar el componente de imagen compacta para avatares y escudos, donde el recorte controlado sí corresponde.

## Formularios y vista previa
- Añadir el selector “Formato de visualización” con Automático, Vertical 4:5 y Horizontal 16:9 en las cargas de:
  - La Tribuna;
  - Vikingoteca;
  - jugadores;
  - La Vikingada.
- Mostrar “El archivo original se conservará sin recortes.” y la recomendación Vertical 4:5 en jugadores y La Vikingada.
- Mostrar una vista previa real que cambie inmediatamente al cambiar el modo.
- En La Tribuna, permitir seleccionar varias fotos o videos desde el celular y conservar el orden elegido.

## Pantallas ajustadas
- Usar el mismo comportamiento en Inicio, Tribuna, Vikingoteca, detalle de partido, MVP, Vikingada, Plantilla y ficha de jugador.
- Sustituir alturas fijas y `cover` indiscriminado en contenido editorial por proporciones responsivas y contenido completo.
- Mantener las cuadrículas compactas como galerías responsivas sin deformar archivos.

## Visor y galerías
- Crear un visor común al tocar una foto o video.
- Mostrar el archivo completo y permitir cerrar fácilmente.
- Añadir navegación anterior/siguiente cuando una publicación o galería tenga varios archivos.
- Aplicarlo a publicaciones, Vikingoteca, destacados y galerías de partido.

## Validación
- Aplicar el cambio de datos y comprobar que los registros existentes reciben `auto`.
- Probar archivos 4:5, 16:9, cuadrados y fotos verticales/horizontales de celular.
- Probar publicación con orientaciones mixtas, MVP, Vikingada y videos.
- Comparar vista previa y publicación final.
- Revisar celular y escritorio, navegación del visor, ausencia de deformación/recorte y conservación del archivo original.
- Confirmar que compilación, consola y funciones existentes continúan sin errores.
