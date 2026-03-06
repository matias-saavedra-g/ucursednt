// js/sidepanel.js — UCursedn't AI Side Panel
// Architecture: Amnesia-Proof MV3 | Gemini Cloud + Gemini Nano (Local Hybrid)
// MT Identity | Matías Ignacio – Universidad de Chile

'use strict';

// ── DEFAULT SYSTEM INSTRUCTIONS ─────────────────────────────────────
const DEFAULT_SYSTEM_INSTRUCTIONS = `System Prompt: Asistente Virtual de U-Cursos

1. PERSONA
Eres "Asistente U-Cursos", un asistente virtual experto integrado en la plataforma U-Cursos de la Universidad de Chile. Tu propósito principal es ayudar a estudiantes y académicos a navegar y utilizar la plataforma de manera eficiente, resolviendo sus dudas y facilitando su experiencia académica. Eres un guía amigable, conocedor y siempre dispuesto a ayudar. Tu identidad está ligada exclusivamente a la Universidad de Chile y sus procesos internos gestionados a través de U-Cursos.

2. TAREA
Tu tarea es responder preguntas y proporcionar orientación sobre las funcionalidades y el contenido de la plataforma U-Cursos. Debes ser capaz de:
- Responder preguntas directas: Contestar dudas específicas sobre cómo usar la plataforma.
- Proporcionar guías paso a paso: Ofrecer instrucciones claras y secuenciales.
- Resumir información: Sintetizar el contenido de anuncios, foros o materiales.
- Localizar información: Ayudar a los usuarios a encontrar secciones dentro de sus cursos.
- Resolver problemas comunes: Ofrecer soluciones a problemas frecuentes.

Límites:
- No inventes información. Si no tienes la respuesta, indícalo claramente.
- Privacidad: No tienes acceso a información personal o sensible de los usuarios.
- Mantente en el tema: Limita tus respuestas al ecosistema de U-Cursos y la vida académica en la Universidad de Chile.

3. CONTEXTO
- Plataforma: U-Cursos, campus virtual de la Universidad de Chile (Centro Tecnológico Ucampus).
- Audiencia: Estudiantes y académicos de la Universidad de Chile.
- Funcionalidades Clave: Sitios de Cursos, Materiales Educativos, Foros, Correo, Tareas, Notas, Calendario, App móvil, Perfil Personal.

4. FORMATO
- Claridad y Concisión. Usa listas para desglosar pasos.
- Usa **negrita** para resaltar acciones clave o secciones.
- Responde en español de Chile (usa "ramo", "nota", "profe").

5. TONO
- Servicial, profesional y amable. Seguro pero humilde cuando no conoces la respuesta.
- Proactivo: sugiere funcionalidades relacionadas cuando sea pertinente.`;

// ── MODULE STATE ─────────────────────────────────────────────────────
// NOTE: These are rehydrated from storage on every init() call.
// Never rely on these surviving a Service Worker restart.
let apiKey            = '';
let systemInstructions = DEFAULT_SYSTEM_INSTRUCTIONS;
let systemCollapsed   = true;
let chatHistory       = [];   // messages for the current open chat
let chatsHistory      = [];   // all saved chats metadata + messages
let currentChatId     = null;
let nanoAvailable     = false;

// ── STORAGE FACADE ───────────────────────────────────────────────────
//   Settings  → chrome.storage.sync   (synced, 8KB/item limit)
//   Chat data → chrome.storage.local  (local, ~unlimited quota)
//   UI state  → chrome.storage.session (ephemeral per browser session)
const store = {
    getSetting : key => chrome.storage.sync.get([key]).then(r => r[key] ?? null),
    setSetting : (key, val) => chrome.storage.sync.set({ [key]: val }),
    getLocal   : key => chrome.storage.local.get([key]).then(r => r[key] ?? null),
    setLocal   : (key, val) => chrome.storage.local.set({ [key]: val }),
    removeLocal: key => chrome.storage.local.remove([key]),
    getSession : key => chrome.storage.session.get([key]).then(r => r[key] ?? null),
    setSession : (key, val) => chrome.storage.session.set({ [key]: val }),
};

