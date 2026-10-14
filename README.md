# Vikingos FC Hub

PROMPT MAESTRO — VIKINGOS FC

WEB APP / PWA OFICIAL DEL CLUB

Liga de Veteranos · Escuela Modelo · Mérida, Yucatán

Construye la plataforma digital oficial de VIKINGOS FC, club de fútbol fundado en 2017 que participa en la Liga de Veteranos de la Escuela Modelo en Mérida, Yucatán.

IMPORTANTE:

NO quiero una landing page.

NO quiero una página web genérica.

Quiero una WEB APP / PWA real, funcional, administrable, interactiva y MOBILE-FIRST.

La aplicación tendrá dos personalidades claramente diferenciadas:

1. ÁREA OFICIAL:

Profesional, deportiva, ordenada e institucional.

2. ÁREA SOCIAL:

Divertida, auténtica y propia de la convivencia de VIKINGOS FC.

Debe sentirse como la plataforma digital de un club serio, pero conservar la personalidad real del equipo.

NO copiar diseños, marcas ni elementos de otros clubes profesionales.

==================================================

1. MATERIAL REAL E IDENTIDAD VISUAL

==================================================

Adjunto:

- Logotipo oficial de VIKINGOS FC.

- Fotografía real del equipo.

- Fotografía del uniforme actual.

- Fotografía real de la cancha.

El LOGOTIPO proporcionado es la referencia maestra de identidad.

REGLAS:

- NO modificar el logotipo.

- NO reinterpretarlo.

- NO redibujarlo.

- NO alterar colores, textos, proporciones ni elementos.

- Utilizarlo como logotipo oficial de la aplicación.

- Utilizarlo también como referencia para favicon e identidad PWA cuando técnicamente corresponda.

La paleta de la interfaz debe derivarse principalmente del escudo:

- azul marino

- azul claro

- blanco

- neutros complementarios

El rojo del uniforme actual NO debe convertirse en el color principal de la aplicación.

Utilizar las fotografías reales proporcionadas.

NO utilizar imágenes genéricas de futbolistas.

NO inventar jugadores.

NO sustituir a los jugadores reales mediante IA.

La fotografía del equipo puede utilizarse como elemento protagonista de Inicio.

La fotografía de la cancha puede utilizarse estratégicamente para ambiente deportivo y MATCHDAY.

La fotografía del uniforme debe formar parte de EL CLUB / IDENTIDAD.

ESTILO:

- deportivo premium

- moderno

- limpio

- elegante

- contundente

- fotográfico

- profesional

- excelente jerarquía visual

- animaciones discretas

- tarjetas deportivas modernas

EVITAR:

- diseño infantil

- estética medieval

- exceso de cascos, espadas, fuego o runas

- estética de videojuego

- saturación visual

- elementos genéricos de plantillas deportivas

VIKINGOS debe sentirse como una marca deportiva, no como una temática medieval.

==================================================

2. MOBILE-FIRST + PWA

==================================================

Diseñar primero para teléfono móvil.

Posteriormente adaptar perfectamente a tablet y escritorio.

Crear una PWA instalable.

Priorizar:

- botones grandes y cómodos

- navegación intuitiva

- fotografías grandes

- textos legibles

- rapidez

- cero fricción

- acciones frecuentes accesibles con pocos toques

==================================================

3. ESTRUCTURA PRINCIPAL

==================================================

Crear:

INICIO

LA TRIBUNA VIKINGA

PARTIDOS

PLANTILLA

ESTADÍSTICAS

VIKINGOTECA

EL CLUB

Además:

PANEL MASTER

PANEL ADMINISTRADOR

==================================================

4. ROLES

==================================================

Crear CUATRO niveles:

1. MASTER

2. ADMINISTRADOR

3. VIKINGO

4. VISITANTE

Los permisos deben implementarse realmente mediante autenticación, base de datos y RLS.

NO limitar la seguridad a ocultar botones en la interfaz.

==================================================

5. MASTER

==================================================

MASTER es el propietario digital de la plataforma.

Debe existir inicialmente UN SOLO MASTER.

Crear la cuenta inicial:

USUARIO:

master

