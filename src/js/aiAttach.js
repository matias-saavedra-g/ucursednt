// aiAttach.js - Se inyecta (desde background.js) en la pestaña del asistente IA.
// Adjunta el archivo de U-Cursos y escribe el prompt en el cuadro de texto, sin enviarlo,
// para que el usuario agregue su pregunta. Prueba, en orden: el <input type="file"> del
// sitio, un "pegar" simulado y un "soltar" simulado.

(function() {
    'use strict';

    if (window.ucdAttachFile) return;

    const PROVIDER_LABELS = { claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini', perplexity: 'Perplexity' };

    // Selectores conocidos por sitio; si cambian, se usa el primer editor genérico visible
    const EDITOR_SELECTORS = {
        claude: 'div.ProseMirror[contenteditable="true"]',
        chatgpt: '#prompt-textarea',
        gemini: 'rich-textarea [contenteditable="true"]',
        perplexity: '#ask-input'
    };
    const GENERIC_EDITOR = 'div[contenteditable="true"], textarea';

    const EDITOR_TIMEOUT = 20000;
    const INPUT_TIMEOUT = 3000;

    function isVisible(element) {
        return element.getClientRects().length > 0;
    }

    function findEditor(provider) {
        const known = EDITOR_SELECTORS[provider] && document.querySelector(EDITOR_SELECTORS[provider]);
        if (known) return known;
        return Array.from(document.querySelectorAll(GENERIC_EDITOR)).find(isVisible) || null;
    }

    function waitFor(find, timeout) {
        return new Promise(resolve => {
            const start = Date.now();
            (function poll() {
                const found = find();
                if (found || Date.now() - start > timeout) return resolve(found || null);
                setTimeout(poll, 250);
            })();
        });
    }

    function acceptsFile(input, file) {
        const accept = (input.getAttribute('accept') || '').trim();
        if (!accept) return true;
        const name = file.name.toLowerCase();
        return accept.split(',').map(token => token.trim().toLowerCase()).some(token =>
            token === '*/*' || token === file.type ||
            (token.endsWith('/*') && file.type.startsWith(token.slice(0, -1))) ||
            (token.startsWith('.') && name.endsWith(token)));
    }

    function findFileInput(file) {
        return Array.from(document.querySelectorAll('input[type="file"]')).find(input => !input.disabled && acceptsFile(input, file)) || null;
    }

    function toFile({ name, type, data }) {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new File([bytes], name, { type });
    }

    function transferWith(file) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        return transfer;
    }

    function attachViaInput(input, file) {
        input.files = transferWith(file).files;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Los editores que aceptan archivos pegados cancelan el evento al procesarlo
    function attachViaPaste(editor, file) {
        const event = new ClipboardEvent('paste', { clipboardData: transferWith(file), bubbles: true, cancelable: true });
        editor.dispatchEvent(event);
        return event.defaultPrevented;
    }

    function attachViaDrop(editor, file) {
        const transfer = transferWith(file);
        ['dragenter', 'dragover', 'drop'].forEach(type => {
            editor.dispatchEvent(new DragEvent(type, { dataTransfer: transfer, bubbles: true, cancelable: true }));
        });
    }

    function insertText(editor, text) {
        editor.focus();
        if (editor instanceof HTMLTextAreaElement) {
            // Setter nativo para que React detecte el cambio
            Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(editor, text);
            editor.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }
        const transfer = new DataTransfer();
        transfer.setData('text/plain', text);
        const event = new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true });
        editor.dispatchEvent(event);
        if (!event.defaultPrevented) document.execCommand('insertText', false, text);
    }

    // Aviso en la esquina, aislado en un shadow root para no heredar estilos del sitio.
    // Siempre ofrece descargar el archivo por si el sitio no lo tomó.
    function showNotice(title, message, file, persistent) {
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:2147483647;';
        const root = host.attachShadow({ mode: 'open' });
        const link = URL.createObjectURL(file);

        const style = document.createElement('style');
        style.textContent = `
            .box { width: 300px; box-sizing: border-box; padding: 12px 14px; border-radius: 6px;
                background: #1c2532; color: #e6edf3; box-shadow: 0 10px 28px rgba(0,0,0,.45);
                font: 13px/1.4 'Segoe UI', Arial, sans-serif; }
            .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #66c0f4; }
            strong { display: block; margin: 2px 0 4px; font-size: 14px; }
            p { margin: 0 0 8px; }
            .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
            a { color: #66c0f4; }
            button { background: none; border: 0; color: inherit; opacity: .7; cursor: pointer; font: inherit; padding: 0; }
            button:hover { opacity: 1; }
        `;
        const box = document.createElement('div');
        box.className = 'box';
        box.setAttribute('role', 'status');

        const eyebrow = document.createElement('div');
        eyebrow.className = 'eyebrow';
        eyebrow.textContent = "U-Cursedn't";
        const heading = document.createElement('strong');
        heading.textContent = title;
        const body = document.createElement('p');
        body.textContent = message;

        const row = document.createElement('div');
        row.className = 'row';
        const download = document.createElement('a');
        download.href = link;
        download.download = file.name;
        download.textContent = '¿No aparece? Descargar archivo';
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = 'Cerrar';
        row.append(download, close);

        box.append(eyebrow, heading, body, row);
        root.append(style, box);
        document.body.appendChild(host);

        const dismiss = () => { host.remove(); URL.revokeObjectURL(link); };
        close.addEventListener('click', dismiss);
        if (!persistent) setTimeout(dismiss, 15000);
    }

    window.ucdAttachFile = async function({ provider, prompt, file: fileData }) {
        const label = PROVIDER_LABELS[provider] || 'el asistente';
        const file = toFile(fileData);

        const editor = await waitFor(() => findEditor(provider), EDITOR_TIMEOUT);
        if (!editor) {
            showNotice('No encontré el cuadro de texto', `¿Iniciaste sesión en ${label}? Descarga el archivo y arrástralo al chat.`, file, true);
            return { ok: false, reason: 'editor' };
        }

        let method = 'input';
        const input = await waitFor(() => findFileInput(file), INPUT_TIMEOUT);
        if (input) {
            attachViaInput(input, file);
        } else if (attachViaPaste(editor, file)) {
            method = 'paste';
        } else {
            attachViaDrop(editor, file);
            method = 'drop';
        }

        if (prompt) {
            await new Promise(resolve => setTimeout(resolve, 300));
            insertText(editor, prompt);
        }

        showNotice(`Adjunté «${file.name}»`, 'Escribe tu pregunta y envíala cuando el archivo termine de subir.', file, false);
        return { ok: true, method };
    };

})();
