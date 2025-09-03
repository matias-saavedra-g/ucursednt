// aipopup.js - Standalone AI Chat Page for UCursitos Extension

// Chat functionality for standalone page
let apiKey = '';
let chatHistory = [];
let systemInstructions = '';
let systemMessageCollapsed = true;
let currentChatId = null;
let chatsHistory = [];
let explorerVisible = true;

// Default system instructions
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

// Fallback if extensionUtils.js is not loaded
if (typeof isExtensionContextValid === 'undefined') {
    window.isExtensionContextValid = function() {
        try {
            return chrome.runtime && chrome.runtime.id;
        } catch (error) {
            return false;
        }
    };
}

// Use utility functions from extensionUtils.js if available, otherwise create fallbacks
const { safeChromeStorageGet, safeChromeStorageSet, isExtensionContextValid: contextCheck } = window.extensionUtils || {};

// Fallback functions if extensionUtils is not available
const safeChromeStorageGetFn = safeChromeStorageGet || ((key) => new Promise(resolve => {
    try {
        chrome.storage.sync.get([key], result => resolve(result[key] || null));
    } catch (error) {
        console.error('Error accessing chrome.storage.sync:', error);
        resolve(null);
    }
}));

const safeChromeStorageSetFn = safeChromeStorageSet || ((key, value) => new Promise(resolve => {
    try {
        chrome.storage.sync.set({ [key]: value }, resolve);
    } catch (error) {
        console.error('Error setting chrome.storage.sync:', error);
        resolve();
    }
}));

const safeChromeLocalGet = (key) => new Promise(resolve => {
    try {
        if (!chrome || !chrome.storage || !chrome.storage.sync) {
            console.error('Chrome storage local API not available');
            resolve(null);
            return;
        }
        chrome.storage.sync.get([key], result => {
            if (chrome.runtime.lastError) {
                console.error('Chrome storage local get error:', chrome.runtime.lastError);
                resolve(null);
            } else {
                resolve(result[key] || null);
            }
        });
    } catch (error) {
        console.error('Error accessing chrome.storage.sync:', error);
        resolve(null);
    }
});

const safeChromeLocalSet = (key, value) => new Promise(resolve => {
    try {
        if (!chrome || !chrome.storage || !chrome.storage.sync) {
            console.error('Chrome storage local API not available');
            resolve();
            return;
        }
        chrome.storage.sync.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                console.error('Chrome storage local set error:', chrome.runtime.lastError);
            }
            resolve();
        });
    } catch (error) {
        console.error('Error setting chrome.storage.sync:', error);
        resolve();
    }
});

const safeChromeLocalRemove = (key) => new Promise(resolve => {
    try {
        if (!chrome || !chrome.storage || !chrome.storage.sync) {
            console.error('Chrome storage local API not available');
            resolve();
            return;
        }
        chrome.storage.sync.remove([key], () => {
            if (chrome.runtime.lastError) {
                console.error('Chrome storage local remove error:', chrome.runtime.lastError);
            }
            resolve();
        });
    } catch (error) {
        console.error('Error removing from chrome.storage.sync:', error);
        resolve();
    }
});

// Load settings and chat history
async function loadChatData() {
    try {
        console.log('Loading chat data...');
        console.log('extensionUtils available:', !!window.extensionUtils);
        
        // Load settings
        console.log('Loading settings...');
        const settings = await safeChromeStorageGetFn('aiChatSettings') || {};
        console.log('Settings loaded:', settings);
        
        apiKey = settings.apiKey || '';
        systemInstructions = settings.systemInstructions || DEFAULT_SYSTEM_INSTRUCTIONS;
        systemMessageCollapsed = settings.systemMessageCollapsed !== false;

        // Load chat history
        console.log('Loading chat history...');
        chatHistory = await safeChromeLocalGet('aiChatHistory') || [];
        console.log('Chat history loaded:', chatHistory.length, 'messages');

        // Update UI
        console.log('Updating UI...');
        updateSystemMessage();
        loadMessages();
        updateAPIStatus();
        
        console.log('Chat data loaded successfully');

    } catch (error) {
        console.error('Error loading chat data:', error);
        showError('Error al cargar los datos del chat: ' + error.message);
    }
}