CONTRASEÑA INICIAL:

master123

IMPORTANTE DE SEGURIDAD:

La contraseña debe gestionarse mediante el sistema de autenticación seguro.

NO almacenar contraseñas en texto plano en tablas.

NO escribir la contraseña directamente en código frontend.

NO exponer credenciales mediante APIs públicas.

MASTER tendrá control absoluto.

MASTER puede:

- crear Administradores

- editar Administradores

- desactivar Administradores

- restablecer sus contraseñas

- crear jugadores

- editar jugadores

- desactivar jugadores

- vincular jugadores con usuarios

- administrar roles

- administrar partidos

- resultados

- estadísticas

- plantilla

- MVP

- Vikingada

- Vikingoteca

- Tribuna

- Club

- configuración

Ningún ADMINISTRADOR puede:

- eliminar al MASTER

- desactivar al MASTER

- cambiar el rol MASTER

- cambiar la contraseña MASTER

- crear otro MASTER

- convertirse a sí mismo en MASTER

No permitir escalamiento de privilegios.

==================================================

6. CREACIÓN DE ADMINISTRADORES

==================================================

Desde:

PANEL MASTER → USUARIOS → ADMINISTRADORES

MASTER podrá crear uno o varios Administradores.

Formulario:

- Nombre

- Usuario

- Contraseña inicial

- Estado activo/inactivo

REGLA DE USUARIO:

Utilizar el nombre de la persona comenzando con mayúscula.

Ejemplo:

Nombre:

Juancarlos

Usuario:

Juancarlos

REGLA DE CONTRASEÑA INICIAL:

Nombre comenzando con mayúscula + al menos 1 número.

Ejemplo conceptual:

Juancarlos1

El sistema debe validar esta regla al crear un Administrador.

MASTER podrá establecer el número correspondiente.

NO almacenar la contraseña en texto plano.

Una vez creado, el Administrador podrá iniciar sesión con su usuario y contraseña.

==================================================

7. ADMINISTRADOR

==================================================

ADMINISTRADOR será responsable de la operación deportiva.

Puede:

- agregar jugadores

- editar jugadores

- administrar plantilla

- crear partidos

- capturar resultados

- registrar incidencias

- registrar estadísticas

- seleccionar MVP

- registrar La Vikingada de la Jornada

- escribir crónicas

- administrar Vikingoteca

- subir fotografías/videos

- moderar La Tribuna

- administrar contenido del Club

NO puede:

- crear otro MASTER

- modificar MASTER

- eliminar MASTER

- cambiar roles superiores

- otorgarse permisos MASTER

==================================================

8. CREACIÓN DE JUGADORES Y USUARIOS VIKINGOS

==================================================

Tanto MASTER como ADMINISTRADOR pueden agregar jugadores.

Al crear un jugador permitir:

- Nombre

- Apodo opcional

- Dorsal opcional

- Posición

- Fotografía

- Estado activo/inactivo

También permitir crear/vincular su acceso como VIKINGO.

REGLA DE USUARIO:

El usuario será su nombre.

Ejemplo:

Japo

Barbie

Carlos

Resolver duplicados de manera controlada:

si dos jugadores tienen el mismo nombre, solicitar al MASTER/ADMINISTRADOR definir un usuario diferente.

NO modificar silenciosamente el usuario.

CONTRASEÑA INICIAL PARA TODOS LOS VIKINGOS:

Vikingos

IMPORTANTE:

Esta contraseña es una contraseña inicial compartida solicitada por el club.

Debe gestionarse mediante autenticación segura.

NO almacenar "Vikingos" en texto plano en tablas.

NO incluirla en respuestas públicas.

NO exponerla en el frontend después de crear la cuenta.

MASTER debe poder restablecer posteriormente la contraseña de un usuario.

==================================================

9. VISITANTE

==================================================

No necesita iniciar sesión.

Puede consultar:

- Inicio

- próximos partidos

- resultados

- plantilla

- estadísticas

- Vikingoteca pública

- El Club

- publicaciones públicas de La Tribuna

NO puede:

- publicar

- comentar

- reaccionar

- modificar datos

- subir contenido

==================================================

