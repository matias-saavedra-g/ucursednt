// materialAI.js - Funciones IA para Material Docente y Material Alumnos
// Agrega a cada archivo un <select> nativo "Funciones IA" que lo envía adjunto a un asistente
// web (Claude, ChatGPT, Gemini o Perplexity), sin pasar por la carpeta de descargas.

(async function() {
    'use strict';

    if (window.materialAILoaded) return;
    window.materialAILoaded = true;

    const settings = await UcursedntUtils.Storage.get('settings');
    if (settings && settings.features && settings.features.materialAI === false) return;

    const SELECTORS = {
        listRow: '#materiales tr[data-id]',
        listName: 'td h1 > a[href^="detalle"]',
        listSize: 'td h2',
        detailTitle: '#body .objeto > h1',
        detailDownload: '#body > a.download.boton[href*="bajar"]'
    };

    // Solo los nodos de texto: el h1 también trae el ícono, la estrella y "Reportar"
    function ownText(element) {
        return Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.nodeValue)
            .join('')
            .trim();
    }

    function describeFile(name) {
        const section = location.pathname.includes('/material_alumnos/') ? 'material de alumnos' : 'material docente';
        const course = UcursedntUtils.Ucursos.getCourseName();
        return `Te adjunto el archivo «${name}», ${section}${course ? ` del curso ${course}` : ''} en U-Cursos.`;
    }

    // Feedback breve en la primera opción del select
    function showSelectFeedback(select, text) {
        const placeholder = select.options[0];
        placeholder.textContent = text;
        select.value = '';
        setTimeout(() => { placeholder.textContent = placeholder.dataset.label; }, 2500);
    }

    async function runAction(provider, file, select) {
        select.disabled = true;
        select.options[0].textContent = 'Preparando archivo…';
        select.value = '';
        try {
            const result = await UcursedntUtils.AI.sendFile(provider, file, describeFile(file.name));
            showSelectFeedback(select, result.status === 'permission' ? 'Falta un permiso…' : `✓ Abriendo ${result.provider}`);
        } catch (error) {
            console.error('Material AI action failed:', error);
            showSelectFeedback(select, 'Error');
            UcursedntUtils.UI.toast({ eyebrow: 'Funciones IA', title: 'No se pudo enviar el archivo', message: error.message });
        } finally {
            select.disabled = false;
        }
    }

    function createOption(value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }

    function createActionsSelect(file) {
        const select = document.createElement('select');
        select.className = 'ucd-select ucd-material-ai';
        select.setAttribute('aria-label', `Funciones IA para ${file.name}`);

        const placeholder = createOption('', 'Funciones IA');
        placeholder.dataset.label = 'Funciones IA';
        select.appendChild(placeholder);

        const group = document.createElement('optgroup');
        group.label = 'Enviar archivo a';
        Object.entries(UcursedntUtils.AI.PROVIDERS).forEach(([id, provider]) => {
            group.appendChild(createOption(id, provider.label));
        });
        select.appendChild(group);

        select.addEventListener('change', () => {
            if (select.value) runAction(select.value, file, select);
        });
        return select;
    }

    function addStyles() {
        UcursedntUtils.UI.ensureSelectStyles();
        if (document.getElementById('material-ai-styles')) return;
        const style = document.createElement('style');
        style.id = 'material-ai-styles';
        style.textContent = `
            select.ucd-material-ai { font-size: 12px; margin-left: .6em; }
            .ucd-material-ai-detail { margin: 0 0 1em; }
            .ucd-material-ai-detail select.ucd-material-ai { margin-left: 0; font-size: inherit; }
        `;
        document.head.appendChild(style);
    }

    // Lista: un select junto al tamaño de cada archivo descargable (no carpetas ni enlaces)
    function processList() {
        document.querySelectorAll(SELECTORS.listRow).forEach(row => {
            const download = row.querySelector(`a#d${row.dataset.id}.download`);
            const nameLink = row.querySelector(SELECTORS.listName);
            const size = row.querySelector(SELECTORS.listSize);
            if (!download || !nameLink || !size || size.querySelector('.ucd-material-ai')) return;
            size.appendChild(createActionsSelect({ name: nameLink.textContent.trim(), url: download.href }));
        });
    }

    // Detalle: un select bajo el botón "Download"
    function processDetail() {
        const title = document.querySelector(SELECTORS.detailTitle);
        const download = document.querySelector(SELECTORS.detailDownload);
        if (!title || !download || document.querySelector('.ucd-material-ai-detail')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'ucd-material-ai-detail';
        wrapper.appendChild(createActionsSelect({ name: ownText(title), url: download.href }));
        download.insertAdjacentElement('afterend', wrapper);
    }

    function init() {
        addStyles();
        processList();
        processDetail();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
