// aiChatPopup.js - Floating AI Chat Popup with UCursitos mascot

(async function() {
    'use strict';

    // Import utility functions
    const { safeChromeStorageGet, safeChromeStorageSet, isExtensionContextValid } = window.extensionUtils || {
        safeChromeStorageGet: (key) => new Promise(resolve => {
            chrome.storage.sync.get([key], result => resolve(result[key] || null));
        }),
        safeChromeStorageSet: (key, value) => new Promise(resolve => {
            chrome.storage.sync.set({ [key]: value }, resolve);
        }),
        isExtensionContextValid: () => true
    };

    // Check if already loaded to prevent duplicate initialization
    if (window.aiChatPopupLoaded) {
        return;
    }
    window.aiChatPopupLoaded = true;

    let isPopupVisible = false;
    let isMinimized = true;
    let currentProvider = 'chatgpt';
    let apiKey = '';
    let baseUrl = 'https://api.openai.com/v1/chat/completions';
    let modelName = 'gpt-3.5-turbo';
    
    // Default system instructions for U-Cursos Assistant
    const DEFAULT_SYSTEM_INSTRUCTIONS = `System Prompt: Asistente Virtual de U-Cursos

1. PERSONA
Eres "Asistente U-Cursos", un asistente virtual experto integrado en la plataforma U-Cursos de la Universidad de Chile. Tu propósito principal es ayudar a estudiantes y académicos a navegar y utilizar la plataforma de manera eficiente, resolviendo sus dudas y facilitando su experiencia académica. Eres un guía amigable, conocedor y siempre dispuesto a ayudar. Tu identidad está ligada exclusivamente a la Universidad de Chile y sus procesos internos gestionados a través de U-Cursos.

2. TAREA
Tu tarea es responder preguntas y proporcionar orientación sobre las funcionalidades y el contenido de la plataforma U-Cursos. Debes ser capaz de:
- Responder preguntas directas: Contestar dudas específicas sobre cómo usar la plataforma (ej: "¿Cómo puedo enviar una tarea?", "¿Dónde veo mis calificaciones?").
- Proporcionar guías paso a paso: Ofrecer instrucciones claras y secuenciales para realizar acciones dentro de la plataforma.
- Resumir información: Sintetizar el contenido de anuncios, foros o materiales si se te proporciona el contexto.
- Localizar información: Ayudar a los usuarios a encontrar dónde se ubican ciertas secciones o materiales dentro de sus cursos.
- Resolver problemas comunes: Ofrecer soluciones a problemas frecuentes que los usuarios puedan encontrar.

Límites y restricciones:
- No inventes información: Si no tienes la respuesta o la información no está disponible en el contexto proporcionado, indícalo claramente. Sugiere al usuario consultar directamente con su docente o con el soporte técnico de U-Cursos.
- Privacidad: No tienes acceso a información personal, privada o sensible de los usuarios, como calificaciones específicas, mensajes privados o datos de contacto. No debes solicitarla ni procesarla.
- Mantente en el tema: Limita tus respuestas al ecosistema de U-Cursos y la vida académica en la Universidad de Chile. Evita responder preguntas de conocimiento general que no estén relacionadas.

3. CONTEXTO
Tu conocimiento se basa en la estructura y funcionalidades de la plataforma U-Cursos. La información clave que debes manejar es:
- Plataforma: U-Cursos, un campus virtual y sistema de gestión de aprendizaje desarrollado por el Centro Tecnológico Ucampus para la Universidad de Chile.
- Audiencia: Estudiantes y académicos de la Universidad de Chile.
- Funcionalidades Clave:
  * Sitios de Cursos: Cada curso tiene un sitio web dedicado y administrado por el profesor.
  * Materiales Educativos: Los estudiantes pueden ver y descargar apuntes, bibliografía y otros materiales. Los profesores pueden subir contenido en múltiples formatos.
  * Herramientas de Comunicación: Foros para interactuar y sistema de correo para que los profesores envíen anuncios a todo el curso.
  * Gestión de Tareas y Calificaciones: Los estudiantes pueden enviar tareas y consultar sus notas parciales. Los profesores pueden administrar y calificar estas entregas.
  * Calendario y Planificación: Agenda electrónica para planificar y visualizar las actividades del curso.
  * Aplicación Móvil: Existe una app oficial para Android y iOS que envía notificaciones push en tiempo real.
  * Perfil Personal: Cada usuario puede gestionar su perfil, revisar sus tareas, cursos, calendario y configurar notificaciones.

4. FORMATO
- Claridad y Concisión: Responde de manera directa y fácil de entender.
- Estructura: Utiliza listas (con viñetas o numeradas) para desglosar pasos o enumerar características.
- Énfasis: Usa negrita para resaltar acciones clave, nombres de secciones o botones (ej: "Ve a la sección **Tareas** y haz clic en **Enviar**").
- Lenguaje: Responde siempre en español de Chile, utilizando terminología común en el ámbito académico chileno (ej: "ramo" en lugar de "asignatura", "nota" en lugar de "calificación").

5. TONO
- Servicial y Profesional: Mantén un tono amable, respetuoso y formal, adecuado para un entorno universitario.
- Seguro y Confiable: Proporciona información con seguridad, pero sé humilde cuando no conoces una respuesta.
- Proactivo y Orientador: No te limites a responder; si es pertinente, ofrece consejos adicionales o sugiere funcionalidades relacionadas que podrían ser útiles para el usuario.`;

    let systemInstructions = DEFAULT_SYSTEM_INSTRUCTIONS;

    // AI Provider configurations
    const AI_PROVIDERS = {
        chatgpt: {
            name: 'ChatGPT',
            url: 'https://chatgpt.com/',
            icon: '🤖',
            description: 'Abre ChatGPT en nueva ventana'
        },
        claude: {
            name: 'Claude',
            url: 'https://claude.ai/',
            icon: '🧠',
            description: 'Abre Claude en nueva ventana'
        },
        gemini: {
            name: 'Gemini',
            url: 'https://gemini.google.com/',
            icon: '✨',
            description: 'Abre Gemini en nueva ventana'
        },
        custom: {
            name: 'API Personalizada',
            url: 'custom',
            icon: '🔧',
            description: 'Chat integrado con API personalizada'
        }
    };

    // Load stored settings
    async function loadAIChatSettings() {
        try {
            const settings = await safeChromeStorageGet('aiChatSettings') || {};
            currentProvider = settings.provider || 'chatgpt';
            apiKey = settings.apiKey || '';
            baseUrl = settings.baseUrl || 'https://api.openai.com/v1/chat/completions';
            modelName = settings.modelName || 'gpt-3.5-turbo';
            systemInstructions = settings.systemInstructions || DEFAULT_SYSTEM_INSTRUCTIONS;
            isMinimized = settings.isMinimized !== false; // Default to minimized
        } catch (error) {
            console.error('Error loading AI chat settings:', error);
        }
    }

    // Save settings
    async function saveAIChatSettings() {
        try {
            await safeChromeStorageSet('aiChatSettings', {
                provider: currentProvider,
                apiKey: apiKey,
                baseUrl: baseUrl,
                modelName: modelName,
                systemInstructions: systemInstructions,
                isMinimized: isMinimized
            });
        } catch (error) {
            console.error('Error saving AI chat settings:', error);
        }
    }

    // Create the floating chat popup
    function createAIChatPopup() {
        // Main container
        const chatContainer = document.createElement('div');
        chatContainer.id = 'ai-chat-popup';
        chatContainer.className = 'ai-chat-container';

        // UCursitos mascot button
        const mascotButton = document.createElement('div');
        mascotButton.className = 'ucursitos-mascot';
        mascotButton.innerHTML = `
            <img src="${chrome.runtime.getURL('images/ucursitos.png')}" 
                 alt="UCursitos" 
                 title="Chat con IA - Haz clic para expandir/contraer">
        `;

        // Chat iframe container
        const chatFrame = document.createElement('div');
        chatFrame.className = 'ai-chat-frame';
        chatFrame.style.display = 'none';

        // Chat header
        const chatHeader = document.createElement('div');
        chatHeader.className = 'ai-chat-header';
        chatHeader.innerHTML = `
            <div class="chat-header-content">
                <span class="provider-icon">${AI_PROVIDERS[currentProvider].icon}</span>
                <span class="provider-name">${AI_PROVIDERS[currentProvider].name}</span>
                <div class="chat-controls">
                    <button class="chat-control-btn minimize-btn" title="Minimizar">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="chat-control-btn close-btn" title="Cerrar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        // Chat content
        const chatContent = document.createElement('div');
        chatContent.className = 'ai-chat-content';

        if (currentProvider === 'custom' && apiKey) {
            // Custom API interface
            createCustomAPIInterface(chatContent);
        } else if (currentProvider !== 'custom') {
            // External providers - open in new window instead of iframe
            createExternalProviderInterface(chatContent);
        } else {
            // No API key configured
            chatContent.innerHTML = `
                <div class="api-config-notice">
                    <h3>🔧 API Personalizada</h3>
                    <p>Configura tu API key en el menú de configuración para usar esta función.</p>
                    <button class="config-button" onclick="window.open('/ucursednt/', '_blank')">
                        <i class="fas fa-cog"></i> Ir a Configuración
                    </button>
                </div>
            `;
        }

        // Assemble the chat frame
        chatFrame.appendChild(chatHeader);
        chatFrame.appendChild(chatContent);

        // Assemble the main container
        chatContainer.appendChild(mascotButton);
        chatContainer.appendChild(chatFrame);

        // Add event listeners
        mascotButton.addEventListener('click', toggleChatPopup);
        chatHeader.querySelector('.minimize-btn').addEventListener('click', minimizeChatPopup);
        chatHeader.querySelector('.close-btn').addEventListener('click', closeChatPopup);

        // Make the popup draggable by the header
        makeDraggable(chatContainer, chatHeader);

        return chatContainer;
    }

    // Create external provider interface
    function createExternalProviderInterface(container) {
        const provider = AI_PROVIDERS[currentProvider];
        container.innerHTML = `
            <div class="external-provider-interface">
                <div class="provider-info">
                    <div class="provider-icon-large">${provider.icon}</div>
                    <h3>${provider.name}</h3>
                    <p>${provider.description}</p>
                </div>
                <div class="provider-actions">
                    <button class="provider-btn primary" onclick="window.open('${provider.url}', '_blank')">
                        <i class="fas fa-external-link-alt"></i>
                        Abrir ${provider.name}
                    </button>
                    <button class="provider-btn secondary" onclick="window.aiChatPopup.switchToCustom()">
                        <i class="fas fa-cog"></i>
                        Usar API Personalizada
                    </button>
                </div>
                <div class="provider-note">
                    <p><i class="fas fa-info-circle"></i> Los servicios externos no pueden integrarse directamente por restricciones de seguridad. Usa la API personalizada para chat integrado.</p>
                </div>
            </div>
        `;
    }

    // Create custom API interface
    function createCustomAPIInterface(container) {
        container.innerHTML = `
            <div class="custom-api-interface">
                <div class="chat-messages" id="chat-messages">
                    <div class="system-message">
                        <i class="fas fa-robot"></i>
                        <div class="message-content">
                            <strong>Sistema:</strong> ${systemInstructions}
                        </div>
                    </div>
                    <div class="welcome-message">
                        <div class="message-content">
                            ¡Hola! Soy tu asistente de IA personalizado. ¿En qué puedo ayudarte hoy?
                        </div>
                        <div class="message-time">${new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <textarea 
                        id="chat-input" 
                        placeholder="Escribe tu mensaje aquí..." 
                        rows="3"></textarea>
                    <button id="send-message" class="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="api-status">
                    <span class="status-indicator connected"></span>
                    <span class="status-text">Conectado a ${modelName}</span>
                </div>
            </div>
        `;

        // Add event listeners for custom API
        const chatInput = container.querySelector('#chat-input');
        const sendButton = container.querySelector('#send-message');

        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Send message to custom API via background script
    async function sendMessage() {
        const input = document.querySelector('#chat-input');
        const messagesContainer = document.querySelector('#chat-messages');
        const sendButton = document.querySelector('#send-message');
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        const message = input.value.trim();

        if (!message || !apiKey) {
            if (!apiKey) {
                addMessageToChat('system', 'Error: No hay API key configurada', messagesContainer);
            }
            return;
        }

        // Disable input while processing
        input.disabled = true;
        sendButton.disabled = true;
        statusIndicator.className = 'status-indicator sending';
        statusText.textContent = 'Enviando...';

        // Add user message
        addMessageToChat('user', message, messagesContainer);
        input.value = '';

        // Add loading indicator
        const loadingId = addMessageToChat('assistant', 'Escribiendo...', messagesContainer);

        try {
            // Prepare messages for API
            const messages = [
                { role: 'system', content: systemInstructions },
                { role: 'user', content: message }
            ];

            // Send request to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'makeAIAPICall',
                    data: {
                        baseUrl: baseUrl,
                        apiKey: apiKey,
                        messages: messages,
                        modelName: modelName,
                        maxTokens: 1000,
                        temperature: 0.7
                    }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });

            // Remove loading indicator
            document.getElementById(loadingId)?.remove();

            if (response.success && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                addMessageToChat('assistant', response.data.choices[0].message.content, messagesContainer);
                statusIndicator.className = 'status-indicator connected';
                statusText.textContent = `Conectado a ${modelName}`;
            } else {
                const errorMsg = response.error || 'Respuesta inesperada del servidor';
                addMessageToChat('assistant', `Error: ${errorMsg}`, messagesContainer);
                statusIndicator.className = 'status-indicator error';
                statusText.textContent = 'Error en respuesta';
            }
        } catch (error) {
            document.getElementById(loadingId)?.remove();
            addMessageToChat('assistant', `Error: ${error.message}`, messagesContainer);
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = 'Error de conexión';
        } finally {
            // Re-enable input
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    }

    // Add message to chat
    function addMessageToChat(role, content, container) {
        const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}-message`;
        messageDiv.id = messageId;
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        return messageId;
    }

    // Toggle chat popup visibility
    function toggleChatPopup() {
        const chatFrame = document.querySelector('.ai-chat-frame');
        if (isMinimized) {
            chatFrame.style.display = 'block';
            isMinimized = false;
        } else {
            chatFrame.style.display = 'none';
            isMinimized = true;
        }
        saveAIChatSettings();
    }

    // Minimize chat popup
    function minimizeChatPopup() {
        const chatFrame = document.querySelector('.ai-chat-frame');
        chatFrame.style.display = 'none';
        isMinimized = true;
        saveAIChatSettings();
    }

    // Close chat popup
    function closeChatPopup() {
        const chatContainer = document.querySelector('#ai-chat-popup');
        if (chatContainer) {
            chatContainer.remove();
            isPopupVisible = false;
        }
    }

    // Make element draggable
    function makeDraggable(element, handle) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        handle.style.cursor = 'move';

        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseInt(window.getComputedStyle(element).left, 10) || 0;
            initialY = parseInt(window.getComputedStyle(element).top, 10) || 0;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        });

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const currentX = initialX + e.clientX - startX;
            const currentY = initialY + e.clientY - startY;
            
            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }

    // Add CSS styles
    function addAIChatStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-chat-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            }

            .ucursitos-mascot {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #007bff;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
                transition: all 0.3s ease;
                border: 3px solid #ffffff;
            }

            .ucursitos-mascot:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
            }

            .ucursitos-mascot img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }

            .ai-chat-frame {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 400px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                overflow: hidden;
                border: 1px solid #e1e5e9;
            }

            .ai-chat-header {
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 12px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                user-select: none;
            }

            .chat-header-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
            }

            .provider-icon {
                font-size: 18px;
                margin-right: 8px;
            }

            .provider-name {
                font-weight: 600;
                font-size: 14px;
            }

            .chat-controls {
                display: flex;
                gap: 4px;
            }

            .chat-control-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                transition: background-color 0.2s ease;
            }

            .chat-control-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .ai-chat-content {
                height: calc(100% - 48px);
                overflow: hidden;
            }

            .ai-chat-iframe {
                width: 100%;
                height: 100%;
                border: none;
            }

            .api-config-notice {
                padding: 20px;
                text-align: center;
                color: #6c757d;
            }

            .config-button {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                margin-top: 15px;
                font-size: 14px;
                transition: background-color 0.2s ease;
            }

            .config-button:hover {
                background: #0056b3;
            }

            .external-provider-interface {
                padding: 20px;
                text-align: center;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .provider-info {
                margin-bottom: 30px;
            }

            .provider-icon-large {
                font-size: 48px;
                margin-bottom: 15px;
            }

            .provider-info h3 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 20px;
            }

            .provider-info p {
                color: #6c757d;
                margin: 0;
                font-size: 14px;
            }

            .provider-actions {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }

            .provider-btn {
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .provider-btn.primary {
                background: #007bff;
                color: white;
            }

            .provider-btn.primary:hover {
                background: #0056b3;
                transform: translateY(-1px);
            }

            .provider-btn.secondary {
                background: #f8f9fa;
                color: #6c757d;
                border: 1px solid #dee2e6;
            }

            .provider-btn.secondary:hover {
                background: #e9ecef;
                color: #495057;
            }

            .provider-note {
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 12px;
                border-radius: 0 4px 4px 0;
                font-size: 12px;
                color: #1565c0;
            }

            .provider-note i {
                margin-right: 8px;
            }

            .custom-api-interface {
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #f8f9fa;
            }

            .chat-message {
                margin-bottom: 12px;
                max-width: 85%;
            }

            .user-message {
                margin-left: auto;
            }

            .user-message .message-content {
                background: #007bff;
                color: white;
                padding: 8px 12px;
                border-radius: 12px 12px 4px 12px;
            }

            .assistant-message .message-content {
                background: white;
                color: #333;
                padding: 8px 12px;
                border-radius: 12px 12px 12px 4px;
                border: 1px solid #e1e5e9;
            }

            .message-time {
                font-size: 10px;
                color: #6c757d;
                margin-top: 4px;
                text-align: right;
            }

            .assistant-message .message-time {
                text-align: left;
            }

            .chat-input-container {
                padding: 12px;
                background: white;
                border-top: 1px solid #e1e5e9;
                display: flex;
                gap: 8px;
                align-items: flex-end;
            }

            #chat-input {
                flex: 1;
                border: 1px solid #e1e5e9;
                border-radius: 8px;
                padding: 8px 12px;
                resize: none;
                font-family: inherit;
                font-size: 14px;
                max-height: 80px;
            }

            #chat-input:focus {
                outline: none;
                border-color: #007bff;
            }

            .send-btn {
                background: #007bff;
                color: white;
                border: none;
                border-radius: 8px;
                width: 36px;
                height: 36px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s ease;
            }

            .send-btn:hover {
                background: #0056b3;
            }

            .send-btn:disabled {
                background: #6c757d;
                cursor: not-allowed;
            }

            .system-message {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 10px 12px;
                margin-bottom: 12px;
                border-radius: 0 8px 8px 0;
                font-size: 12px;
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }

            .system-message i {
                color: #856404;
                margin-top: 2px;
            }

            .welcome-message {
                background: #d1ecf1;
                border-left: 4px solid #17a2b8;
                padding: 10px 12px;
                margin-bottom: 12px;
                border-radius: 0 8px 8px 0;
                max-width: 85%;
            }

            .welcome-message .message-content {
                background: none;
                border: none;
                padding: 0;
                color: #0c5460;
                font-weight: 500;
            }

            .api-status {
                padding: 8px 12px;
                background: white;
                border-top: 1px solid #e1e5e9;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            .status-indicator.connected {
                background: #28a745;
            }

            .status-indicator.sending {
                background: #ffc107;
                animation: pulse 1s infinite;
            }

            .status-indicator.error {
                background: #dc3545;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .status-text {
                color: #6c757d;
                font-weight: 500;
            }

            @media (max-width: 768px) {
                .ai-chat-frame {
                    width: 320px;
                    height: 400px;
                }
                
                .ai-chat-container {
                    bottom: 10px;
                    right: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize the AI chat popup
    async function initAIChatPopup() {
        if (!isExtensionContextValid()) return;

        await loadAIChatSettings();
        addAIChatStyles();

        // Only create popup if not already exists
        if (!document.querySelector('#ai-chat-popup')) {
            const chatPopup = createAIChatPopup();
            document.body.appendChild(chatPopup);
            isPopupVisible = true;
        }
    }

    // Update popup when settings change
    function updateChatPopup() {
        const existingPopup = document.querySelector('#ai-chat-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        if (isPopupVisible) {
            initAIChatPopup();
        }
    }

    // Export functions for use in menuGen.js
    window.aiChatPopup = {
        init: initAIChatPopup,
        update: updateChatPopup,
        setProvider: (provider) => {
            currentProvider = provider;
            saveAIChatSettings();
            updateChatPopup();
        },
        setApiKey: (key) => {
            apiKey = key;
            saveAIChatSettings();
            updateChatPopup();
        },
        setBaseUrl: (url) => {
            baseUrl = url;
            saveAIChatSettings();
            updateChatPopup();
        },
        setModel: (model) => {
            modelName = model;
            saveAIChatSettings();
            updateChatPopup();
        },
        setSystemInstructions: (instructions) => {
            systemInstructions = instructions;
            saveAIChatSettings();
            updateChatPopup();
        },
        resetToDefaultInstructions: () => {
            systemInstructions = DEFAULT_SYSTEM_INSTRUCTIONS;
            saveAIChatSettings();
            updateChatPopup();
            return DEFAULT_SYSTEM_INSTRUCTIONS;
        },
        switchToCustom: () => {
            currentProvider = 'custom';
            saveAIChatSettings();
            updateChatPopup();
        },
        getCurrentProvider: () => currentProvider,
        getCurrentApiKey: () => apiKey,
        getCurrentBaseUrl: () => baseUrl,
        getCurrentModel: () => modelName,
        getCurrentSystemInstructions: () => systemInstructions,
        getDefaultSystemInstructions: () => DEFAULT_SYSTEM_INSTRUCTIONS,
        getProviders: () => AI_PROVIDERS
    };

    // Auto-initialize on U-Cursos pages
    if (window.location.hostname.includes('u-cursos.cl')) {
        // Wait for page to be ready and check if feature is enabled
        const checkAndInit = async () => {
            const settings = await safeChromeStorageGet('settings');
            if (settings && settings.features && settings.features.aiChatPopup) {
                initAIChatPopup();
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndInit);
        } else {
            checkAndInit();
        }
    }

})();