10. INICIO DE SESIÓN

==================================================

Crear acceso sencillo mediante:

USUARIO

CONTRASEÑA

No obligar al usuario final a introducir visualmente un email.

Implementar internamente el mecanismo seguro necesario para integrarlo con Supabase Auth.

La experiencia visible debe ser:

Usuario

Contraseña

Iniciar sesión

Después del login, detectar automáticamente el rol.

MASTER → Panel Master

ADMINISTRADOR → Panel Administrador

VIKINGO → experiencia normal de la app con funciones sociales habilitadas.

==================================================

11. INICIO

==================================================

Crear una portada visualmente potente utilizando contenido real proporcionado.

Mostrar identidad:

VIKINGOS FC

FUNDADO 2017

Liga de Veteranos · Escuela Modelo

Mérida, Yucatán

La portada debe poder mostrar dinámicamente:

- próximo partido

- último resultado

- posición

- MVP reciente

- contenido destacado

- acceso a La Tribuna

NO INVENTAR DATOS.

No crear:

- rival

- resultado

- jornada

- fecha

- hora

- posición

- estadísticas

Si no existe información, utilizar estados vacíos elegantes o no mostrar el bloque.

==================================================

12. PARTIDOS

==================================================

Crear:

PRÓXIMOS PARTIDOS

RESULTADOS

AMBAS SECCIONES DEBEN INICIAR SIN DATOS DEPORTIVOS.

NO crear partidos de demostración.

MASTER y ADMINISTRADOR podrán crear partidos.

Campos:

- temporada

- jornada

- rival

- escudo rival opcional

- local/visitante

- fecha

- hora

- cancha

- previa opcional

- estado

Estados:

- programado

- finalizado

- aplazado

- cancelado

==================================================

13. RESULTADO Y FICHA DEL PARTIDO

==================================================

Cuando finalice un partido, MASTER o ADMINISTRADOR podrá capturar:

- goles Vikingos

- goles rival

- goleadores

- asistencias opcionales

- tarjetas amarillas

- tarjetas rojas

- MVP

- La Vikingada de la Jornada

- crónica

- fotografías

- videos

Cada partido debe tener su propia ficha histórica.

Mostrar únicamente información existente.

Los campos opcionales vacíos NO deben aparecer públicamente.

==================================================

14. MVP DEL PARTIDO

==================================================

Crear:

MVP DEL PARTIDO

MASTER/ADMINISTRADOR selecciona un jugador real de la plantilla.

Permitir:

- jugador

- fotografía

- estadísticas relevantes

- comentario opcional

Dar tratamiento visual destacado y profesional.

==================================================

15. LA VIKINGADA DE LA JORNADA

==================================================

Crear una sección denominada EXACTAMENTE:

LA VIKINGADA DE LA JORNADA

Es una tradición humorística de VIKINGOS FC.

NO significa peor jugador.

Representa una acción, error, expulsión, situación o anécdota particularmente memorable/divertida del partido.

MASTER/ADMINISTRADOR podrá registrar:

- jugador protagonista opcional

- fotografía

- título/apodo opcional

- descripción

- fotografía o video relacionado

NO afectar las estadísticas deportivas oficiales.

NO precargar ejemplos.

Debe tener personalidad y humor, pero mantener la calidad visual de la plataforma.

==================================================

16. PLANTILLA

==================================================

NO CREAR JUGADORES FICTICIOS.

La plantilla comienza vacía.

MASTER o ADMINISTRADOR agregan jugadores.

Ficha:

- fotografía

- nombre

- apodo

- dorsal

- posición

- incorporación opcional

- estado

- descripción opcional

Perfil individual:

- PJ

- goles

- asistencias

- amarillas

- rojas

- MVP

Si el jugador tiene usuario vinculado, permitir mostrar sus publicaciones recientes de La Tribuna.

==================================================

17. ESTADÍSTICAS

==================================================

Crear estadísticas por temporada.

CLUB:

- PJ

- PG

- PE

- PP

- GF

- GC

- DG

- puntos

JUGADORES:

- PJ

- goles

- asistencias

- amarillas

- rojas

- MVP

Rankings:

