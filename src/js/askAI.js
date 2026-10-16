// askAI.js - "Preguntar a la IA" (reemplaza al chat flotante con API de Gemini)
// UCursitos abre un pequeño panel: escribes tu pregunta, eliges el asistente y se abre en
// una pestaña nueva con el prompt ya escrito. Opcionalmente incluye el texto de la página.

(async function() {
    'use strict';

    if (window.askAILoaded) return;
    window.askAILoaded = true;

    const settings = await UcursedntUtils.Storage.get('settings');
    if (settings && settings.features && settings.features.aiChatPopup === false) return;

    const AI = UcursedntUtils.AI;
    const MAX_CONTEXT_CHARS = 6000;

    // Texto principal de la página actual (sin menús ni elementos de la extensión)
    function getPageContext() {
        const body = document.querySelector('#body') || document.body;
        const clone = body.cloneNode(true);
        clone.querySelectorAll('script, style, select, form, .ucd-ask, #ucd-toasts, .ucd-gw-summary').forEach(el => el.remove());
        const text = clone.textContent.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        const title = (document.querySelector('h1.modulo') || {}).textContent || document.title;
        const course = (document.querySelector('#navigation-wrapper .curso h1') || {}).textContent || '';
        const header = `Página de U-Cursos: ${course.trim()} · ${title.trim()} (${location.href})`;
        const truncated = text.length > MAX_CONTEXT_CHARS ? `${text.slice(0, MAX_CONTEXT_CHARS)}\n[…contenido recortado]` : text;
        return `${header}\n\n${truncated}`;
    }

    function addStyles() {
        if (document.getElementById('ucd-ask-styles')) return;
        UcursedntUtils.UI.ensureSelectStyles();
        const style = document.createElement('style');
        style.id = 'ucd-ask-styles';
        style.textContent = `
            .ucd-ask { position: fixed; right: 20px; bottom: 20px; z-index: 100000; font-size: 14px; }
            .ucd-ask-mascot {
                width: 56px; height: 56px; padding: 0; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                background: var(--body-bg, #fff); border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
                box-shadow: 0 4px 14px rgba(0, 0, 0, .18); cursor: pointer;
                transition: transform .2s ease;
            }
            .ucd-ask-mascot:hover { transform: scale(1.06); background: var(--body-bg, #fff); }
            .ucd-ask-mascot img { width: 40px; height: 40px; border-radius: 50%; }
            .ucd-ask-panel {
                position: absolute; right: 0; bottom: 68px; width: 340px; max-width: calc(100vw - 40px);
                box-sizing: border-box; padding: 14px; border-radius: 8px;
                background: var(--body-bg, #fff); color: inherit;
                border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
                box-shadow: 0 12px 32px rgba(0, 0, 0, .22);
                display: flex; flex-direction: column; gap: 10px;
            }
            .ucd-ask-panel[hidden] { display: none; }
            .ucd-ask-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
            .ucd-ask-head strong { font-size: 15px; }
            .ucd-ask-close { background: none; border: 0; padding: 4px; margin: 0; color: inherit; opacity: .6; cursor: pointer; line-height: 0; }
            .ucd-ask-close:hover { opacity: 1; background: none; }
            .ucd-ask-close svg { width: 18px; height: 18px; }
            .ucd-ask-panel textarea { width: 100%; box-sizing: border-box; min-height: 90px; resize: vertical; margin: 0; font-family: inherit; }
            .ucd-ask-context { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
            .ucd-ask-context input { margin: 0 4px 0 0; }
            .ucd-ask-row { display: flex; align-items: center; gap: 8px; }
            .ucd-ask-row select { flex: 1; min-width: 0; }
            .ucd-ask-row .boton { margin: 0; white-space: nowrap; }
            .ucd-ask-note { margin: 0; font-size: 12px; opacity: .65; }
            .ucd-ask :is(button, textarea, select, input):focus-visible {
                outline: 2px solid color-mix(in srgb, currentColor 55%, transparent); outline-offset: 2px;
            }
            @media (prefers-reduced-motion: reduce) { .ucd-ask-mascot { transition: none; } }
        `;
        document.head.appendChild(style);
    }

    async function init() {
        if (document.querySelector('.ucd-ask')) return;
        addStyles();

        const aiSettings = await AI.getSettings();
        const root = document.createElement('div');
        root.className = 'ucd-ask';

        const providerOptions = Object.entries(AI.PROVIDERS)
            .map(([id, p]) => `<option value="${id}">${p.label}</option>`).join('');

        UcursedntUtils.DOM.safeSetHTML(root, `
            <div class="ucd-ask-panel" id="ucd-ask-panel" role="dialog" aria-label="Preguntar a la IA" hidden>
                <div class="ucd-ask-head">
                    <strong>Preguntar a la IA</strong>
                    <button type="button" class="ucd-ask-close" aria-label="Cerrar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                    </button>
                </div>
                <textarea id="ucd-ask-question" rows="4" placeholder="¿Qué quieres preguntar? Ej: resume esta página en 5 puntos"></textarea>
                <label class="ucd-ask-context" for="ucd-ask-include"><input type="checkbox" id="ucd-ask-include" checked> Incluir el texto de esta página</label>
                <div class="ucd-ask-row">
                    <select id="ucd-ask-provider" class="ucd-select" aria-label="Asistente">${providerOptions}</select>
                    <button type="button" class="boton" id="ucd-ask-send">Abrir</button>
                </div>
                <p class="ucd-ask-note">Se abre en una pestaña nueva con tu sesión del asistente. Ctrl+Enter también envía.</p>
            </div>
            <button type="button" class="ucd-ask-mascot" aria-expanded="false" aria-controls="ucd-ask-panel" title="Preguntar a la IA">
                <img src="${browser.runtime.getURL('images/ucursitos.png')}" alt="UCursitos">
            </button>
        `);
        document.body.appendChild(root);

        const panel = root.querySelector('.ucd-ask-panel');
        const mascot = root.querySelector('.ucd-ask-mascot');
        const question = root.querySelector('#ucd-ask-question');
        const include = root.querySelector('#ucd-ask-include');
        const provider = root.querySelector('#ucd-ask-provider');
        const sendBtn = root.querySelector('#ucd-ask-send');

        provider.value = aiSettings.provider;
        const updateButton = () => { sendBtn.textContent = `Abrir en ${AI.PROVIDERS[provider.value].label}`; };
        updateButton();

        const setOpen = open => {
            panel.hidden = !open;
            mascot.setAttribute('aria-expanded', String(open));
            if (open) question.focus();
        };

        mascot.addEventListener('click', () => setOpen(panel.hidden));
        root.querySelector('.ucd-ask-close').addEventListener('click', () => setOpen(false));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });

        provider.addEventListener('change', async () => {
            updateButton();
            const current = await UcursedntUtils.Storage.get(AI.SETTINGS_KEY) || {};
            await UcursedntUtils.Storage.set(AI.SETTINGS_KEY, Object.assign(current, { provider: provider.value }));
        });

        async function send() {
            const text = question.value.trim();
            if (!text && !include.checked) {
                question.focus();
                return;
            }
            const parts = [text || 'Ayúdame con el contenido de esta página.'];
            if (include.checked) parts.push(`---\n${getPageContext()}`);
            await AI.send(provider.value, parts.join('\n\n'));
            question.value = '';
            setOpen(false);
        }

        sendBtn.addEventListener('click', send);
        question.addEventListener('keydown', e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                send();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
