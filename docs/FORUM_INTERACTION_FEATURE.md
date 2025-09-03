# Forum Interaction Feature - Documentación Técnica

## Descripción General

La funcionalidad de **Interacción con Foros** permite a los usuarios copiar contenido de hilos y posts individuales del foro de U-Cursos, así como enviar ese contenido directamente al chat IA integrado para análisis o consultas.

## Características Implementadas

### 1. Funciones de Copia
- **Copiar Hilo Completo**: Copia todo el contenido del hilo (post original + respuestas) en formato texto plano
- **Copiar Post Individual**: Copia únicamente el contenido de una publicación específica

### 2. Integración con Chat IA
- **Enviar Hilo al Chat**: Inserta el contenido completo del hilo en el campo de texto del chat IA
- **Enviar Post al Chat**: Inserta el contenido de un post específico en el chat IA

### 3. Interfaz de Usuario
- **Botones a Nivel de Hilo**: Se añaden en la cabecera del hilo principal como botones independientes
- **Botones a Nivel de Post**: Se integran nativamente en la lista de opciones (`ul.opciones`) de cada publicación
- **Integración Nativa**: Los botones de post se añaden como elementos `<li>` dentro del contenedor de acciones existente
- **Feedback Visual**: Confirmación visual cuando las acciones se completan exitosamente

## Estructura Técnica

### Integración Nativa con U-Cursos

La funcionalidad se integra de manera nativa con la estructura HTML existente de U-Cursos:

#### Botones a Nivel de Post
Los botones se insertan como elementos `<li>` dentro de la lista de opciones nativa (`ul.opciones`):

```html
<ul id="opciones_32341221" class="opciones">
    <li id="acciones"><a href="#" class="boton-copiar-post"><span class="fa fa-copy"></span> Copiar Post</a></li>
    <li id="acciones"><a href="#" class="boton-enviar-chat"><span class="fa fa-robot"></span> Enviar Post al Chat</a></li>
    <li id="acciones"><a href="#" class="permalink"><span class="fa fa-link"></span> Compartir</a></li>
    <li id="acciones"><a href="javascript:responder(...)"><span class="fa fa-reply"></span> Responder</a></li>
    <!-- ... más opciones existentes ... -->
</ul>
```

#### Botones a Nivel de Hilo
Los botones de hilo mantienen un diseño independiente ya que no existe una estructura nativa específica para acciones de hilo completo.

### Archivos Modificados/Creados

1. **`js/forumInteraction.js`** (NUEVO)
   - Script principal que implementa toda la funcionalidad
   - Detecta la estructura HTML del foro
   - Añade botones de interacción
   - Maneja las acciones de copia y envío al chat

2. **`manifest.json`**
   - Añadido nuevo content script para páginas de foro
   - Patrón URL: `https://www.u-cursos.cl/*/*/*/*/*/foro/*`

3. **`js/menuGen.js`**
   - Añadida opción "Interacción con Foros" en configuración
   - Incluida en configuración por defecto (activada)

4. **`js/achievementsGen.js`**
   - Añadido logro para la funcionalidad de foros (rareza: "rare")

### Selectores CSS Utilizados

```javascript
const SELECTORS = {
    thread: 'div[id^="raiz_"]',      // Contenedor completo del hilo
    post: '.msg',                    // Cualquier publicación
    rootPost: '.msg.raiz',           // Post original del hilo
    replyPost: '.msg.hijo',          // Respuestas al hilo
    author: '.autor .usuario',       // Autor de la publicación
    time: '.autor .tiempo_rel',      // Fecha/hora de la publicación
    content: '.texto .ta',           // Contenido de texto de la publicación
    postOptions: 'ul.opciones'       // Lista nativa de opciones de cada post
};
```

### Formato de Texto Generado

#### Post Individual
```
Autor: [nombre_usuario]
Fecha: [timestamp]

[contenido_del_post]
```