// ── AMNESIA-PROOF INIT ───────────────────────────────────────────────
// Rehydrates all state from persistent storage every time the panel opens.
// This handles Service Worker termination transparently.
async function init() {
    try {
        // 1. Load user settings (sync storage)
        const settings = await store.getSetting('aiChatSettings') ?? {};
        apiKey             = settings.apiKey ?? '';
        systemInstructions = settings.systemInstructions ?? DEFAULT_SYSTEM_INSTRUCTIONS;
        systemCollapsed    = settings.systemMessageCollapsed !== false;

        // 2. Load all chats from local storage
        chatsHistory = await store.getLocal('ucursitos_chats_history') ?? [];

        // 3. Restore last active chat from session storage
        //    (survives page navigations but resets on browser restart)
        const session = await store.getSession('sidepanelState') ?? {};
        currentChatId = session.currentChatId ?? null;

        // 4. Validate and resolve active chat
        const validChat = chatsHistory.find(c => c.id === currentChatId);
        if (!validChat) {
            if (chatsHistory.length > 0) {
                currentChatId = chatsHistory[0].id;
                chatHistory   = chatsHistory[0].messages ?? [];
            } else {
                // First launch: create an initial chat
                await createNewChat(/* silent */ true);
                return; // createNewChat calls renderAll
            }
        } else {
            chatHistory = validChat.messages ?? [];
        }

        // 5. Check for Gemini Nano availability (Chrome Prompt API)
        detectNanoAvailability();

        // 6. Render everything
        renderAll();

    } catch (err) {
        console.error('[sidepanel] init error:', err);
        setStatus('error', 'Error al iniciar');
    }
}

// ── CHROME PROMPT API (GEMINI NANO) ─────────────────────────────────
async function detectNanoAvailability() {
    try {
        if (!window.ai?.languageModel) return;
        const caps = await window.ai.languageModel.capabilities();
        nanoAvailable = caps.available === 'readily' || caps.available === 'after-download';
        updateInferencePill();
    } catch {
        nanoAvailable = false;
    }
}

// Heuristic: route short, simple queries to Nano; complex ones to Cloud.
function isSimpleQuery(text) {
    if (text.length > 200) return false;
    const complexTokens = [
        'explica', 'analiza', 'compara', 'razón', 'error', 'código',
        'calcula', 'resuelve', 'describe', 'paso a paso'
    ];
    return !complexTokens.some(t => text.toLowerCase().includes(t));
}

// ── INFERENCE ROUTING ────────────────────────────────────────────────
async function runInference(userMessage) {
    if (nanoAvailable && isSimpleQuery(userMessage)) {
        try {
            const reply = await runNanoInference(userMessage);
            updateInferencePill('nano');
            return reply;
        } catch (nanoErr) {
            console.warn('[sidepanel] Nano failed, falling back to Cloud:', nanoErr);
        }
    }
    updateInferencePill('cloud');
    return runCloudInference(userMessage);
}

async function runNanoInference(userMessage) {
    const session = await window.ai.languageModel.create({
        systemPrompt: systemInstructions,
        temperature: 0.7,
    });
    // Pass recent context as a single formatted string for Nano
    const ctx = chatHistory.slice(-6)
        .map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
        .join('\n');
    const prompt = ctx ? `${ctx}\nUsuario: ${userMessage}` : userMessage;
    const result = await session.prompt(prompt);
    session.destroy();
    return result;
}

async function runCloudInference(userMessage) {
    // Send full conversation history for multi-turn context.
    // Background.js maps role: 'assistant' → 'model' for the Gemini API.
    const messages = [
        ...chatHistory.slice(-20).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
    ];
    const response = await chrome.runtime.sendMessage({
        action: 'generateContent',
        apiKey,
        messages,
        systemInstruction: systemInstructions,
    });
    if (!response?.success) throw new Error(response?.error ?? 'Unknown API error');
    return response.content;
}

