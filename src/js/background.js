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