GOLEADORES

ASISTIDORES

MÁS PARTIDOS

MVP DE LA TEMPORADA

Siempre que sea técnicamente viable, calcular automáticamente desde los datos registrados en los partidos.

Evitar captura duplicada e inconsistencias.

NO inventar estadísticas.

==================================================

18. LA TRIBUNA VIKINGA

==================================================

Crear un feed social sencillo.

VISITANTES:

pueden leer contenido público.

VIKINGOS:

pueden:

- publicar texto

- fotografías

- videos

- comentar

- responder

- reaccionar

- editar su contenido

- eliminar su contenido

Reacciones disponibles:

❤️

😂

🔥

⚔️

👏

Cada publicación:

- autor

- avatar

- fecha/hora

- contenido

- multimedia

- reacciones

- comentarios

MASTER y ADMINISTRADOR pueden moderar cualquier contenido.

NO precargar publicaciones ficticias.

==================================================

19. VIKINGOTECA

==================================================

Crear biblioteca multimedia histórica:

VIKINGOTECA

Organizar por:

- temporada

- partido

- evento

- categoría

Los Vikingos autorizados pueden subir fotografías/videos.

MASTER/ADMINISTRADOR pueden:

- editar

- categorizar

- eliminar

- destacar

- moderar

Crear un visor moderno y mobile-first.

==================================================

20. EL CLUB

==================================================

Crear sección institucional.

Mostrar/preparar:

- logotipo oficial

- VIKINGOS FC

- Fundado 2017

- Liga de Veteranos de la Escuela Modelo

- Mérida, Yucatán

- fotografía oficial

- uniforme actual

- cancha

- historia

- identidad

- futuros patrocinadores

NO INVENTAR la historia.

Los campos no conocidos quedan preparados para captura posterior.

==================================================

21. MATCHDAY

==================================================

Cuando exista un partido real programado para el día actual, permitir que Inicio adopte automáticamente una presentación MATCHDAY.

Mostrar:

MATCHDAY

VIKINGOS FC

VS

RIVAL

fecha

hora

cancha

Agregar cuenta regresiva si existe fecha/hora válida.

NO crear partidos ficticios para mostrar esta función.

==================================================

22. PANEL MASTER

==================================================

Crear un panel privado y mobile-friendly.

Secciones:

RESUMEN

ADMINISTRADORES

JUGADORES / USUARIOS

PARTIDOS

RESULTADOS

PLANTILLA

ESTADÍSTICAS

VIKINGOTECA

TRIBUNA

EL CLUB

CONFIGURACIÓN

MASTER debe poder administrar el sistema sin editar código.

==================================================

23. PANEL ADMINISTRADOR

==================================================

Crear panel operativo:

RESUMEN

JUGADORES

PARTIDOS

RESULTADOS

PLANTILLA

ESTADÍSTICAS

VIKINGOTECA

TRIBUNA

EL CLUB

No mostrar funciones exclusivas MASTER.

==================================================

24. FLUJOS DE ADMINISTRACIÓN

==================================================

Ejemplo:

NUEVO PARTIDO

→ formulario

→ guardar

→ publicar

→ aparece automáticamente en Próximos Partidos

RESULTADO

→ seleccionar partido

→ marcador

→ incidencias

→ goleadores

→ tarjetas

→ MVP

→ Vikingada

→ crónica

→ fotos/videos

→ publicar

Al publicar, actualizar automáticamente:

- Inicio

- Resultados

- ficha del partido

- estadísticas del club

- estadísticas de jugadores

- MVP/rankings correspondientes

Evitar tener que capturar la misma información varias veces.

==================================================

25. BASE DE DATOS

==================================================

Utilizar Supabase.

Diseñar una estructura relacional sólida.

Crear como mínimo lo necesario para:

- profiles

- user_roles

- players

- seasons

- matches

- match_events

- player_match_stats

- posts

- comments

- reactions

- media

- club_settings

Añadir tablas auxiliares cuando sea necesario.

Implementar claves, relaciones, constraints e índices adecuados.

Aplicar RLS.

MASTER:

control total autorizado.

ADMINISTRADOR:

operación deportiva y moderación.

