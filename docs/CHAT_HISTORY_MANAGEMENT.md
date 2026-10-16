> **Obsoleto desde 26.10.1:** el chat con API de Gemini, el panel lateral y el popup de IA fueron retirados. Las funciones de IA ahora abren Claude, ChatGPT, Gemini o Perplexity en una pestaña nueva (ver `askAI.js` y `UcursedntUtils.AI`). Este documento se conserva solo como referencia histórica.

# Chat History Management - Nueva Funcionalidad

## Descripción
Se ha implementado un sistema completo de gestión del historial de chat para la extensión U-Cursedn't, permitiendo a los usuarios mantener sus conversaciones guardadas y administrarlas de manera eficiente.

## Nuevas Funcionalidades

### 1. **Guardado Automático del Historial**
- Todos los mensajes (usuario y asistente) se guardan automáticamente en `chrome.storage.local`
- Cada mensaje incluye:
  - `role`: 'user' o 'assistant'
  - `content`: El contenido del mensaje
  - `timestamp`: Marca de tiempo ISO de cuando se envió/recibió

### 2. **Persistencia del Chat**
- Al cerrar y volver a abrir el chat, se restauran todas las conversaciones previas
- El historial se mantiene entre sesiones del navegador
- Solo se muestra el mensaje de bienvenida cuando no hay historial previo

### 3. **Botón de Borrar Historial**
- Nuevo botón 🗑️ en el header del chat
- Solicita confirmación antes de borrar el historial
- Mensaje de confirmación claro sobre la irreversibilidad de la acción
- Feedback visual cuando se completa la acción (✓ verde temporal)

### 4. **API Pública Expandida**
Nuevas funciones disponibles en `window.aiChatPopup`:

```javascript
// Obtener historial actual
window.aiChatPopup.getChatHistory()

// Borrar historial programáticamente
await window.aiChatPopup.clearChatHistory()

// Exportar historial como archivo JSON
window.aiChatPopup.exportChatHistory()
```

### 5. **Exportación de Historial**
- Función para descargar el historial completo como archivo JSON
- Nombre de archivo incluye la fecha: `ucursednt-chat-history-YYYY-MM-DD.json`
- Formato estructurado para fácil análisis o respaldo

## Detalles Técnicos

### Almacenamiento
- **Configuración del chat**: `chrome.storage.sync` (se sincroniza entre dispositivos)
- **Historial de mensajes**: `chrome.storage.local` (solo local, mejor rendimiento para datos grandes)

### Estructura del Historial
```json
[
  {
    "role": "user",
    "content": "¿Cómo puedo enviar una tarea?",
    "timestamp": "2025-09-02T15:30:45.123Z"
  },
  {
    "role": "assistant", 
    "content": "Para enviar una tarea en U-Cursos...",
    "timestamp": "2025-09-02T15:30:48.456Z"
  }
]
```

### Seguridad y Privacidad
- Los datos se almacenan localmente en el navegador del usuario
- No se envían a servidores externos
- El usuario tiene control total sobre sus datos
- Función de borrado completo disponible

## Uso

### Para Usuarios
1. **Chat Normal**: Usar el chat como siempre, el historial se guarda automáticamente
2. **Borrar Historial**: Hacer clic en el botón 🗑️ y confirmar
3. **Revisar Conversaciones**: Al abrir el chat, ver mensajes anteriores

### Para Desarrolladores
```javascript
// Acceder al historial
const history = window.aiChatPopup.getChatHistory();

// Limpiar historial
await window.aiChatPopup.clearChatHistory();

// Exportar historial
window.aiChatPopup.exportChatHistory();
```

## Beneficios
- **Continuidad**: Los usuarios pueden retomar conversaciones
- **Contexto**: El asistente puede referenciar mensajes anteriores
- **Backup**: Posibilidad de exportar conversaciones importantes
- **Control**: Los usuarios pueden limpiar su historial cuando lo deseen
- **Performance**: Uso eficiente de storage local para datos grandes