#### Hilo Completo
```
=== HILO COMPLETO ===

[HILO ORIGINAL]
Autor: [profesor.ejemplo]
Fecha: [hace 2 días]

[contenido_del_post_original]

--- --- ---

[RESPUESTA]
Autor: [estudiante.pregunta]
Fecha: [hace 1 día]

[contenido_de_la_respuesta]

--- --- ---

[RESPUESTA]
...
```

## Funciones Principales

### `addPostButtons(postElement)`
Integra botones de acción dentro de la estructura nativa `ul.opciones` de cada post.

### `createActionLink(text, iconClass, clickHandler)`
Crea enlaces de acción que se integran perfectamente con el estilo nativo de U-Cursos.

### `createActionListItem(link)`
Crea elementos `<li>` con la estructura correcta para la lista de opciones nativa.

### `formatPostAsText(postData, includePrefix)`
Formatea los datos del post como texto plano legible.

### `formatThreadAsText(threadData)`
Formatea un hilo completo con separadores claros entre posts.

### `copyToClipboard(text)`
Copia texto al portapapeles con fallback para compatibilidad.

### `sendToAIChat(text)`
Integra con el popup del chat IA, insertando texto y enfocando el campo de entrada.

## Integración con Sistema Existente

### Configuración
- La funcionalidad se puede activar/desactivar desde el menú de configuración
- Estado por defecto: **Activado**
- Se guarda en `chrome.storage.sync` bajo `settings.features.forumInteraction`

### Compatibilidad
- Compatible con todas las demás funcionalidades existentes
- No interfiere con `muchoTexto.js` (script existente para foros)
- Integración limpia con `aiChatPopup.js`

### Estilos CSS
- **Integración Nativa**: Los botones de post se estilizan para coincidir perfectamente con las opciones existentes de U-Cursos
- **Links de Acción**: Estilo consistente con enlaces nativos (tamaño 11px, color #666, efectos hover)
- **Botones de Hilo**: Gradiente naranja distintivo (`#ff6b35` a `#f7931e`) para diferenciarse de las acciones de post
- **Diseño Responsivo**: Adaptación automática para dispositivos móviles
- **Estados de Feedback**: Colores verde/rojo para confirmación de acciones

## Patrón de URL

La extensión se activa específicamente en páginas de foro usando el patrón:
```
https://www.u-cursos.cl/*/*/*/*/*/foro/*
```

Este patrón cubre dinámicamente:
- Facultad (ej: ingenieria)
- Año (ej: 2024)
- Semestre (ej: 1)
- Curso (ej: CC1000)
- Sección (ej: 1)
- Subcarpeta de foro

## Testing

Se incluye archivo `forum-test.html` que simula:
- Estructura HTML idéntica a U-Cursos
- Múltiples hilos con posts originales y respuestas
- Funciones de test para validar la carga de scripts
- Mock del entorno de extensión Chrome

### Cómo Probar
1. Abrir `forum-test.html` en navegador
2. Hacer clic en "Inicializar Funciones del Foro"
3. Verificar que aparecen los botones de interacción
4. Probar funcionalidades de copia y envío al chat

## Consideraciones de Seguridad

- No almacena contenido sensible de los foros
- Utiliza únicamente APIs públicas del navegador
- Respeta permisos existentes de la extensión
- No modifica contenido original de las páginas

## Futuras Mejoras Posibles

1. **Formato Markdown**: Opción para copiar en formato Markdown
2. **Filtros de Contenido**: Excluir citas o menciones al copiar
3. **Resumen Automático**: Integración con IA para resumir hilos largos
4. **Exportación**: Guardar hilos como archivos PDF o TXT
5. **Búsqueda**: Buscar contenido específico dentro de hilos

## Notas de Implementación

- La funcionalidad se inicializa después de que el DOM esté completamente cargado
- Incluye observer para detectar cambios dinámicos en la página
- Manejo robusto de errores con fallbacks
- Feedback visual inmediato para todas las acciones del usuario
