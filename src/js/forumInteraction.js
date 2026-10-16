// forumInteraction.js - Forum interaction features for U-Cursos
// Agrega a cada post un <select> nativo "Funciones IA" para copiar el post o el hilo,
// o enviarlo a un asistente web (Claude, ChatGPT, Gemini o Perplexity).

(async function() {
    'use strict';

    // Check if already loaded to prevent duplicate initialization
    if (window.forumInteractionLoaded) {
        return;
    }
    window.forumInteractionLoaded = true;

    // Selectores acotados a cada post: los posts raíz contienen a sus respuestas anidadas,
    // así que todo se busca desde el .container propio del post.
    const SELECTORS = {
        thread: 'div[id^="raiz_"]',
        post: '.msg',
        threadTitle: '#mensaje-titulo',
        threadAuthor: ':scope > .sticky h2 a.usuario',
        threadTime: ':scope > .sticky h2 .tiempo_rel',
        author: ':scope > .container > .autor .usuario',
        time: ':scope > .container > .autor .tiempo_rel',
        content: ':scope > .container > .texto > .ta',
        postOptions: ':scope > .container > .texto > ul.opciones'
    };

    // Check extension settings
    async function checkSettings() {
        try {
            const settings = await UcursedntUtils.Storage.get("settings");
            return !(settings && settings.features && settings.features.forumInteraction === false);
        } catch (error) {
            console.error('Error checking settings:', error);
            return true; // Default to enabled if error
        }
    }

    // .tiempo_rel trae varias versiones de la fecha; la de "excel" es la completa
    function readTime(timeElement) {
        if (!timeElement) return 'Fecha desconocida';
        const full = timeElement.querySelector('.only-excel');
        return (full || timeElement).textContent.trim();
    }

    // Texto del post con saltos de línea; funciona aunque el post esté colapsado (display: none)
    function readContent(contentElement) {
        const clone = contentElement.cloneNode(true);
        clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
        clone.querySelectorAll('p, li, tr, h1, h2, h3').forEach(block => block.append('\n'));
        clone.querySelectorAll('td').forEach(cell => cell.append('\t'));
        return clone.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    // Extract post data from a post element
    function extractPostData(postElement, threadElement) {
        const isRoot = postElement.classList.contains('raiz');
        const authorElement = postElement.querySelector(SELECTORS.author)
            || (isRoot && threadElement ? threadElement.querySelector(SELECTORS.threadAuthor) : null);
        const timeElement = postElement.querySelector(SELECTORS.time)
            || (isRoot && threadElement ? threadElement.querySelector(SELECTORS.threadTime) : null);
        const contentElement = postElement.querySelector(SELECTORS.content);
        const titleElement = isRoot && threadElement ? threadElement.querySelector(SELECTORS.threadTitle) : null;

        return {
            title: titleElement ? titleElement.textContent.trim() : '',
            author: authorElement ? authorElement.textContent.trim() : 'Autor desconocido',
            time: readTime(timeElement),
            content: contentElement ? readContent(contentElement) : 'Contenido no disponible',
            isRoot
        };
    }

    // Format post data as plain text
    function formatPostAsText(postData, includePrefix = true) {
        const prefix = postData.isRoot ? '[HILO ORIGINAL]' : '[RESPUESTA]';
        const lines = [];
        if (includePrefix) lines.push(prefix);
        if (postData.title) lines.push(`Título: ${postData.title}`);
        lines.push(`Autor: ${postData.author}`, `Fecha: ${postData.time}`, '', postData.content);
        return lines.join('\n');
    }

    // Format thread data as plain text
    function formatThreadAsText(threadData) {
        return '=== HILO COMPLETO ===\n\n' + threadData.map(post => formatPostAsText(post, true)).join('\n\n--- --- ---\n\n');
    }

    function getThreadData(threadElement) {
        return Array.from(threadElement.querySelectorAll(SELECTORS.post))
            .map(post => extractPostData(post, threadElement));
    }

    // Feedback breve en la primera opción del select
    function showSelectFeedback(select, text) {
        const placeholder = select.options[0];
        const original = placeholder.dataset.label;
        placeholder.textContent = text;
        select.value = '';
        setTimeout(() => { placeholder.textContent = original; }, 2000);
    }

    async function runAction(action, postElement, threadElement, select) {
        const [kind, target] = action.split(':');
        const isThread = kind === 'thread';
        const text = isThread
            ? formatThreadAsText(getThreadData(threadElement))
            : formatPostAsText(extractPostData(postElement, threadElement), false);

        if (target === 'copy') {
            const success = await UcursedntUtils.DOM.copyToClipboard(text);
            showSelectFeedback(select, success ? '✓ Copiado' : 'No se pudo copiar');
            return;
        }

        const intro = isThread ? 'Hilo del foro de U-Cursos:' : 'Post del foro de U-Cursos:';
        const result = await UcursedntUtils.AI.send(target, `${intro}\n\n${text}`);
        showSelectFeedback(select, `✓ Abierto en ${result.provider}`);
    }

    function createOption(value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }

    // <select> nativo con las acciones del post (y del hilo, en el post raíz)
    function createActionsSelect(postElement, threadElement) {
        const isRoot = postElement.classList.contains('raiz') && threadElement;
        const providers = UcursedntUtils.AI.PROVIDERS;

        const select = document.createElement('select');
        select.className = 'ucd-select ucd-forum-ai';
        select.setAttribute('aria-label', 'Funciones IA del post');

        const placeholder = createOption('', 'Funciones IA');
        placeholder.dataset.label = 'Funciones IA';
        select.appendChild(placeholder);

        const copyGroup = document.createElement('optgroup');
        copyGroup.label = 'Copiar';
        copyGroup.appendChild(createOption('post:copy', 'Copiar post'));
        if (isRoot) copyGroup.appendChild(createOption('thread:copy', 'Copiar hilo completo'));
        select.appendChild(copyGroup);

        const scopes = isRoot ? [['post', 'Enviar post a'], ['thread', 'Enviar hilo a']] : [['post', 'Enviar post a']];
        scopes.forEach(([scope, label]) => {
            const group = document.createElement('optgroup');
            group.label = label;
            Object.entries(providers).forEach(([id, provider]) => {
                group.appendChild(createOption(`${scope}:${id}`, provider.label));
            });
            select.appendChild(group);
        });

        select.addEventListener('change', () => {
            const action = select.value;
            if (!action) return;
            runAction(action, postElement, threadElement, select).catch(error => {
                console.error('Forum action failed:', error);
                showSelectFeedback(select, 'Error');
            });
        });

        return select;
    }

    // Inserta el select al inicio de la lista nativa de opciones del post (Reply, Permalink...)
    function addPostActions(postElement, threadElement) {
        const optionsList = postElement.querySelector(SELECTORS.postOptions);
        if (!optionsList || optionsList.querySelector('.ucd-forum-ai')) return;

        const listItem = document.createElement('li');
        listItem.className = 'ucd-forum-ai-item';
        listItem.appendChild(createActionsSelect(postElement, threadElement));
        optionsList.insertBefore(listItem, optionsList.firstChild);
    }

    function addForumInteractionStyles() {
        UcursedntUtils.UI.ensureSelectStyles();
        if (document.querySelector('#forum-interaction-styles')) return;

        const style = document.createElement('style');
        style.id = 'forum-interaction-styles';
        style.textContent = `
            ul.opciones > li.ucd-forum-ai-item { display: inline-block; vertical-align: middle; }
            select.ucd-forum-ai { font-size: 12px; }
        `;
        document.head.appendChild(style);
    }

    // Helper function to process threads
    function processThreads(threads) {
        threads.forEach(thread => {
            thread.querySelectorAll(SELECTORS.post).forEach(post => addPostActions(post, thread));
        });
    }

    let enabled = false;

    // Initialize forum interaction features
    async function initializeForumInteraction() {
        if (!UcursedntUtils.Ucursos.isForumPage()) return;
        if (!await checkSettings()) return;
        enabled = true;

        addForumInteractionStyles();

        const threads = document.querySelectorAll(SELECTORS.thread);
        if (threads.length === 0) {
            // If no threads found immediately, wait a bit and try again
            setTimeout(() => processThreads(document.querySelectorAll(SELECTORS.thread)), 2000);
            return;
        }
        processThreads(threads);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeForumInteraction);
    } else {
        initializeForumInteraction();
    }

    // Threads cargados después (autocarga de páginas) también reciben el select
    const observer = new MutationObserver(mutations => {
        if (enabled && mutations.some(m => Array.from(m.addedNodes).some(n => n.nodeType === 1 && (n.matches?.(SELECTORS.thread) || n.querySelector?.(SELECTORS.thread))))) {
            processThreads(document.querySelectorAll(SELECTORS.thread));
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
