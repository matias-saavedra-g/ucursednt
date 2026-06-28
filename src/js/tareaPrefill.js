// tareaPrefill.js - Rellena automáticamente el formulario de entrega de tareas

(async function() {
    'use strict';

    if (window.tareaPrefillLoaded) return;
    window.tareaPrefillLoaded = true;

    // ── 1. Validar la URL ────────────────────────────────────────────────────
    // Solo debe ejecutarse en la vista de detalle de la tarea
    if (!window.location.pathname.includes('/tareas/detalle')) return;

    // ── 2. Chequear la Configuración del Usuario ─────────────────────────────
    if (typeof UcursedntUtils === 'undefined') {
        console.error('UcursedntUtils is not defined. Make sure utilities.js is loaded first.');
        return;
    }

    const settings = await UcursedntUtils.Storage.get('settings');
    if (settings && settings.features && settings.features.tareaPrefill === false) {
        return; // La función está desactivada en las opciones
    }

    // ── 3. Lógica de Autocompletado ──────────────────────────────────────────
    function prefillTareaForm() {
        // Parsear timestamps desde los atributos data-time
        const timeEls = document.querySelectorAll('.tiempo_rel[data-time]');
        if (timeEls.length < 2) {
            console.warn('[U-Cursedn\'t] No se encontraron los elementos de tiempo para calcular la inversión.');
            return;
        }

        const tsStart = parseInt(timeEls[0].dataset.time, 10); // Segundos Unix
        const tsDue   = parseInt(timeEls[1].dataset.time, 10);

        // Calcular delta en días
        const SECONDS_PER_DAY = 86400;
        const deltaDays = (tsDue - tsStart) / SECONDS_PER_DAY;

        // Fórmula de tiempo invertido
        const BASE_MULTIPLIER  = 60; // 60 min/día
        const randomMultiplier = 0.8 + Math.random() * 0.4; // ∈ [0.8, 1.2]
        const tiempoMinutes    = Math.round(deltaDays * BASE_MULTIPLIER * randomMultiplier);

        // Extraer el título de la tarea del primer <h1>
        const h1El = document.querySelector('.objeto > h1');
        let tareaTitle = 'la tarea';
        
        if (h1El) {
            // Clonar para remover elementos hijos (como las etiquetas .pill) de forma segura
            const clone = h1El.cloneNode(true);
            clone.querySelectorAll('div, span').forEach(el => el.remove());
            tareaTitle = clone.textContent.trim();
        }

        // Inyectar en los campos del formulario
        const tiempoInput  = document.querySelector('input[name="tiempo"]');
        const comentarioTA = document.querySelector('textarea[name="desc"]');

        if (tiempoInput && !tiempoInput.value) { // Solo rellenar si está vacío
            tiempoInput.value = Math.max(15, tiempoMinutes); // Mínimo 15 minutos por sanidad
            tiempoInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (comentarioTA && !comentarioTA.value) { // Solo rellenar si está vacío
            comentarioTA.value = `Se hace entrega de ${tareaTitle}.`;
            comentarioTA.dispatchEvent(new Event('input', { bubbles: true }));
            comentarioTA.classList.remove('empty');
        }

        // Mostrar alerta del Tour Guide si corresponde
        if (typeof window.showExtensionAlert === 'function') {
            window.showExtensionAlert(`¡Formulario autocompletado!\nTiempo estimado: ${tiempoInput ? tiempoInput.value : 'N/A'} min.`);
        }
    }

    // El manifiesto asegura que esto corra en document_end, así que el DOM ya existe
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
    prefillTareaForm();

})();