VIKINGO:

contenido social propio y multimedia permitido.

VISITANTE:

lectura exclusivamente de información pública.

==================================================

26. SEGURIDAD

==================================================

Implementar permisos en backend/base de datos.

NO confiar únicamente en validaciones frontend.

Impedir escalamiento de privilegios.

Un Administrador nunca puede convertirse en MASTER por manipulación del cliente.

Un Vikingo nunca puede alterar:

- resultados

- estadísticas

- partidos

- plantilla oficial

- roles

Las contraseñas deben gestionarse mediante autenticación segura.

NO crear una tabla con contraseñas en texto plano.

==================================================

27. MULTIMEDIA

==================================================

Preparar almacenamiento para:

- avatares

- jugadores

- partidos

- Tribuna

- Vikingoteca

- Club

Validar formatos/tamaños.

Mostrar progreso de carga.

Optimizar imágenes cuando corresponda.

Evitar que fotografías o videos excesivamente pesados deterioren la experiencia móvil.

==================================================

28. ESTADOS VACÍOS

==================================================

MUY IMPORTANTE:

La plataforma comienza sin:

- jugadores

- partidos

- resultados

- estadísticas

NO llenar el sistema con datos ficticios.

Utilizar estados vacíos profesionales.

Ejemplos:

"Aún no hay partidos programados."

"Plantilla pendiente de registrar."

"Las estadísticas aparecerán después de registrar partidos."

"La Vikingoteca está lista para recibir sus primeras fotografías."

==================================================

29. PRINCIPIO DE DISEÑO

==================================================

La plataforma debe transmitir:

INSTITUCIÓN

COMPETENCIA

HISTORIA

COMUNIDAD

HUMOR

Separar claramente:

INFORMACIÓN OFICIAL

→ profesional.

TRIBUNA / VIKINGADA

→ divertida.

No convertir toda la plataforma en una broma.

==================================================

30. REGLA ABSOLUTA: NO INVENTAR

==================================================

NO crear información deportiva de demostración.

NO inventar:

- jugadores

- rivales

- resultados

- fechas

- jornadas

- estadísticas

- publicaciones

- patrocinadores

- crónicas

- historia

Construir la infraestructura y esperar la captura de información real.

==================================================

31. RESULTADO FINAL DE ESTA V1

==================================================

La aplicación debe quedar FUNCIONAL, no solamente diseñada.

Flujo inicial esperado:

1. MASTER inicia sesión con:

   usuario: master

   contraseña inicial: master123

2. MASTER entra al Panel Master.

3. MASTER puede crear uno o varios Administradores.

4. MASTER o ADMINISTRADOR agrega jugadores reales.

5. Los jugadores reciben usuario basado en su nombre y contraseña inicial Vikingos.

6. MASTER/ADMINISTRADOR programa partidos.

7. Después del partido captura el resultado una sola vez.

8. Registra goleadores, incidencias y tarjetas.

9. Selecciona MVP.

10. Registra LA VIKINGADA DE LA JORNADA.

11. Escribe la crónica.

12. Sube fotografías/videos.

13. Al publicar, toda la información correspondiente se refleja automáticamente en la web pública y estadísticas.

14. Los Vikingos autenticados pueden participar en La Tribuna.

15. El público puede consultar la información deportiva sin iniciar sesión.

Antes de finalizar la implementación:

- comprobar autenticación por usuario/contraseña

- comprobar los cuatro roles

- comprobar RLS

- comprobar que ADMIN no puede acceder a funciones MASTER

- comprobar que VIKINGO no puede alterar información oficial

- comprobar creación de jugadores

- comprobar creación/publicación de partidos

- comprobar actualización de estadísticas

- comprobar Tribuna

- comprobar multimedia

- comprobar funcionamiento mobile

- comprobar PWA

- comprobar estados vacíos

- comprobar que NO existen datos deportivos ficticios

Prioridad absoluta:

FACILIDAD DE USO + MOBILE-FIRST + SEGURIDAD + IDENTIDAD REAL DE VIKINGOS FC.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://solovikingosfc.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a0d04817-e5ca-4168-9b66-91870e09ec4b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