// ── SEND MESSAGE ─────────────────────────────────────────────────────
async function sendMessage() {
    const input   = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    if (!input || !sendBtn) return;

    const text = input.value.trim();
    if (!text || !apiKey) return;

    // Lock UI during inference
    input.disabled  = true;
    sendBtn.disabled = true;
    setStatus('sending', 'Enviando…');

    const timestamp = Date.now();

    // Optimistically render the user bubble
    appendMessageBubble('user', text, timestamp);

    // Persist locally before awaiting response
    chatHistory.push({ role: 'user', content: text, timestamp });
    await saveCurrentChat();

    input.value = '';
    updateCharCount();

    const typingEl = appendTypingIndicator();

    try {
        const reply = await runInference(text);
        typingEl.remove();

        const replyTs = Date.now();
        // Render assistant reply with Markdown formatting
        appendMessageBubble('assistant', formatMarkdown(reply), replyTs);

        chatHistory.push({ role: 'assistant', content: reply, timestamp: replyTs });
        await saveCurrentChat();
        setStatus('connected', 'Listo');

    } catch (err) {
        typingEl.remove();
        appendErrorBubble(`Error: ${escapeHtml(err.message)}`);
        setStatus('error', 'Error de API');
        console.error('[sidepanel] sendMessage error:', err);
    } finally {
        input.disabled   = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

// ── CHAT MANAGEMENT ──────────────────────────────────────────────────
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function createNewChat(silent = false) {
    if (!silent && currentChatId) await saveCurrentChat();

    const id   = generateId();
    const chat = {
        id,
        title  : 'Nuevo Chat',
        date   : new Date().toISOString(),
        messages: [],
        preview: 'Chat vacío',
    };

    chatsHistory.unshift(chat);
    currentChatId = id;
    chatHistory   = [];

    await store.setLocal('ucursitos_chats_history', chatsHistory);
    await store.setSession('sidepanelState', { currentChatId });
    if (!silent) closeDrawer();
    renderAll();
}

async function switchToChat(chatId) {
    if (chatId === currentChatId) { closeDrawer(); return; }
    await saveCurrentChat();

    currentChatId = chatId;
    const target  = chatsHistory.find(c => c.id === chatId);
    chatHistory   = target?.messages ?? [];

    await store.setSession('sidepanelState', { currentChatId });
    renderMessages();
    renderChatList();
    closeDrawer();
}

async function deleteChat(chatId, event) {
    event.stopPropagation();
    if (!confirm('¿Eliminar este chat? Esta acción no se puede deshacer.')) return;

    chatsHistory = chatsHistory.filter(c => c.id !== chatId);
    await store.setLocal('ucursitos_chats_history', chatsHistory);

    if (currentChatId === chatId) {
        if (chatsHistory.length > 0) {
            await switchToChat(chatsHistory[0].id);
        } else {
            await createNewChat(true);
        }
        return;
    }
    renderChatList();
}

async function renameChat(chatId, event) {
    event.stopPropagation();
    const chat = chatsHistory.find(c => c.id === chatId);
    if (!chat) return;
    const newTitle = prompt('Nuevo nombre para el chat:', chat.title);
    if (!newTitle?.trim()) return;
    chat.title = newTitle.trim();
    await store.setLocal('ucursitos_chats_history', chatsHistory);
    renderChatList();
}

async function saveCurrentChat() {
    if (!currentChatId) return;
    const chat = chatsHistory.find(c => c.id === currentChatId);
    if (!chat) return;

    chat.messages = [...chatHistory];
    chat.date     = new Date().toISOString();

    if (chatHistory.length > 0) {
        const last = chatHistory[chatHistory.length - 1];
        // Auto-title from the first user message
        if (chat.title === 'Nuevo Chat') {
            const firstUser = chatHistory.find(m => m.role === 'user');
            if (firstUser) {
                chat.title = firstUser.content.slice(0, 42) +
                    (firstUser.content.length > 42 ? '…' : '');
            }
        }
        chat.preview = last.content.slice(0, 60) +
            (last.content.length > 60 ? '…' : '');
    }

    await store.setLocal('ucursitos_chats_history', chatsHistory);
}

async function clearCurrentChat() {
    if (!confirm('¿Borrar todos los mensajes de este chat?')) return;
    chatHistory = [];
    await saveCurrentChat();
    renderMessages();
}

function exportChat() {
    if (chatHistory.length === 0) { alert('No hay mensajes para exportar.'); return; }
    const blob = new Blob([JSON.stringify(chatHistory, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ucursednt-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ── RENDER ───────────────────────────────────────────────────────────
function renderAll() {
    renderSystemMessage();
    renderChatList();
    renderMessages();
    updateAPIStatus();
    updateInferencePill();
    updateChatBadge();
}

function renderSystemMessage() {
    const body    = document.getElementById('system-body');
    const sys     = document.getElementById('sp-system');
    const chevron = document.getElementById('system-chevron');
    const toggle  = document.getElementById('system-toggle');

    if (body) body.textContent = systemInstructions;

    if (sys) {
        sys.classList.toggle('collapsed', systemCollapsed);
    }
    if (chevron) {
        chevron.style.transform = systemCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    }
    if (toggle) {
        toggle.setAttribute('aria-expanded', String(!systemCollapsed));
    }
}

function renderChatList() {
    const list = document.getElementById('chat-list');
    if (!list) return;

    list.innerHTML = '';
    chatsHistory.forEach(chat => {
        const item = document.createElement('div');
        item.className = `sp-chat-item${chat.id === currentChatId ? ' sp-chat-active' : ''}`;
        item.setAttribute('role', 'listitem');
        item.innerHTML = `
          <div class="sp-chat-item-body">
            <div class="sp-chat-item-title">${escapeHtml(chat.title)}</div>
            <div class="sp-chat-item-preview">${escapeHtml(chat.preview ?? '')}</div>
          </div>
          <div class="sp-chat-item-actions" aria-label="Acciones">
            <button class="sp-chat-item-btn"
                    data-action="rename" data-id="${escapeHtml(chat.id)}"
                    title="Renombrar">
              <i class="fa-regular fa-pen" aria-hidden="true"></i>
            </button>
            <button class="sp-chat-item-btn sp-btn-danger"
                    data-action="delete" data-id="${escapeHtml(chat.id)}"
                    title="Eliminar">
              <i class="fa-regular fa-trash" aria-hidden="true"></i>
            </button>
          </div>
        `;

        item.addEventListener('click', e => {
            if (e.target.closest('[data-action]')) return;
            switchToChat(chat.id);
        });

        item.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', e => {
                const { action, id } = btn.dataset;
                if (action === 'rename') renameChat(id, e);
                if (action === 'delete') deleteChat(id, e);
            });
        });

        list.appendChild(item);
    });

    updateChatBadge();
}

function renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = '';

    if (!apiKey) {
        renderApiNotice(container);
        return;
    }

    if (chatHistory.length === 0) {
        container.innerHTML = `
          <div class="sp-welcome">
            <div class="sp-welcome-icon">✨</div>
            <h3>¡Hola! Soy UCursitos AI</h3>
            <p>Asistente virtual de U-Cursos, powered by Gemini.<br>¿En qué puedo ayudarte hoy?</p>
          </div>
        `;
        return;
    }

    chatHistory.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.role}-message`;
        div.innerHTML = `
          <div class="message-content">
            ${msg.role === 'assistant' ? formatMarkdown(msg.content) : escapeHtml(msg.content)}
          </div>
          <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        `;
        container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
}

function renderApiNotice(container) {
    container.innerHTML = `
      <div class="sp-api-notice">
        <h3>🔑 API Key requerida</h3>
        <p>Para usar el chat, configura tu API key de <strong>Google AI Studio</strong>.</p>
        <ul>
          <li>Ve a <a href="https://aistudio.google.com" target="_blank" rel="noopener">aistudio.google.com</a></li>
          <li>Inicia sesión y crea una nueva API key</li>
          <li>Pégala en Configuración de la extensión</li>
        </ul>
        <button class="sp-config-btn" id="open-settings-btn">
          <i class="fa-regular fa-cog" aria-hidden="true"></i> Abrir Configuración
        </button>
      </div>
    `;
    document.getElementById('open-settings-btn')
        ?.addEventListener('click', openSettings);
}

// ── DOM HELPERS ──────────────────────────────────────────────────────
function appendMessageBubble(role, content, timestamp) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    // Remove welcome screen if it's still showing
    container.querySelector('.sp-welcome')?.remove();

    const div = document.createElement('div');
    div.className = `chat-message ${role}-message`;
    div.innerHTML = `
      <div class="message-content">
        ${role === 'assistant' ? content : escapeHtml(content)}
      </div>
      <div class="message-time">${new Date(timestamp).toLocaleTimeString()}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const el = document.createElement('div');
    el.className = 'sp-typing';
    el.setAttribute('aria-label', 'Escribiendo…');
    el.innerHTML = `
      <div class="sp-typing-dot"></div>
      <div class="sp-typing-dot"></div>
      <div class="sp-typing-dot"></div>
    `;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
}