// Update system message content and state
function updateSystemMessage() {
    const content = document.getElementById('system-message-content');
    const systemMessage = document.getElementById('system-message');
    const chevron = document.getElementById('system-chevron');

    if (content) {
        content.textContent = systemInstructions;
    }

    if (systemMessage && chevron) {
        if (systemMessageCollapsed) {
            systemMessage.classList.add('collapsed');
            chevron.style.transform = 'rotate(-90deg)';
        } else {
            systemMessage.classList.remove('collapsed');
            chevron.style.transform = 'rotate(0deg)';
        }
    }
}

// Toggle system message visibility
function toggleSystemMessage() {
    const content = document.getElementById('system-message-content');
    const chevron = document.getElementById('system-chevron');
    const systemMessage = document.getElementById('system-message');
    
    if (content && chevron && systemMessage) {
        const isCollapsed = systemMessage.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            systemMessage.classList.remove('collapsed');
            chevron.style.transform = 'rotate(0deg)';
            systemMessageCollapsed = false;
        } else {
            // Collapse
            systemMessage.classList.add('collapsed');
            chevron.style.transform = 'rotate(-90deg)';
            systemMessageCollapsed = true;
        }
    }
}

// Load and display messages
function loadMessages() {
    const messagesContainer = document.getElementById('chat-messages');

    if (!messagesContainer) return;

    if (!apiKey) {
        showAPIConfigNotice(messagesContainer);
        return;
    }

    messagesContainer.innerHTML = '';

    if (chatHistory.length === 0) {
        // Show welcome message
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
            displayMessage(message.role, message.content, message.timestamp);
        });
    }
    
    // Update explorer after loading messages
    updateExplorerMinimap();
}

// Render chat messages (used by chat management system)
function renderChatMessages() {
    loadMessages();
}

// Show API configuration notice
function showAPIConfigNotice(container) {
    container.innerHTML = `
        <div class="api-config-notice">
            <h3>🤖 Configuración de API requerida</h3>
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
            <button class="config-button" id="config-btn-inline">
                <i class="fas fa-cog"></i> Ir a Configuración
            </button>
        </div>
    `;

    // Add event listener for the config button
    const configBtn = container.querySelector('#config-btn-inline');
    if (configBtn) {
        configBtn.addEventListener('click', openExtensionSettings);
    }
}

