// aiChatPopup.js - Floating AI Chat Popup with UCursitos mascot - Gemini AI Only

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

    // Helper functions for local storage (chat history)
    const safeChromeLocalGet = (key) => new Promise(resolve => {
        chrome.storage.sync.get([key], result => resolve(result[key] || null));
    });

    const safeChromeLocalSet = (key, value) => new Promise(resolve => {
        chrome.storage.sync.set({ [key]: value }, resolve);
    });

    const safeChromeLocalRemove = (key) => new Promise(resolve => {
        chrome.storage.sync.remove([key], resolve);
    });

    // Check if already loaded to prevent duplicate initialization
    if (window.aiChatPopupLoaded) {
        return;
    }
    window.aiChatPopupLoaded = true;

    let isPopupVisible = false;
    let isMinimized = true;
    let apiKey = '';
    let chatHistory = []; // Array to store chat messages
    let systemMessageCollapsed = true; // State of system message collapse
    
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

    // Load stored settings
    async function loadAIChatSettings() {
        try {
            const settings = await safeChromeStorageGet('aiChatSettings') || {};
            apiKey = settings.apiKey || '';
            systemInstructions = settings.systemInstructions || DEFAULT_SYSTEM_INSTRUCTIONS;
            isMinimized = settings.isMinimized !== false; // Default to minimized
            systemMessageCollapsed = settings.systemMessageCollapsed !== false; // Default to collapsed
        } catch (error) {
            console.error('Error loading AI chat settings:', error);
        }
    }

    // Save settings
    async function saveAIChatSettings() {
        try {
            await safeChromeStorageSet('aiChatSettings', {
                apiKey: apiKey,
                systemInstructions: systemInstructions,
                isMinimized: isMinimized,
                systemMessageCollapsed: systemMessageCollapsed
            });
        } catch (error) {
            console.error('Error saving AI chat settings:', error);
        }
    }

    // Load chat history from local storage
    async function loadChatHistory() {
        try {
            const history = await safeChromeLocalGet('aiChatHistory') || [];
            chatHistory = history;
            return history;
        } catch (error) {
            console.error('Error loading chat history:', error);
            return [];
        }
    }

    // Save chat history to local storage
    async function saveChatHistory() {
        try {
            await safeChromeLocalSet('aiChatHistory', chatHistory);
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    // Clear chat history
    async function clearChatHistory() {
        try {
            chatHistory = [];
            await safeChromeLocalRemove('aiChatHistory');
        } catch (error) {
            console.error('Error clearing chat history:', error);
        }
    }

    // Create the floating chat popup
    async function createAIChatPopup() {
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
                 title="Chat con IA Gemini - Haz clic para expandir/contraer">
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
                <span class="provider-icon">✨</span>
                <span class="provider-name">U-Cursedn't AI</span>
                <div class="chat-controls">
                    <button class="chat-control-btn open-tab-btn" title="Abrir en Nueva Pestaña">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="chat-control-btn clear-history-btn" title="Borrar Historial">
                        <i class="fas fa-trash"></i>
                    </button>
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

        if (apiKey) {
            // Gemini API interface
            await createGeminiAPIInterface(chatContent);
        } else {
            // No API key configured
            chatContent.innerHTML = `
                <div class="api-config-notice">
                    <p>Para usar el chat integrado, configura tu API key de Google AI Studio.</p>
                    <div class="api-setup-info">
                        <h4>📝 Cómo obtener tu API key:</h4>
                        <ul>
                            <li>Ve a <a href="https://aistudio.google.com" target="_blank" style="color: #4285f4; text-decoration: underline;">AI Studio</a></li>
                            <li>Inicia sesión con tu cuenta de Google</li>
                            <li>Ve a "Get API key" en el menú lateral</li>
                            <li>Crea una nueva API key</li>
                            <li>Copia la key y pégala en configuración</li>
                        </ul>
                        <div class="api-warning">
                            <strong>⚠️ Advertencia:</strong> Exponer una clave de API en una aplicación del lado del cliente no es una práctica recomendada para su uso en producción, ya que puede ser sustraída por actores maliciosos. Este método solo es adecuado para pruebas iniciales y la creación de prototipos.
                        </div>
                    </div>
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
        chatHeader.querySelector('.open-tab-btn').addEventListener('click', openChatInNewTab);
        chatHeader.querySelector('.clear-history-btn').addEventListener('click', handleClearHistory);
        chatHeader.querySelector('.minimize-btn').addEventListener('click', minimizeChatPopup);
        chatHeader.querySelector('.close-btn').addEventListener('click', closeChatPopup);

        // Make the popup draggable by the header
        makeDraggable(chatContainer, chatHeader);

        return chatContainer;
    }

    // Create Gemini API interface
    async function createGeminiAPIInterface(container) {
        // Load chat history
        await loadChatHistory();
        
        container.innerHTML = `
            <div class="custom-api-interface">
                <div class="chat-messages" id="chat-messages">
                    <div class="system-message" id="system-message">
                        <div class="system-message-header" onclick="toggleSystemMessage()">
                            <i class="fas fa-robot"></i>
                            <strong>Sistema</strong>
                            <i class="fas fa-chevron-down system-chevron" id="system-chevron"></i>
                        </div>
                        <div class="system-message-content" id="system-message-content">
                            ${systemInstructions}
                        </div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <textarea 
                        id="chat-input" 
                        placeholder="¿En qué puedo ayudarte hoy? Escribe tu pregunta aquí..." 
                        rows="2"></textarea>
                    <button id="send-message" class="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <div class="api-status">
                <span class="status-indicator connected"></span>
                <span class="status-text">Conectado a Gemini Pro</span>
            </div>
        `;

        // Load and display chat history
        const messagesContainer = container.querySelector('#chat-messages');
        if (chatHistory.length === 0) {
            // Show welcome message only if no history
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'welcome-message';
            welcomeMessage.innerHTML = `
                <div class="message-content">
                    ¡Hola! Soy tu asistente de IA powered by Gemini. ¿En qué puedo ayudarte hoy?
                </div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            `;
            messagesContainer.appendChild(welcomeMessage);
        } else {
            // Display chat history
            chatHistory.forEach(message => {
                displayMessageInChat(message.role, message.content, message.timestamp, messagesContainer);
            });
        }

        // Add event listeners for Gemini API
        const chatInput = container.querySelector('#chat-input');
        const sendButton = container.querySelector('#send-message');

        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Initialize system message collapsed state
        const systemMessage = container.querySelector('#system-message');
        const systemContent = container.querySelector('#system-message-content');
        const systemChevron = container.querySelector('#system-chevron');
        
        if (systemMessageCollapsed && systemMessage && systemContent && systemChevron) {
            systemMessage.classList.add('collapsed');
            systemContent.style.display = 'none';
            systemChevron.style.transform = 'rotate(-90deg)';
        }

        // Add global toggle function for system message
        window.toggleSystemMessage = function() {
            const content = document.getElementById('system-message-content');
            const chevron = document.getElementById('system-chevron');
            const systemMessage = document.getElementById('system-message');
            
            if (content && chevron && systemMessage) {
                const isCollapsed = systemMessage.classList.contains('collapsed');
                
                if (isCollapsed) {
                    // Expand
                    systemMessage.classList.remove('collapsed');
                    content.style.display = 'block';
                    chevron.style.transform = 'rotate(0deg)';
                    systemMessageCollapsed = false;
                } else {
                    // Collapse
                    systemMessage.classList.add('collapsed');
                    content.style.display = 'none';
                    chevron.style.transform = 'rotate(-90deg)';
                    systemMessageCollapsed = true;
                }
                
                // Save the state
                saveAIChatSettings();
            }
        };

        // Initialize system message state based on saved preference
        setTimeout(() => {
            const content = document.getElementById('system-message-content');
            const chevron = document.getElementById('system-chevron');
            const systemMessage = document.getElementById('system-message');
            
            if (content && chevron && systemMessage) {
                if (systemMessageCollapsed) {
                    content.style.display = 'none';
                    chevron.style.transform = 'rotate(-90deg)';
                    systemMessage.classList.add('collapsed');
                } else {
                    content.style.display = 'block';
                    chevron.style.transform = 'rotate(0deg)';
                    systemMessage.classList.remove('collapsed');
                }
            }
        }, 100);
    }

    // Send message to Gemini API via background script
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
        const timestamp = new Date().toISOString();
        addMessageToChat('user', message, messagesContainer);
        
        // Save user message to history
        chatHistory.push({
            role: 'user',
            content: message,
            timestamp: timestamp
        });
        await saveChatHistory();

        input.value = '';

        // Add loading indicator
        const loadingId = addMessageToChat('assistant', 'Escribiendo...', messagesContainer);

        try {
            // Send request to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'generateContent',
                    apiKey: apiKey,
                    prompt: message,
                    systemInstruction: systemInstructions
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

            if (response.success && response.content) {
                addMessageToChat('assistant', response.content, messagesContainer);
                
                // Save assistant response to history
                chatHistory.push({
                    role: 'assistant',
                    content: response.content,
                    timestamp: new Date().toISOString()
                });
                await saveChatHistory();
                
                statusIndicator.className = 'status-indicator connected';
                statusText.textContent = 'Conectado a Gemini Pro';
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
        const timestamp = new Date().toISOString();
        return displayMessageInChat(role, content, timestamp, container);
    }

    // Display message in chat with timestamp
    function displayMessageInChat(role, content, timestamp, container) {
        const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}-message`;
        messageDiv.id = messageId;
        
        const messageTime = new Date(timestamp).toLocaleTimeString();
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${messageTime}</div>
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
        const confirmed = confirm(
            '¿Estás seguro de que quieres cerrar el chat?\n\n' +
            'El chat se cerrará pero tu historial se mantendrá guardado.'
        );
        
        if (confirmed) {
            const chatPopup = document.querySelector('#ai-chat-popup');
            if (chatPopup) {
                chatPopup.remove();
                isPopupVisible = false;
            }
        }
    }

    // Open chat in new tab
    function openChatInNewTab() {
        const chatUrl = chrome.runtime.getURL('aipopup.html');
        window.open(chatUrl, '_blank');
    }

    // Handle clear history with confirmation
    async function handleClearHistory() {
        const confirmed = confirm(
            '¿Estás seguro de que quieres borrar todo el historial del chat?\n\n' +
            'Esta acción no se puede deshacer y se perderán todas las conversaciones anteriores.'
        );
        
        if (confirmed) {
            try {
                await clearChatHistory();
                
                // Clear the chat messages container
                const messagesContainer = document.querySelector('#chat-messages');
                if (messagesContainer) {
                    // Keep system message, remove everything else
                    const systemMessage = messagesContainer.querySelector('.system-message');
                    messagesContainer.innerHTML = '';
                    
                    if (systemMessage) {
                        messagesContainer.appendChild(systemMessage);
                    }
                    
                    // Add welcome message
                    const welcomeMessage = document.createElement('div');
                    welcomeMessage.className = 'welcome-message';
                    welcomeMessage.innerHTML = `
                        <div class="message-content">
                            ¡Historial borrado! Soy tu asistente de IA powered by Gemini. ¿En qué puedo ayudarte hoy?
                        </div>
                        <div class="message-time">${new Date().toLocaleTimeString()}</div>
                    `;
                    messagesContainer.appendChild(welcomeMessage);
                }
                
                // Show temporary success notification
                const clearBtn = document.querySelector('.clear-history-btn');
                if (clearBtn) {
                    const originalHTML = clearBtn.innerHTML;
                    clearBtn.innerHTML = '<i class="fas fa-check"></i>';
                    clearBtn.style.color = '#4caf50';
                    
                    setTimeout(() => {
                        clearBtn.innerHTML = originalHTML;
                        clearBtn.style.color = '';
                    }, 2000);
                }
                
            } catch (error) {
                console.error('Error clearing chat history:', error);
                alert('Error al borrar el historial. Por favor, inténtalo de nuevo.');
            }
        }
    }

    // Make element draggable
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Add CSS styles for the chat popup
    function addAIChatStyles() {
        if (document.querySelector('#ai-chat-styles')) return;

        const style = document.createElement('style');
        style.id = 'ai-chat-styles';
        style.textContent = `
            /* AI Chat Popup Styles */
            .ai-chat-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .ucursitos-mascot {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(45deg, #4285f4, #34a853);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                position: relative;
            }

            .ucursitos-mascot:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0,0,0,0.2);
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
                width: 450px;
                height: 600px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                overflow: hidden;
                border: 1px solid #e0e0e0;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
            }

            .ai-chat-header {
                background: linear-gradient(45deg, #4285f4, #34a853);
                color: white;
                padding: 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: move;
                flex-shrink: 0;
                min-height: 40px;
                box-sizing: border-box;
            }

            .chat-header-content {
                display: flex;
                align-items: center;
                flex: 1;
            }

            .provider-icon {
                font-size: 20px;
                margin-right: 10px;
            }

            .provider-name {
                font-weight: 600;
                font-size: 16px;
            }

            .chat-controls {
                display: flex;
                gap: 4px;
                align-items: flex-end;
                margin-left: auto;
            }

            .chat-control-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 4px 6px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 10px;
                min-width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chat-control-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.05);
            }

            .clear-history-btn:hover {
                background: rgba(255,100,100,0.3);
            }

            .open-tab-btn:hover {
                background: rgba(255,255,255,0.4);
                transform: scale(1.05);
            }

            .ai-chat-content {
                flex: 1;
                display: flex;
                align-items: stretch;
                height: calc(100% - 65px);
                flex-direction: column;
                overflow: hidden;
                min-height: 0;
                position: relative;
                box-sizing: border-box;
            }

            .custom-api-interface {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                min-height: 0;
                box-sizing: border-box;
                position: relative;
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
                background: #f8f9fa;
                min-height: 0;
                box-sizing: border-box;
            }

            .chat-message {
                margin-bottom: 12px;
                padding: 10px 12px;
                border-radius: 12px;
                max-width: 80%;
                word-wrap: break-word;
                line-height: 1.4;
            }

            .user-message {
                background: #4285f4;
                color: white;
                margin-left: auto;
                text-align: right;
                border-bottom-right-radius: 4px;
            }

            .assistant-message {
                background: white;
                border: 1px solid #e0e0e0;
                margin-right: auto;
                color: #333;
                border-bottom-left-radius: 4px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }

            .system-message {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                margin: 0 0 10px 0;
                max-width: 100%;
                font-size: 11px;
                border-radius: 8px;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .system-message-header {
                padding: 6px 10px;
                background: #e9ecef;
                border-bottom: 1px solid #dee2e6;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                user-select: none;
                transition: background-color 0.2s ease;
            }

            .system-message-header:hover {
                background: #dee2e6;
            }

            .system-message-header i.fas.fa-robot {
                margin-right: 6px;
                color: #6c757d;
            }

            .system-message-header strong {
                flex: 1;
                color: #6c757d;
                font-weight: 600;
                font-size: 10px;
            }

            .system-chevron {
                transition: transform 0.3s ease;
                color: #6c757d;
                font-size: 8px;
            }

            .system-message-content {
                padding: 8px 10px;
                line-height: 1.3;
                color: #6c757d;
                background: #f8f9fa;
                white-space: pre-wrap;
                word-wrap: break-word;
                transition: all 0.3s ease;
                font-size: 10px;
                max-height: 100px;
                overflow-y: auto;
            }

            .system-message.collapsed {
                margin-bottom: 5px;
            }

            .system-message.collapsed .system-message-content {
                display: none;
            }

            .system-message.collapsed .system-chevron {
                transform: rotate(-90deg);
            }

            .welcome-message {
                background: #e8f4fd;
                border: 1px solid #b3d9ff;
                margin: 0 0 15px 0;
                max-width: 100%;
                padding: 12px;
                border-radius: 8px;
                text-align: center;
                color: #0c5aa6;
            }

            .message-content {
                margin-bottom: 5px;
            }

            .message-time {
                font-size: 10px;
                opacity: 0.6;
                margin-top: 4px;
                font-style: italic;
            }

            .chat-input-container {
                padding: 12px;
                background: white;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 8px;
                align-items: flex-end;
                flex-shrink: 0;
                box-sizing: border-box;
            }

            .chat-input-container textarea {
                flex: 1;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                padding: 10px 12px;
                resize: none;
                font-family: inherit;
                font-size: 14px;
                transition: border-color 0.2s ease;
                max-height: 80px;
                min-height: 40px;
            }

            .chat-input-container textarea:focus {
                outline: none;
                border-color: #4285f4;
            }

            .send-btn {
                background: #4285f4;
                border: none;
                color: white;
                padding: 10px 12px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                min-width: 44px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .send-btn:hover {
                background: #3367d6;
                transform: scale(1.05);
            }

            .send-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
            }

            .api-status {
                padding: 6px 12px;
                background: #f8f9fa;
                border-top: 1px solid #e0e0e0;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                flex-shrink: 0;
                box-sizing: border-box;
                color: #6c757d;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .status-indicator.connected {
                background: #34a853;
            }

            .status-indicator.sending {
                background: #fbbc04;
                animation: pulse 1s infinite;
            }

            .status-indicator.error {
                background: #ea4335;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .api-config-notice {
                padding: 20px;
                text-align: center;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                overflow-y: auto;
                box-sizing: border-box;
            }

            .api-config-notice h3 {
                color: #4285f4;
                margin-bottom: 15px;
            }

            .api-setup-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                text-align: left;
            }

            .api-setup-info h4 {
                margin-bottom: 10px;
                color: #333;
            }

            .api-setup-info ul {
                margin: 0;
                padding-left: 20px;
            }

            .api-setup-info li {
                margin-bottom: 8px;
                line-height: 1.4;
            }

            .api-warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 12px;
                margin-top: 15px;
                font-size: 13px;
                line-height: 1.4;
                color: #856404;
            }

            .api-warning strong {
                color: #d32f2f;
            }

            .config-button {
                background: #4285f4;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                margin-top: 15px;
            }

            .config-button:hover {
                background: #3367d6;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize the AI chat popup
    async function initAIChatPopup() {
        if (isPopupVisible) return;

        await loadAIChatSettings();
        addAIChatStyles();

        const chatPopup = await createAIChatPopup();
        document.body.appendChild(chatPopup);
        isPopupVisible = true;

        // Show/hide based on minimized state
        if (!isMinimized) {
            const chatFrame = chatPopup.querySelector('.ai-chat-frame');
            chatFrame.style.display = 'block';
        }
    }

    // Update popup when settings change
    async function updateChatPopup() {
        const existingPopup = document.querySelector('#ai-chat-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        if (isPopupVisible) {
            await initAIChatPopup();
        }
    }

    // Export functions for use in menuGen.js
    window.aiChatPopup = {
        init: initAIChatPopup,
        update: updateChatPopup,
        setApiKey: (key) => {
            apiKey = key;
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
        getCurrentApiKey: () => apiKey,
        getCurrentSystemInstructions: () => systemInstructions,
        getDefaultSystemInstructions: () => DEFAULT_SYSTEM_INSTRUCTIONS,
        getChatHistory: () => chatHistory,
        clearChatHistory: async () => {
            await clearChatHistory();
            updateChatPopup();
        },
        exportChatHistory: () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatHistory, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `ucursednt-chat-history-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
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