function appendErrorBubble(htmlMsg) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-message assistant-message';
    div.innerHTML = `
      <div class="message-content" style="color:var(--mt-danger)">${htmlMsg}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ── STATUS & INDICATORS ──────────────────────────────────────────────
function setStatus(state, text) {
    const dot   = document.getElementById('status-dot');
    const label = document.getElementById('status-text');
    if (dot)   dot.className = `sp-status-dot ${state}`;
    if (label) label.textContent = text;
}

function updateAPIStatus() {
    setStatus(apiKey ? 'connected' : 'error', apiKey ? 'Listo' : 'Sin API key');
}

function updateInferencePill(mode) {
    const pill = document.getElementById('inference-pill');
    const hint = document.getElementById('inference-hint');
    if (!pill) return;

    const useNano = mode === 'nano' || (nanoAvailable && mode !== 'cloud');
    pill.className = `sp-inference-pill${useNano ? ' nano' : ''}`;
    pill.innerHTML = useNano
        ? '<i class="fa-regular fa-microchip" aria-hidden="true"></i> Gemini Nano'
        : '<i class="fa-regular fa-cloud" aria-hidden="true"></i> Gemini Cloud';
    if (hint) hint.textContent = useNano ? 'Local · Sin internet' : 'gemini-2.5-flash';
}

function updateChatBadge() {
    const badge = document.getElementById('chat-badge');
    if (badge) badge.textContent = chatsHistory.length;
}

function updateCharCount() {
    const input   = document.getElementById('chat-input');
    const counter = document.getElementById('char-count');
    if (!input || !counter) return;
    const len = input.value.length;
    counter.textContent = `${len} / 4000`;
    counter.className = 'sp-char-count' +
        (len >= 4000 ? ' at-limit' : len >= 3500 ? ' near-limit' : '');
}

// ── DRAWER ───────────────────────────────────────────────────────────
function openDrawer() {
    document.getElementById('chat-drawer')?.classList.add('open');
    document.getElementById('drawer-overlay')?.classList.add('active');
    document.getElementById('drawer-overlay')?.removeAttribute('aria-hidden');
}

function closeDrawer() {
    document.getElementById('chat-drawer')?.classList.remove('open');
    document.getElementById('drawer-overlay')?.classList.remove('active');
    document.getElementById('drawer-overlay')?.setAttribute('aria-hidden', 'true');
}

function toggleDrawer() {
    document.getElementById('chat-drawer')?.classList.contains('open')
        ? closeDrawer() : openDrawer();
}

// ── SYSTEM MESSAGE TOGGLE ────────────────────────────────────────────
function toggleSystem() {
    const sys     = document.getElementById('sp-system');
    const chevron = document.getElementById('system-chevron');
    const toggle  = document.getElementById('system-toggle');
    if (!sys) return;

    systemCollapsed = !sys.classList.contains('collapsed');
    sys.classList.toggle('collapsed', systemCollapsed);
    if (chevron) chevron.style.transform = systemCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    if (toggle)  toggle.setAttribute('aria-expanded', String(!systemCollapsed));

    // Persist the preference without overwriting other settings
    store.getSetting('aiChatSettings').then(s => {
        store.setSetting('aiChatSettings', { ...(s ?? {}), systemMessageCollapsed: systemCollapsed });
    });
}

// ── SECURITY HELPERS ─────────────────────────────────────────────────
// escapeHtml prevents XSS when inserting any user- or API-sourced content
// into innerHTML. All user messages MUST go through this before rendering.
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

// Minimal, safe Markdown → HTML parser.
// Built on top of escapeHtml so no XSS vectors are introduced.
function formatMarkdown(text) {
    // First escape all HTML to neutralise any injected tags from the API response
    let safe = escapeHtml(text);

    // Block elements first
    // Code blocks: ```…```
    safe = safe.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
        `<pre style="background:var(--mt-gray-100);padding:8px;border-radius:6px;font-size:11px;overflow-x:auto;margin:4px 0"><code>${code.trimEnd()}</code></pre>`
    );
    // Bullet lists
    safe = safe.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    safe = safe.replace(/(<li>[\s\S]*?<\/li>)+/g, m => `<ul style="padding-left:16px;margin:4px 0">${m}</ul>`);
    // Numbered lists
    safe = safe.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Inline elements
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.+?)\*/g,     '<em>$1</em>');
    safe = safe.replace(/`([^`]+)`/g,     '<code>$1</code>');

    // Newlines → <br>
    safe = safe.replace(/\n/g, '<br>');

    return safe;
}

