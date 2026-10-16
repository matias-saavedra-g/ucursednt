// background.js - Tareas de ciclo de vida de la extensión

// En Chrome el service worker no recibe el polyfill desde el manifest
if (typeof browser === 'undefined' && typeof importScripts === 'function') {
    importScripts('browser-polyfill.min.js');
}

console.log('U-Cursedn\'t background loaded');

// Datos del antiguo chat IA con API de Gemini (retirado en 26.10.1).
// Se borran al actualizar para no dejar la API key ni el historial guardados.
const DEPRECATED_SYNC_KEYS = ['aiChatSettings', 'aiChatHistory'];
const DEPRECATED_LOCAL_PREFIXES = ['ucursitos_'];

async function cleanupDeprecatedAIData() {
    try {
        await browser.storage.sync.remove(DEPRECATED_SYNC_KEYS);

        const local = await browser.storage.local.get(null);
        const localKeys = Object.keys(local).filter(key => DEPRECATED_LOCAL_PREFIXES.some(prefix => key.startsWith(prefix)));
        if (localKeys.length) await browser.storage.local.remove(localKeys);
    } catch (error) {
        console.warn('Could not clean deprecated AI data:', error);
    }
}

// Handle extension lifecycle
browser.runtime.onInstalled.addListener((details) => {
    console.log('U-Cursedn\'t extension installed/updated:', details.reason);
    if (details.reason === 'update') cleanupDeprecatedAIData();
});

// ── Adjuntar archivos en asistentes IA ──────────────────────────────────────
// materialAI.js descarga el archivo en U-Cursos y lo manda aquí; se abre el asistente y se
// inyecta aiAttach.js para adjuntarlo. El acceso a los sitios de los asistentes es un permiso
// opcional: si falta, aiPermission.html lo pide y devuelve la solicitud para continuar.
const AI_PROVIDERS = {
    claude: { label: 'Claude', url: 'https://claude.ai/new', origin: 'https://claude.ai/*' },
    chatgpt: { label: 'ChatGPT', url: 'https://chatgpt.com/', origin: 'https://chatgpt.com/*' },
    gemini: { label: 'Gemini', url: 'https://gemini.google.com/app', origin: 'https://gemini.google.com/*' },
    perplexity: { label: 'Perplexity', url: 'https://www.perplexity.ai/', origin: 'https://www.perplexity.ai/*' }
};
const AI_ORIGINS = Object.values(AI_PROVIDERS).map(provider => provider.origin);

// Solicitudes esperando permiso. aiPermission.js las retira apenas carga, así no se
// pierden si el service worker se suspende mientras el usuario decide.
const pendingAttachments = new Map();

function waitForTabLoad(tabId, origin, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); reject(new Error('El asistente tardó demasiado en cargar')); }, timeoutMs);
        const listener = (id, info, tab) => {
            if (id === tabId && info.status === 'complete' && tab.url && tab.url.startsWith(origin)) {
                cleanup();
                resolve();
            }
        };
        function cleanup() {
            clearTimeout(timer);
            browser.tabs.onUpdated.removeListener(listener);
        }
        browser.tabs.onUpdated.addListener(listener);
    });
}

async function openAndAttach(payload, { reuseTabId, openerTab } = {}) {
    const target = AI_PROVIDERS[payload.provider];
    const tab = reuseTabId != null
        ? await browser.tabs.update(reuseTabId, { url: target.url, active: true })
        : await browser.tabs.create({ url: target.url, index: openerTab ? openerTab.index + 1 : undefined, openerTabId: openerTab ? openerTab.id : undefined });

    await waitForTabLoad(tab.id, new URL(target.url).origin);
    await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ['js/aiAttach.js'] });
    const [injection] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: data => window.ucdAttachFile(data),
        args: [payload]
    });
    return injection && injection.result;
}

function validAttachment(message) {
    const file = message && message.file;
    if (!AI_PROVIDERS[message.provider] || !file || typeof file.data !== 'string' || typeof file.name !== 'string') return null;
    return {
        provider: message.provider,
        prompt: typeof message.prompt === 'string' ? message.prompt : '',
        file: { name: file.name, type: typeof file.type === 'string' ? file.type : 'application/octet-stream', data: file.data }
    };
}

async function handleSendFile(message, sender) {
    const payload = validAttachment(message);
    if (!payload) throw new Error('Solicitud inválida');

    if (await browser.permissions.contains({ origins: [AI_PROVIDERS[payload.provider].origin] })) {
        // No se espera a que cargue el asistente: aiAttach.js avisa allá si algo falla
        openAndAttach(payload, { openerTab: sender.tab }).catch(error => console.warn('AI attach failed:', error));
        return { status: 'attaching' };
    }

    const token = crypto.randomUUID();
    pendingAttachments.set(token, payload);
    await browser.tabs.create({
        url: browser.runtime.getURL(`aiPermission.html#${token}`),
        index: sender.tab ? sender.tab.index + 1 : undefined
    });
    return { status: 'permission' };
}

browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || sender.id !== browser.runtime.id) return;

    if (message.type === 'ucd-ai-send-file') {
        return handleSendFile(message, sender);
    }

    if (message.type === 'ucd-ai-pending') {
        const payload = pendingAttachments.get(message.token) || null;
        pendingAttachments.delete(message.token);
        return Promise.resolve(payload && {
            payload,
            providerLabel: AI_PROVIDERS[payload.provider].label,
            origins: AI_ORIGINS
        });
    }

    if (message.type === 'ucd-ai-granted') {
        const payload = validAttachment(message.payload || {});
        if (!payload || !sender.tab) return;
        openAndAttach(payload, { reuseTabId: sender.tab.id }).catch(error => console.warn('AI attach failed:', error));
        return Promise.resolve({ status: 'attaching' });
    }
});