// Display a message in the chat
function displayMessage(role, content, timestamp) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}-message`;
    
    const messageTime = new Date(timestamp).toLocaleTimeString();
    messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-time">${messageTime}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Update explorer minimap when new message is added
    updateExplorerMinimap();
}

// Send message to Gemini API
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-message');
    
    if (!input || !sendBtn) return;
    
    const message = input.value.trim();

    if (!message || !apiKey) return;

    // Disable input
    sendBtn.disabled = true;
    updateStatus('sending', 'Enviando mensaje...');

    // Display user message
    const timestamp = Date.now();
    displayMessage('user', message, timestamp);

    // Add to history
    chatHistory.push({
        role: 'user',
        content: message,
        timestamp: timestamp
    });

    // Clear input
    input.value = '';

    try {
        // Prepare messages for API
        const messages = [
            {
                role: 'user',
                parts: [{ text: systemInstructions }]
            },
            ...chatHistory.slice(-10).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }))
        ];

        // Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: messages
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';

        // Display AI response
        const aiTimestamp = Date.now();
        displayMessage('assistant', aiResponse, aiTimestamp);

        // Add to history
        chatHistory.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: aiTimestamp
        });

        // Save history
        await safeChromeLocalSet('aiChatHistory', chatHistory);

        updateStatus('connected', 'Conectado a Gemini Pro');

    } catch (error) {
        console.error('Error sending message:', error);
        updateStatus('error', 'Error de conexión');
        
        // Display error message
        displayMessage('assistant', 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.', Date.now());
    } finally {
        sendBtn.disabled = false;
    }
}

// Update API status
function updateAPIStatus() {
    if (apiKey) {
        updateStatus('connected', 'Conectado a Gemini Pro');
    } else {
        updateStatus('error', 'API key no configurada');
    }
}

// Update status indicator
function updateStatus(status, text) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    if (indicator) {
        indicator.className = `status-indicator ${status}`;
    }
    
    if (statusText) {
        statusText.textContent = text;
    }
}

// Clear chat history
async function clearChatHistory() {
    const confirmed = confirm(
        '¿Estás seguro de que quieres borrar todo el historial del chat?\n\n' +
        'Esta acción no se puede deshacer y se perderán todas las conversaciones anteriores.'
    );
    
    if (confirmed) {
        try {
            chatHistory = [];
            await safeChromeLocalRemove('aiChatHistory');
            loadMessages();
        } catch (error) {
            console.error('Error clearing chat history:', error);
            alert('Error al borrar el historial. Por favor, inténtalo de nuevo.');
        }
    }
}

// Export chat history
function exportChatHistory() {
    if (chatHistory.length === 0) {
        alert('No hay historial para exportar.');
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatHistory, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ucursednt-chat-history-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Open extension settings
function openExtensionSettings() {
    try {
        if (chrome.tabs && chrome.tabs.create) {
            chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
        } else {
            // Fallback for when tabs API is not available
            window.open(chrome.runtime.getURL('popup.html'), '_blank');
        }
    } catch (error) {
        console.error('Error opening extension settings:', error);
        // Final fallback
        window.open('/ucursednt/', '_blank');
    }
}

// Show error message
function showError(message) {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="api-config-notice">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize the page
function initializePage() {
    // Wait a bit for extensionUtils to load
    setTimeout(() => {
        loadChatData();
        loadChatsHistory();
    }, 100);

    // Send button
    const sendBtn = document.getElementById('send-message');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Enter key in textarea
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Header buttons
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewChat);
    }

    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllChats);
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportChatHistory);
    }

    // Explorer toggle
    const explorerToggle = document.getElementById('explorer-toggle');
    if (explorerToggle) {
        explorerToggle.addEventListener('click', toggleExplorer);
    }

    // System message toggle
    const systemHeader = document.querySelector('.system-message-header');
    if (systemHeader) {
        systemHeader.addEventListener('click', toggleSystemMessage);
    }

    // Initialize explorer minimap scrolling
    initializeExplorerScrolling();
}

// Chat History Management Functions
function generateChatId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createNewChat() {
    const chatId = generateChatId();
    const chatData = {
        id: chatId,
        title: 'Nuevo Chat',
        date: new Date().toISOString(),
        messages: [],
        preview: 'Chat sin mensajes'
    };
    
    chatsHistory.unshift(chatData);
    saveChatsHistory();
    switchToChat(chatId);
    renderChatList();
}

function switchToChat(chatId) {
    // Save current chat if it exists
    if (currentChatId) {
        const currentChat = chatsHistory.find(chat => chat.id === currentChatId);
        if (currentChat) {
            currentChat.messages = chatHistory;
            currentChat.preview = chatHistory.length > 0 ? 
                (chatHistory[chatHistory.length - 1].content.substring(0, 100) + '...') : 
                'Chat sin mensajes';
            if (chatHistory.length > 0 && currentChat.title === 'Nuevo Chat') {
                currentChat.title = chatHistory[0].content.substring(0, 30) + '...';
            }
        }
    }
    
    // Switch to new chat
    currentChatId = chatId;
    const targetChat = chatsHistory.find(chat => chat.id === chatId);
    if (targetChat) {
        chatHistory = targetChat.messages || [];
        renderChatMessages();
        renderChatList();
        updateExplorerMinimap();
    }
    
    saveChatsHistory();
}

function deleteChat(chatId, event) {
    event.stopPropagation();
    
    if (confirm('¿Estás seguro de que quieres eliminar este chat?')) {
        chatsHistory = chatsHistory.filter(chat => chat.id !== chatId);
        
        if (currentChatId === chatId) {
            if (chatsHistory.length > 0) {
                switchToChat(chatsHistory[0].id);
            } else {
                createNewChat();
            }
        }
        
        saveChatsHistory();
        renderChatList();
    }
}

function renameChat(chatId, event) {
    event.stopPropagation();
    
    const chat = chatsHistory.find(c => c.id === chatId);
    if (!chat) return;
    
    const newTitle = prompt('Nuevo nombre para el chat:', chat.title);
    if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        saveChatsHistory();
        renderChatList();
    }
}

function loadChatsHistory() {
    safeChromeLocalGet('ucursitos_chats_history').then(data => {
        if (data && Array.isArray(data)) {
            chatsHistory = data;
            if (chatsHistory.length === 0) {
                createNewChat();
            } else {
                currentChatId = chatsHistory[0].id;
                switchToChat(currentChatId);
            }
        } else {
            createNewChat();
        }
        renderChatList();
    }).catch(error => {
        console.error('Error loading chats history:', error);
        createNewChat();
    });
}

function saveChatsHistory() {
    safeChromeLocalSet('ucursitos_chats_history', chatsHistory).then(() => {
        updateChatCount();
    }).catch(error => {
        console.error('Error saving chats history:', error);
    });
}

function renderChatList() {
    const chatList = document.getElementById('chat-list');
    if (!chatList) return;
    
    chatList.innerHTML = '';
    
    chatsHistory.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.addEventListener('click', () => switchToChat(chat.id));
        
        const formattedDate = new Date(chat.date).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        chatItem.innerHTML = `
            <div class="chat-item-header">
                <div class="chat-item-title" title="${chat.title}">${chat.title}</div>
                <div class="chat-item-date">${formattedDate}</div>
            </div>
            <div class="chat-item-preview">${chat.preview}</div>
            <div class="chat-item-actions">
                <button class="chat-action-btn rename-btn" title="Renombrar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="chat-action-btn delete-btn" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners for the action buttons
        const renameBtn = chatItem.querySelector('.rename-btn');
        const deleteBtn = chatItem.querySelector('.delete-btn');
        
        if (renameBtn) {
            renameBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                renameChat(chat.id, event);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteChat(chat.id, event);
            });
        }
        
        chatList.appendChild(chatItem);
    });
}