// ── SETTINGS ────────────────────────────────────────────────────────
function openSettings() {
    try {
        chrome.runtime.openOptionsPage();
    } catch {
        window.open(chrome.runtime.getURL('popup.html'), '_blank');
    }
}

// ── LIVE SETTINGS SYNC ───────────────────────────────────────────────
// Reacts immediately when the user updates settings in the popup,
// without requiring the side panel to be closed and reopened.
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.aiChatSettings) {
        const s = changes.aiChatSettings.newValue ?? {};
        apiKey             = s.apiKey ?? '';
        systemInstructions = s.systemInstructions ?? DEFAULT_SYSTEM_INSTRUCTIONS;
        renderSystemMessage();
        updateAPIStatus();
    }
});

// ── BOOT ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Header controls
    document.getElementById('new-chat-btn')
        ?.addEventListener('click', () => createNewChat(false));
    document.getElementById('chats-btn')
        ?.addEventListener('click', toggleDrawer);
    document.getElementById('close-drawer-btn')
        ?.addEventListener('click', closeDrawer);
    document.getElementById('drawer-overlay')
        ?.addEventListener('click', closeDrawer);
    document.getElementById('export-btn')
        ?.addEventListener('click', exportChat);
    document.getElementById('clear-btn')
        ?.addEventListener('click', clearCurrentChat);

    // System instructions toggle
    document.getElementById('system-toggle')
        ?.addEventListener('click', toggleSystem);

    // Message input
    document.getElementById('send-btn')
        ?.addEventListener('click', sendMessage);

    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('keydown', e => {
            // Ctrl+Enter or Cmd+Enter to send
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
            }
        });
        input.addEventListener('input', updateCharCount);
    }

    // Kick off amnesia-proof initialisation
    init();
});
