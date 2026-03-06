<img align="left" height=64 src="icons/icon.png"/><h1><a href="https://github.com/matias-saavedra-g/ucursednt">U-Cursedn't</a></h1>

Extensión de Chromium que agrega funciones adicionales a la plataforma de [U-Cursos](https://www.u-cursos.cl/) y respectivos logros por hacer cada una de ellas. Desarrollado por [matias-saavedra-g](https://github.com/matias-saavedra-g/), basado en la idea de [Eric K](https://github.com/Nyveon), [PuntitOWO](https://github.com/PuntitOwO), [sebcp](https://github.com/sebcp), [vmkovacs](https://github.com/vmkovacs), y [TaconeoMental](https://github.com/TaconeoMental): [tU-Cursos](https://github.com/Nyveon/tU-Cursos).

<a href="https://chromewebstore.google.com/detail/u-cursednt/jappfnpemaaconilafnlhdkndccfkgen"><img src="https://developer.chrome.com/static/docs/webstore/branding/image/YT2Grfi9vEBa2wAPzhWa.png"/></a>

---

# Índice - [Funcionalidades](#funcionalidades)
- [Índice - Funcionalidades](#índice---funcionalidades)
- [Funcionalidades](#funcionalidades)
  - [🤖 Chat IA Flotante con Gemini](#-chat-ia-flotante-con-gemini)
  - [🪟 Panel Lateral de IA (Side Panel)](#-panel-lateral-de-ia-side-panel)
  - [📋 Utilidades de Copia Fácil](#-utilidades-de-copia-fácil)
      - [Copia Fácil de Notas](#copia-fácil-de-notas)
      - [Copia Fácil de Miembros](#copia-fácil-de-miembros)
      - [Copia Fácil de Datos del Curso](#copia-fácil-de-datos-del-curso)
  - [✨ Mejoras de Interfaz y Experiencia de Usuario](#-mejoras-de-interfaz-y-experiencia-de-usuario)
      - [🖌 Renombrar Cursos](#-renombrar-cursos)
      - [💥 Secciones Colapsables](#-secciones-colapsables)
      - [💬 Interacción con Foros](#-interacción-con-foros)
      - [📖 Recortar Texto Largo ("Mucho Texto")](#-recortar-texto-largo-mucho-texto)
      - [📐 Redimensionar Vista Previa de PDF](#-redimensionar-vista-previa-de-pdf)
      - [🔊 Sonido de Entrega de Tareas](#-sonido-de-entrega-de-tareas)
      - [✨ Animaciones de Navegación](#-animaciones-de-navegación)
  - [🔔 Notificaciones y Atajos](#-notificaciones-y-atajos)
      - [Notificación de Tareas y Pendientes](#notificación-de-tareas-y-pendientes)
      - [📆 Contador de Semanas](#-contador-de-semanas)
      - [🔘 Otras Realizaciones del Curso](#-otras-realizaciones-del-curso)
      - [✔ Ventana Emergente de Calificaciones](#-ventana-emergente-de-calificaciones)
  - [🏆 Sistema de Logros](#-sistema-de-logros)
  - [⚙️ Menú de Configuración](#️-menú-de-configuración)
- [Instalación Local](#instalación-local)
  - [Chrome](#chrome)
  - [Opera](#opera)
  - [Microsoft Edge](#microsoft-edge)

---

# Funcionalidades

## 🤖 Chat IA Flotante con Gemini
<img src="images/ucursitos.png" width="200"/>

> Archivo: `aiChatPopup.js`

- **Asistente Virtual:** Un popup flotante con la mascota "UCursitos" te da acceso directo a la IA de Gemini.
- **Conversaciones Multi-turn:** Soporte para historial de conversación completo enviado al modelo en cada consulta, para respuestas más contextuales.
- **Historial de Chat:** Guarda tus conversaciones y permite exportarlas.
- **Personalización:** Configura tu propia API Key de Google AI Studio y personaliza las instrucciones del sistema para adaptar el comportamiento del asistente a tus necesidades.
- **Integración con Foros:** Envía hilos o posts completos del foro directamente al chat para obtener resúmenes, explicaciones o ayuda.
- **Modelo actualizado:** Ahora conecta con Gemini Flash Lite Latest.

---

## 🪟 Panel Lateral de IA (Side Panel)

> Archivos: `sidepanel.html`, `sidepanel.js`, `sidepanel.css`

- **Chat IA en el Panel Lateral:** Abre un panel lateral nativo de Chrome con el asistente UCursedn't AI directamente integrado en el navegador, sin interrumpir tu navegación.
- **Arquitectura Amnesia-Proof MV3:** El estado del chat se persiste en `chrome.storage` para sobrevivir reinicios del service worker.
- **Historial persistente:** Guarda y accede a múltiples conversaciones anteriores desde el panel.
- **Soporte Gemini Nano (Local):** Detección automática de Gemini Nano para procesamiento local si está disponible.
- **Acceso rápido:** Abre el panel lateral directamente desde el popup de la extensión.

---

## 📋 Utilidades de Copia Fácil

#### Copia Fácil de Notas
<img src="images/easyCopyGrades.png"/>

> Archivo: `easyCopyGrades.js`

- Copia rápidamente tus notas en formato horizontal (para hojas de cálculo), vertical o como una suma (para calculadoras como Wolfram Alpha).

#### Copia Fácil de Miembros
<img src="images/easyCopyMembers.png"/>

> Archivo: `easyCopyMembers.js`

- Agrega botones para copiar la lista de integrantes de un curso en formato horizontal o vertical, ideal para crear listas o informes.

#### Copia Fácil de Datos del Curso
<img src="images/easyCopyCourseDetails.png"/>

> Archivo: `easyCopyCourseDetails.js`

- Añade un botón de copiado rápido junto al nombre y código del curso para pegarlos fácilmente donde necesites.

---

## ✨ Mejoras de Interfaz y Experiencia de Usuario

#### 🖌 Renombrar Cursos
<img src="images/renameCourses.png"/>

> Archivo: `renameCourses.js`

- ¿Nombres de cursos muy largos o poco descriptivos? Ahora puedes renombrarlos para una mejor organización. La extensión recordará tus nombres personalizados.

#### 💥 Secciones Colapsables
<img src="images/collapsableMenus.png"/>

> Archivo: `collapsableMenus.js`

- Organiza tu página de inicio colapsando las secciones que no necesitas ver. La extensión guarda el estado (abierto/cerrado) de cada sección.
- **Efecto Dock de macOS:** Los elementos dentro de cada sección exhiben un efecto de magnificación al estilo del Dock de macOS al pasar el cursor.

#### 💬 Interacción con Foros
<img src="images/forumInteraction.png"/>

> Archivo: `forumInteraction.js`

- **Copia y envía al Chat IA:** Copia el contenido de un post o de un hilo completo, o envíalo directamente al Chat IA para un análisis rápido. Los botones se integran de forma nativa en las opciones del foro.

#### 📖 Recortar Texto Largo ("Mucho Texto")
<img src="images/muchoTexto.png"/>

> Archivo: `muchoTexto.js`

- Oculta automáticamente los posts de foros que son muy largos detrás de un botón "Mucho Texto", manteniendo la interfaz más limpia y legible.

#### 📐 Redimensionar Vista Previa de PDF
<img src="images/resizePreviewPDF.png"/>

> Archivo: `resizePreviewPDF.js`

- Permite ajustar verticalmente el tamaño del visor de PDF, ideal para aprovechar mejor el espacio en pantallas verticales.

#### 🔊 Sonido de Entrega de Tareas
> Archivo: `taskSubmissionSound.js`

- Recibe una gratificante confirmación sonora cada vez que interactúas con la sección de tareas.
- Ahora activo en todas las páginas de tareas (no solo en el detalle de entrega).
- El audio se reproduce mediante un iframe de YouTube embebido.

#### ✨ Animaciones de Navegación
<img src="images/navigationAnimations.gif"/>

> Archivo: `navigationAnimations.js`

- Añade un efecto de magnificación al estilo del Dock de macOS al menú de navegación principal: los ítems se escalan suavemente al pasar el cursor, dando una experiencia más fluida y moderna.

---

## 🔔 Notificaciones y Atajos

#### Notificación de Tareas y Pendientes
<img src="images/pendingTasks.png"/> <img src="images/pendingNotifications.png"/>

> Archivos: `pendingTasks.js`, `pendingNotifications.js`

- Muestra insignias con el número de tareas pendientes y notificaciones no leídas directamente en el menú de navegación y en las secciones de la página principal.

#### 📆 Contador de Semanas
<img src="images/weekCounter.png"/>

> Archivo: `weekCounter.js`

- Muestra el número de la semana actual del semestre junto a la fecha en tu horario. Funciona tanto en español como en inglés.

#### 🔘 Otras Realizaciones del Curso
<img src="images/otrasRealizaciones.png"/>

> Archivo: `otrasRealizaciones.js`

- Agrega un atajo en el menú de cada curso para acceder rápidamente a la página de "Otras Realizaciones".

#### ✔ Ventana Emergente de Calificaciones
> Archivo: `popupGrading.js`

- Abre el historial de calificaciones en una ventana emergente en lugar de redirigirte a otra página.

---

## 🏆 Sistema de Logros
<img src="images/achievementsGen.png"/>

> Archivos: `achievementsGen.js`, `achievementsBoton.js`

- **Gamificación:** Desbloquea logros al utilizar las diferentes funcionalidades de la extensión.
- **Página de Logros:** Accede a una página dedicada desde el menú principal para ver tu progreso, el total de logros y los que te faltan por descubrir.

---

## ⚙️ Menú de Configuración
<img src="images/menuGen.png"/>

> Archivos: `menuGen.js`, `menuBoton.js`

- **Control Total:** Activa o desactiva cualquier funcionalidad de la extensión a través de un menú de configuración dedicado y fácil de usar.
- **Gestión de Datos:** Visualiza y gestiona los datos que la extensión guarda en tu navegador.

---

# Instalación Local

## Chrome

> Tutorial en [video](https://www.youtube.com/watch?v=oswjtLwCUqg) (24s).

1. Clonar el repositorio desde GitHub:
```

git clone [https://github.com/matias-saavedra-g/ucursednt.git](https://github.com/matias-saavedra-g/ucursednt.git)

```

2. Abrir Chrome y navegar a `chrome://extensions/`.

3. Habilitar el modo desarrollador (Developer Mode) en la esquina superior derecha de la página.

4. Click en "Load unpacked" (Cargar extensión sin empaquetar), luego seleccionar la carpeta clonada de la extensión (ucursednt).

5. La extensión debería cargarse y aparecer en la lista de extensiones instaladas.

## Opera

> Tutorial en [video](https://www.youtube.com/watch?v=5X9wGp3kWwA) (86s).

1. Clonar el repositorio desde GitHub:
```

git clone [https://github.com/matias-saavedra-g/ucursednt.git](https://github.com/matias-saavedra-g/ucursednt.git)

```

2. Abrir Opera y visitar `opera://extensions/`.

3. Habilitar el modo desarrollador (Developer Mode) en la esquina superior derecha de la página.

4. Click en "Load unpacked" (Cargar extensión sin empaquetar), luego seleccionar la carpeta clonada de la extensión (ucursednt).

5. La extensión debería cargarse y aparecer en la lista de extensiones instaladas.

## Microsoft Edge

> Tutorial en [video](https://www.youtube.com/watch?v=ruMPPADElqU) (39s).

1. Clonar el repositorio desde GitHub:
```

git clone [https://github.com/matias-saavedra-g/ucursednt.git](https://github.com/matias-saavedra-g/ucursednt.git)

```

2. Abrir Microsoft Edge y navegar a `edge://extensions/`.

3. Habilitar el modo desarrollador (Developer Mode) en la esquina inferior izquierda de la página.

4. Click en "Load unpacked" (Cargar extensión sin empaquetar), luego seleccionar la carpeta clonada de la extensión (ucursednt).

5. La extensión debería cargarse y aparecer en la lista de extensiones instaladas.

---

> **Nota sobre el versionado:** A partir de la versión `26.3.1`, U-Cursedn't usa un esquema de versión basado en fecha: **`AA.MM.S`**, donde `AA` es el año (dos dígitos), `MM` el mes, y `S` el número de semana dentro del mes (1–5). Por ejemplo, `26.3.1` corresponde a la primera semana de marzo de 2026.