function updateChatCount() {
    const chatCount = document.getElementById('chat-count');
    if (chatCount) {
        const count = chatsHistory.length;
        chatCount.textContent = `${count} chat${count !== 1 ? 's' : ''}`;
    }
}

function clearAllChats() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los chats? Esta acción no se puede deshacer.')) {
        chatsHistory = [];
        chatHistory = [];
        currentChatId = null;
        saveChatsHistory();
        createNewChat();
        renderChatList();
        renderChatMessages();
    }
}

// Explorer Functions
function toggleExplorer() {
    const explorer = document.querySelector('.chat-explorer');
    const toggleBtn = document.getElementById('explorer-toggle');
    
    if (explorer && toggleBtn) {
        explorerVisible = !explorerVisible;
        explorer.style.display = explorerVisible ? 'flex' : 'none';
        toggleBtn.innerHTML = explorerVisible ? 
            '<i class="fas fa-times"></i>' : 
            '<i class="fas fa-map"></i>';
        toggleBtn.title = explorerVisible ? 'Ocultar explorador' : 'Mostrar explorador';
    }
}

function updateExplorerMinimap() {
    const minimap = document.getElementById('explorer-minimap');
    if (!minimap || !explorerVisible) return;
    
    minimap.innerHTML = '';
    
    chatHistory.forEach((message, index) => {
        const minimapItem = document.createElement('div');
        minimapItem.className = `minimap-item ${message.role}`;
        minimapItem.textContent = message.content.substring(0, 50) + '...';
        minimapItem.addEventListener('click', () => scrollToMessage(index));
        minimap.appendChild(minimapItem);
    });
    
    // Add viewport indicator
    const viewport = document.createElement('div');
    viewport.className = 'minimap-viewport';
    viewport.id = 'minimap-viewport';
    minimap.appendChild(viewport);
    
    updateMinimapViewport();
}

