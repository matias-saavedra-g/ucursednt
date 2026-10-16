> **Obsoleto desde 26.10.1:** el chat con API de Gemini, el panel lateral y el popup de IA fueron retirados. Las funciones de IA ahora abren Claude, ChatGPT, Gemini o Perplexity en una pestaña nueva (ver `askAI.js` y `UcursedntUtils.AI`). Este documento se conserva solo como referencia histórica.

# 🤖 AI Chat Flotante - U-Cursedn't (v2.0)

## Descripción
La funcionalidad de Chat IA Flotante ha sido mejorada para solucionar problemas de CORS y agregar configuraciones avanzadas para APIs personalizadas. Ahora incluye soporte completo para proveedores externos y APIs personalizadas con configuraciones flexibles.

## ✨ Nuevas Características

### 🔧 Configuración Avanzada de API
- **Base URL personalizable**: Define tu propio endpoint de API
- **Modelo configurable**: Especifica el modelo de IA a usar
- **Instrucciones del sistema**: Personaliza el comportamiento del asistente
- **Configuración visual mejorada**: Interfaz más intuitiva en el menú

### 🌐 Manejo de Proveedores Externos
- **Solución CORS**: Los proveedores externos ahora abren en nueva ventana
- **Interfaz informativa**: Explicación clara de limitaciones de seguridad
- **Botón de cambio rápido**: Facilita el cambio a API personalizada

### 💬 Chat Mejorado
- **Mensajes del sistema**: Visualización de instrucciones activas
- **Indicador de estado**: Muestra conexión, envío y errores
- **Manejo de errores robusto**: Mensajes informativos para problemas de API
- **Interfaz más pulida**: Mejor experiencia visual y de usuario

## Configuración Detallada

### 🛠️ API Personalizada
```javascript
{
  provider: 'custom',
  apiKey: 'tu-api-key-aqui',
  baseUrl: 'https://api.openai.com/v1/chat/completions',
  modelName: 'gpt-3.5-turbo',
  systemInstructions: 'Instrucciones personalizadas para el asistente',
  isMinimized: true/false
}
```

### 📋 Instrucciones del Sistema por Defecto
```
Eres un helpful assistant que ayuda a estudiantes universitarios con sus consultas académicas. Responde de manera clara, concisa y educativa.
```

### 🔗 Proveedores Compatibles
1. **ChatGPT** - Se abre en nueva ventana
2. **Claude** - Se abre en nueva ventana  
3. **Gemini** - Se abre en nueva ventana
4. **API Personalizada** - Chat integrado con configuraciones avanzadas

## Soluciones Implementadas

### ❌ Problema Original: CORS y X-Frame-Options
Los servicios externos como ChatGPT, Claude y Gemini bloquean su inclusión en iframes por seguridad.

### ✅ Solución Implementada
- **Proveedores externos**: Abren en nueva ventana para acceso completo
- **API personalizada**: Chat completamente integrado en el popup
- **Interfaz híbrida**: Lo mejor de ambos mundos

### 🔐 Seguridad Mejorada
- Validación de respuestas de API
- Manejo seguro de errores
- Protección de API keys con tipo password
- Indicadores visuales de estado de conexión

## Archivos Actualizados

### js/aiChatPopup.js
- ✅ Interfaz externa para proveedores web
- ✅ Chat personalizado mejorado con estado
- ✅ Manejo robusto de errores de API
- ✅ Configuraciones avanzadas (base URL, modelo, sistema)
- ✅ Indicadores visuales de estado

### js/menuGen.js  
- ✅ Formulario expandido con nuevos campos
- ✅ Base URL configurable
- ✅ Selector de modelo
- ✅ Editor de instrucciones del sistema
- ✅ Validación y guardado mejorado

### test.html
- ✅ Pruebas para ambos modos (externo y personalizado)
- ✅ Configuraciones de ejemplo
- ✅ Botones de cambio rápido entre modos

## Uso Práctico

### 1. Modo Proveedor Externo (ChatGPT, Claude, Gemini)
1. Selecciona el proveedor en configuración
2. Haz clic en UCursitos para abrir el popup
3. Usa "Abrir [Proveedor]" para nueva ventana
4. O cambia a "API Personalizada" para chat integrado

### 2. Modo API Personalizada
1. Selecciona "API Personalizada" en configuración
2. Configura:
   - **API Key**: Tu clave de acceso
   - **Base URL**: Endpoint de tu API (compatible con OpenAI)
   - **Modelo**: Nombre del modelo (ej: gpt-3.5-turbo, gpt-4)
   - **Instrucciones**: Comportamiento personalizado del asistente
3. Guarda la configuración
4. Usa el chat integrado directamente en el popup

### 3. Ejemplos de Configuración

#### OpenAI Estándar
```
Base URL: https://api.openai.com/v1/chat/completions
Modelo: gpt-3.5-turbo
```

#### Otros Proveedores Compatibles
```
Base URL: https://api.anthropic.com/v1/messages
Modelo: claude-3-sonnet-20240229
```

#### Servidor Local
```
Base URL: http://localhost:1234/v1/chat/completions
Modelo: llama2-7b
```

## Características Técnicas

### 📡 API Request Format
```javascript
{
  model: "configurado-por-usuario",
  messages: [
    { role: "system", content: "instrucciones-personalizadas" },
    { role: "user", content: "mensaje-del-usuario" }
  ],
  max_tokens: 1000,
  temperature: 0.7
}
```

### 🎨 Estados Visuales
- 🟢 **Conectado**: API funcionando correctamente
- 🟡 **Enviando**: Procesando mensaje (animación)
- 🔴 **Error**: Problema de conexión o API

### 📱 Responsive Design
- Adaptable a pantallas móviles
- Popup redimensionable y draggable
- Interfaz optimizada para diferentes tamaños

## Próximas Mejoras
- [ ] Soporte para streaming de respuestas
- [ ] Historial persistente de conversaciones
- [ ] Integración con tareas de U-Cursos
- [ ] Shortcuts de teclado personalizables
- [ ] Temas visuales alternativos
- [ ] Exportación de conversaciones

---

**🎓 Desarrollado para mejorar la experiencia académica en U-Cursos**
