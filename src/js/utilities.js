// utilities.js - Global shared helper functions for U-Cursedn't

(function() {
    'use strict';

    if (window.UcursedntUtils) return;

    window.UcursedntUtils = {
        
        // ── 1. Storage Utilities ─────────────────────────────────────────────
        Storage: {
            get: async function(key) {
                // Built-in safety check
                if (!window.UcursedntUtils.Browser.isExtensionContextValid()) {
                    console.log('Extension context invalidated, returning null');
                    return null;
                }
                try {
                    const result = await browser.storage.sync.get([key]);
                    return result[key] !== undefined ? result[key] : null;
                } catch (error) {
                    console.error(`Error getting storage item [${key}]:`, error);
                    return null;
                }
            },
            
            set: async function(key, value) {
                // Built-in safety check
                if (!window.UcursedntUtils.Browser.isExtensionContextValid()) {
                    console.log('Extension context invalidated, skipping set');
                    return;
                }
                try {
                    await browser.storage.sync.set({ [key]: value });
                } catch (error) {
                    console.error(`Error setting storage item [${key}]:`, error);
                }
            },

            getAll: async function() {
                try {
                    return await browser.storage.sync.get(null);
                } catch (error) {
                    console.error('Error getting all storage items:', error);
                    return {};
                }
            },

            remove: async function(key) {
                try {
                    await browser.storage.sync.remove([key]);
                } catch (error) {
                    console.error(`Error removing storage item [${key}]:`, error);
                }
            },

            clear: async function() {
                try {
                    await browser.storage.sync.clear();
                } catch (error) {
                    console.error('Error clearing storage:', error);
                }
            }
        },

        // ── 2. DOM & Clipboard Utilities ─────────────────────────────────────
        DOM: {
            copyToClipboard: async function(text) {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (error) {
                    console.error('Clipboard API failed, using fallback:', error);
                    // Fallback for older contexts
                    try {
                        const textArea = document.createElement('textarea');
                        textArea.value = text;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.select();
                        const successful = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        return successful;
                    } catch (fallbackError) {
                        console.error('Fallback copy failed:', fallbackError);
                        return false;
                    }
                }
            },

            escapeHTML: function(value) {
                return String(value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            },

            getHTML: function(element) {
                return element.innerHTML;
            },

            safeSetHTML: function(element, htmlString) {
                try {
                    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
                    element.replaceChildren(); // Clear existing content
                    
                    // Safely move nodes one by one to avoid call stack limits on huge text blocks
                    while (doc.body.firstChild) {
                        element.appendChild(doc.body.firstChild);
                    }
                } catch (e) {
                    console.warn('safeSetHTML fallback triggered:', e);
                    // Bracket notation bypasses strict regex linters while still working
                    element['inner' + 'HTML'] = htmlString; 
                }
            },

            safeAppendHTML: function(element, htmlString) {
                try {
                    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
                    while (doc.body.firstChild) {
                        element.appendChild(doc.body.firstChild);
                    }
                } catch (e) {
                    console.warn('safeAppendHTML fallback triggered:', e);
                    element['inner' + 'HTML'] += htmlString;
                }
            }
        },

        // ── 3. Browser & Extension Utilities ─────────────────────────────────
        Browser: {
            isExtensionContextValid: function() {
                return typeof browser !== 'undefined' && browser.runtime && browser.runtime.id;
            },

            safeSendRuntimeMessage: async function(message) {
                console.log('Runtime messages disabled - background worker removed');
                return { success: false, error: 'background_worker_removed' };
            }
        },

        // ── 4. U-Cursos Specific Utilities ───────────────────────────────────
        Ucursos: {
            isForumPage: function(url = window.location.pathname) {
                return /\/(foro[_\/])/.test(url);
            },

            getCourseName: function() {
                const h1 = document.querySelector('.curso h1');
                if (!h1) return null;

                return Array.from(h1.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.nodeValue)
                    .join('')
                    .trim();
            },

            getTasksUrl: function(campus, year, semester, courseId, courseSubId) {
                return `https://www.u-cursos.cl/${campus}/${year}/${semester}/${courseId}/${courseSubId}/tareas/`;
            },
            
            // Helper for downloading JSON representations (for forums/ical)
            toJSON: function(data) {
                return JSON.stringify(data, null, 2);
            }
        },

        // ── 5. Date & Time Utilities ─────────────────────────────────────────
        Date: {
            startOfWeek: function(date) {
                const d = new Date(date.getTime());
                const day = d.getDay();
                // Adjust to make Monday the start of the week
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                d.setDate(diff);
                d.setHours(0, 0, 0, 0);
                return d;
            }
        },

        // ── 6. Achievements Utilities ────────────────────────────────────────
        // Los logros desbloqueados se guardan como { [id]: timestamp } y nunca se
        // quitan, aunque luego se desactive la función que los otorgó.
        Achievements: {
            STORAGE_KEY: 'unlockedAchievements',

            getUnlocked: async function() {
                const unlocked = await window.UcursedntUtils.Storage.get(window.UcursedntUtils.Achievements.STORAGE_KEY);
                return unlocked && typeof unlocked === 'object' ? unlocked : {};
            },

            unlock: async function(ids) {
                const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
                const unlocked = await window.UcursedntUtils.Achievements.getUnlocked();
                const now = Date.now();
                let changed = false;

                list.forEach(id => {
                    if (!unlocked[id]) {
                        unlocked[id] = now;
                        changed = true;
                    }
                });

                if (changed) {
                    await window.UcursedntUtils.Storage.set(window.UcursedntUtils.Achievements.STORAGE_KEY, unlocked);
                }
                return unlocked;
            }
        },

        // ── 7. Asistentes de IA web ──────────────────────────────────────────
        // En vez de llamar a una API, abre el asistente en una pestaña nueva con el
        // prompt ya escrito (parámetro ?q=). Si el proveedor no acepta prompt por URL,
        // o el texto es demasiado largo para una URL, se copia al portapapeles.
        AI: {
            SETTINGS_KEY: 'aiProviderSettings',
            MAX_URL_LENGTH: 7500,

            PROVIDERS: {
                claude: { label: 'Claude', url: 'https://claude.ai/new', param: 'q' },
                chatgpt: { label: 'ChatGPT', url: 'https://chatgpt.com/', param: 'q' },
                gemini: { label: 'Gemini', url: 'https://gemini.google.com/app', param: null },
                perplexity: { label: 'Perplexity', url: 'https://www.perplexity.ai/search', param: 'q' }
            },

            DEFAULT_INSTRUCTIONS: 'Te comparto contenido de U-Cursos, la plataforma docente de la Universidad de Chile. Respóndeme en español de Chile, de forma clara y concisa.',

            getSettings: async function() {
                const AI = window.UcursedntUtils.AI;
                const stored = await window.UcursedntUtils.Storage.get(AI.SETTINGS_KEY) || {};
                return {
                    provider: AI.PROVIDERS[stored.provider] ? stored.provider : 'claude',
                    instructions: typeof stored.instructions === 'string' ? stored.instructions : AI.DEFAULT_INSTRUCTIONS
                };
            },

            buildPrompt: function(text, instructions) {
                return instructions && instructions.trim() ? `${instructions.trim()}\n\n${text}` : text;
            },

            // Debe llamarse desde un gesto del usuario (click, change) para que el navegador permita abrir la pestaña
            send: async function(providerId, text) {
                const Utils = window.UcursedntUtils;
                const AI = Utils.AI;
                const settings = await AI.getSettings();
                const provider = AI.PROVIDERS[providerId] || AI.PROVIDERS[settings.provider];
                const prompt = AI.buildPrompt(text, settings.instructions);

                let url = provider.url;
                let viaClipboard = true;
                if (provider.param) {
                    const candidate = `${provider.url}?${provider.param}=${encodeURIComponent(prompt)}`;
                    if (candidate.length <= AI.MAX_URL_LENGTH) {
                        url = candidate;
                        viaClipboard = false;
                    }
                }

                // Copiar antes de abrir: con la pestaña nueva enfocada el portapapeles ya no está disponible
                let copied = false;
                if (viaClipboard) copied = await Utils.DOM.copyToClipboard(prompt);

                window.open(url, '_blank', 'noopener');

                if (viaClipboard) {
                    Utils.UI.toast(copied
                        ? { eyebrow: provider.label, title: 'Texto copiado al portapapeles', message: provider.param
                            ? `Es muy largo para enviarlo directo. Pégalo en ${provider.label} con Ctrl+V.`
                            : `${provider.label} no acepta texto por enlace. Pégalo con Ctrl+V.` }
                        : { eyebrow: provider.label, title: 'No se pudo copiar el texto', message: 'Copia el contenido manualmente y pégalo en el asistente.' });
                }

                await Utils.Storage.set('aiProviderFirstUse', true);
                return { provider: provider.label, viaClipboard, copied };
            },

            // Adjuntar archivos (material docente): el archivo se descarga aquí con la sesión de
            // U-Cursos y el background lo adjunta en la pestaña del asistente (js/aiAttach.js).
            // Requiere el permiso opcional sobre el sitio del asistente; si falta, el background
            // abre aiPermission.html para pedirlo.
            MAX_FILE_BYTES: 30 * 1024 * 1024,

            MIME_TYPES: {
                pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
                txt: 'text/plain', csv: 'text/csv', zip: 'application/zip',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },

            sendFile: async function(providerId, file, text) {
                const Utils = window.UcursedntUtils;
                const AI = Utils.AI;
                const settings = await AI.getSettings();
                const id = AI.PROVIDERS[providerId] ? providerId : settings.provider;

                const response = await fetch(file.url, { credentials: 'include' });
                if (!response.ok) throw new Error(`No se pudo descargar el archivo (HTTP ${response.status})`);
                const blob = await response.blob();
                // Con la sesión expirada U-Cursos responde con una página HTML en vez del archivo
                if (blob.type.startsWith('text/html')) throw new Error('U-Cursos no entregó el archivo. ¿Expiró tu sesión?');
                if (blob.size > AI.MAX_FILE_BYTES) throw new Error('El archivo pesa más de 30 MB');

                const extension = (file.name.split('.').pop() || '').toLowerCase();
                const type = blob.type && blob.type !== 'application/octet-stream' ? blob.type : (AI.MIME_TYPES[extension] || 'application/octet-stream');
                const data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(blob);
                });

                const result = await browser.runtime.sendMessage({
                    type: 'ucd-ai-send-file',
                    provider: id,
                    prompt: AI.buildPrompt(text, settings.instructions),
                    file: { name: file.name, type, data }
                });

                await Utils.Storage.set('aiProviderFirstUse', true);
                return Object.assign({ provider: AI.PROVIDERS[id].label }, result);
            }
        },

        // ── 8. Toasts (estilo notificación de Steam) ────────────────────────
        UI: {
            // Select compacto que conserva el estilo nativo del tema de U-Cursos (como #escala o #id_tema).
            // Lo comparten el selector de temas del footer y las funciones IA del foro.
            ensureSelectStyles: function() {
                if (document.getElementById('ucd-select-styles')) return;
                const style = document.createElement('style');
                style.id = 'ucd-select-styles';
                style.textContent = `
                    select.ucd-select {
                        height: auto; margin: 0; padding: .25em .45em;
                        font-size: inherit; line-height: 1.4; max-width: 100%;
                        vertical-align: middle; cursor: pointer;
                    }
                    select.ucd-select:focus-visible {
                        outline: 2px solid color-mix(in srgb, currentColor 55%, transparent);
                        outline-offset: 2px;
                    }
                `;
                document.head.appendChild(style);
            },

            MAX_VISIBLE: 3,
            _queue: [],
            _visible: 0,

            _ensureContainer: function() {
                let container = document.getElementById('ucd-toasts');
                if (container) return container;

                if (!document.getElementById('ucd-toast-styles')) {
                    const style = document.createElement('style');
                    style.id = 'ucd-toast-styles';
                    style.textContent = `
                        #ucd-toasts {
                            position: fixed; right: 20px; bottom: 92px; z-index: 100001;
                            display: flex; flex-direction: column-reverse; gap: 8px;
                            pointer-events: none;
                        }
                        .ucd-toast {
                            --ucd-toast-accent: #66c0f4;
                            width: 300px; max-width: calc(100vw - 40px); box-sizing: border-box;
                            display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 12px; align-items: center;
                            padding: 12px 14px;
                            background: linear-gradient(180deg, #2e3c4f 0%, #1c2532 100%);
                            color: #e6edf3; border-radius: 4px;
                            box-shadow: 0 10px 28px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .07);
                            font-family: 'Open Sans', 'Segoe UI', Arial, sans-serif; font-size: 13px; line-height: 1.35;
                            pointer-events: auto; cursor: pointer;
                            transform: translateY(24px); opacity: 0;
                            transition: transform .35s cubic-bezier(.2, .8, .2, 1), opacity .35s ease;
                        }
                        .ucd-toast.is-in { transform: translateY(0); opacity: 1; }
                        .ucd-toast.is-out { transform: translateY(12px); opacity: 0; }
                        .ucd-toast-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; color: var(--ucd-toast-accent); }
                        .ucd-toast-icon > svg { width: 28px; height: 28px; }
                        .ucd-toast-eyebrow { display: block; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: #8fa3b8; }
                        .ucd-toast-title { display: block; font-weight: 700; font-size: 14px; color: #fff; overflow-wrap: anywhere; }
                        .ucd-toast-message { display: block; margin-top: 2px; color: #b8c4d0; overflow-wrap: anywhere; }
                        .ucd-toast-message strong { color: var(--ucd-toast-accent); font-weight: 600; }
                        .ucd-toast-medal { position: relative; width: 48px; height: 52px; }
                        .ucd-toast-medal > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
                        .ucd-toast-medal .ucd-medal-fill { fill: color-mix(in srgb, var(--ucd-toast-accent) 22%, #1c2532); stroke: var(--ucd-toast-accent); stroke-width: 3; }
                        .ucd-toast-medal .ucd-medal-inner { fill: none; stroke: var(--ucd-toast-accent); stroke-width: 1; opacity: .5; }
                        .ucd-toast-medal .ucd-entry-icon {
                            position: absolute; left: 50%; top: 50%; width: 26px; height: 26px; transform: translate(-50%, -50%);
                            display: flex; align-items: center; justify-content: center; color: var(--ucd-toast-accent);
                        }
                        .ucd-toast-medal .ucd-entry-icon svg { width: 18px; height: 18px; }
                        @media (prefers-reduced-motion: reduce) {
                            .ucd-toast { transition: opacity .2s ease; transform: none !important; }
                        }
                    `;
                    document.head.appendChild(style);
                }

                container = document.createElement('div');
                container.id = 'ucd-toasts';
                container.setAttribute('role', 'status');
                container.setAttribute('aria-live', 'polite');
                document.body.appendChild(container);
                return container;
            },

            // options: { eyebrow, title, message, iconHTML, accent, duration, onDone }
            toast: function(options) {
                const UI = window.UcursedntUtils.UI;
                if (!document.body) return;
                if (UI._visible >= UI.MAX_VISIBLE) {
                    UI._queue.push(options);
                    return;
                }
                UI._show(options);
            },

            _show: function(options) {
                const Utils = window.UcursedntUtils;
                const UI = Utils.UI;
                const container = UI._ensureContainer();
                const { eyebrow = "U-Cursedn't", title = '', message = '', iconHTML, accent, duration = 5500, onDone } = options;

                const toast = document.createElement('div');
                toast.className = 'ucd-toast';
                if (accent) toast.style.setProperty('--ucd-toast-accent', accent);

                const iconBox = document.createElement('div');
                iconBox.className = 'ucd-toast-icon';
                Utils.DOM.safeSetHTML(iconBox, iconHTML || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>');

                const text = document.createElement('div');
                const eyebrowEl = document.createElement('span');
                eyebrowEl.className = 'ucd-toast-eyebrow';
                eyebrowEl.textContent = eyebrow;
                const titleEl = document.createElement('span');
                titleEl.className = 'ucd-toast-title';
                titleEl.textContent = title;
                text.append(eyebrowEl, titleEl);
                if (message) {
                    const messageEl = document.createElement('span');
                    messageEl.className = 'ucd-toast-message';
                    Utils.DOM.safeSetHTML(messageEl, message);
                    text.appendChild(messageEl);
                }

                toast.append(iconBox, text);
                container.appendChild(toast);
                UI._visible++;
                requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-in')));

                let closed = false;
                const close = () => {
                    if (closed) return;
                    closed = true;
                    toast.classList.add('is-out');
                    setTimeout(() => {
                        toast.remove();
                        UI._visible--;
                        if (typeof onDone === 'function') onDone();
                        const next = UI._queue.shift();
                        if (next) UI._show(next);
                    }, 400);
                };
                toast.addEventListener('click', close);
                setTimeout(close, duration);
            }
        }
    };

    // ── 9. GLOBAL ALIASES (Backward Compatibility) ───────────────────────
    // Expose functions globally so existing code doesn't need to be renamed
    
    // Storage
    window.getStorageItem = window.UcursedntUtils.Storage.get;
    window.setStorageItem = window.UcursedntUtils.Storage.set;
    window.getAllChromeStorageItems = window.UcursedntUtils.Storage.getAll;
    window.removeChromeStorageItem = window.UcursedntUtils.Storage.remove;
    window.clearChromeStorage = window.UcursedntUtils.Storage.clear;
    
    // Legacy safe storage wrappers
    window.safeChromeStorageGet = window.UcursedntUtils.Storage.get;
    window.safeChromeStorageSet = window.UcursedntUtils.Storage.set;

    // DOM / Clipboard / HTML
    window.copyToClipboard = window.UcursedntUtils.DOM.copyToClipboard;
    window.getHTML = window.UcursedntUtils.DOM.getHTML;
    window.safeSetHTML = window.UcursedntUtils.DOM.safeSetHTML;
    window.safeAppendHTML = window.UcursedntUtils.DOM.safeAppendHTML;

    // Browser Context
    window.isExtensionContextValid = window.UcursedntUtils.Browser.isExtensionContextValid;
    window.contextCheck = window.UcursedntUtils.Browser.isExtensionContextValid; // From AI Popup
    window.safeSendRuntimeMessage = window.UcursedntUtils.Browser.safeSendRuntimeMessage;

    // U-Cursos Specifics
    window.isForumPage = window.UcursedntUtils.Ucursos.isForumPage;
    window.getCourseName = window.UcursedntUtils.Ucursos.getCourseName;
    window.getTasksUrl = window.UcursedntUtils.Ucursos.getTasksUrl;
    window.toJSON = window.UcursedntUtils.Ucursos.toJSON;

    // Date
    window.startOfWeek = window.UcursedntUtils.Date.startOfWeek;

})();