function scrollToMessage(messageIndex) {
    const chatMessages = document.getElementById('chat-messages');
    const messages = chatMessages.querySelectorAll('.chat-message');
    
    if (messages[messageIndex]) {
        messages[messageIndex].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

function updateMinimapViewport() {
    const viewport = document.getElementById('minimap-viewport');
    const chatMessages = document.getElementById('chat-messages');
    const minimap = document.getElementById('explorer-minimap');
    
    if (!viewport || !chatMessages || !minimap) return;
    
    const chatRect = chatMessages.getBoundingClientRect();
    const chatScrollTop = chatMessages.scrollTop;
    const chatScrollHeight = chatMessages.scrollHeight;
    const chatClientHeight = chatMessages.clientHeight;
    
    if (chatScrollHeight <= chatClientHeight) {
        viewport.style.display = 'none';
        return;
    }
    
    viewport.style.display = 'block';
    
    const minimapHeight = minimap.clientHeight;
    const viewportHeight = (chatClientHeight / chatScrollHeight) * minimapHeight;
    const viewportTop = (chatScrollTop / chatScrollHeight) * minimapHeight;
    
    viewport.style.height = Math.max(viewportHeight, 20) + 'px';
    viewport.style.top = viewportTop + 'px';
}

function initializeExplorerScrolling() {
    const chatMessages = document.getElementById('chat-messages');
    const minimap = document.getElementById('explorer-minimap');
    
    if (chatMessages) {
        chatMessages.addEventListener('scroll', updateMinimapViewport);
    }
    
    if (minimap) {
        let isDragging = false;
        
        minimap.addEventListener('mousedown', (e) => {
            if (e.target.id === 'minimap-viewport') {
                isDragging = true;
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && chatMessages) {
                const minimapRect = minimap.getBoundingClientRect();
                const relativeY = e.clientY - minimapRect.top;
                const scrollRatio = relativeY / minimap.clientHeight;
                const targetScroll = scrollRatio * chatMessages.scrollHeight;
                
                chatMessages.scrollTop = Math.max(0, Math.min(targetScroll, 
                    chatMessages.scrollHeight - chatMessages.clientHeight));
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Click to scroll
        minimap.addEventListener('click', (e) => {
            if (e.target !== document.getElementById('minimap-viewport')) {
                const minimapRect = minimap.getBoundingClientRect();
                const relativeY = e.clientY - minimapRect.top;
                const scrollRatio = relativeY / minimap.clientHeight;
                const targetScroll = scrollRatio * chatMessages.scrollHeight;
                
                chatMessages.scrollTop = Math.max(0, Math.min(targetScroll, 
                    chatMessages.scrollHeight - chatMessages.clientHeight));
            }
        });
    }
}

// Override the original renderChatMessages to also update explorer
const originalRenderChatMessages = typeof renderChatMessages !== 'undefined' ? renderChatMessages : null;

// Event listeners
document.addEventListener('DOMContentLoaded', initializePage);

// Make functions globally available
window.toggleSystemMessage = toggleSystemMessage;
window.openExtensionSettings = openExtensionSettings;
