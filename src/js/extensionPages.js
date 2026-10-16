// extensionPages.js - Base compartida de las páginas propias de la extensión (/ucursednt/ y /logros/)
// Contiene la estructura y los estilos de página; el catálogo vive en catalog.js.
// Los estilos se apoyan en los componentes nativos de U-Cursos (h2, .lead, div.pill,
// div.info/.ok/.warn, div.porcentaje, table.form, .boton) para que ambas páginas sigan
// automáticamente el tema activo (Focus, Focus Oscuro, Claro u Oscuro).

(function() {
    'use strict';

    if (window.UcursedntPages) return;

    const Catalog = window.UcursedntCatalog;
    const { icon } = Catalog;

    // ── 4. Estructura común de página ───────────────────────────────────────
    function preparePage(title) {
        const errorDisplay = document.querySelector('#error');
        if (errorDisplay) errorDisplay.style.display = 'none';

        const navbarTitle = document.querySelector('#navbar > li');
        if (navbarTitle) navbarTitle.textContent = title;

        const moduleTitle = document.querySelector('h1.modulo');
        if (moduleTitle) moduleTitle.textContent = title;

        document.title = `U-Cursedn't :: ${title}`;
        injectStyles();

        const page = document.createElement('div');
        page.id = 'ucd-page';
        const body = document.querySelector('#body');
        if (body) body.appendChild(page);
        return page;
    }

    // Encabezado de sección: <h2> nativo con ícono y contador opcional
    function sectionHeading(iconName, title, countHTML = '') {
        return `<h2 class="ucd-section-title">${icon(iconName)}<span>${title}</span>${countHTML}</h2>`;
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── 5. Estilos ──────────────────────────────────────────────────────────
    // Solo layout y detalles propios: colores de superficie, texto, botones, pills y
    // barras vienen del CSS del tema de U-Cursos. Los tonos propios se derivan de
    // currentColor para funcionar igual en temas claros y oscuros.
    function injectStyles() {
        if (document.getElementById('ucd-page-styles')) return;
        const style = document.createElement('style');
        style.id = 'ucd-page-styles';
        style.textContent = `
            #ucd-page {
                --ucd-line: color-mix(in srgb, currentColor 14%, transparent);
                --ucd-tint: color-mix(in srgb, currentColor 5%, transparent);
                --ucd-muted: color-mix(in srgb, currentColor 65%, transparent);
                --ucd-common: #8b969e;
                --ucd-rare: #3d8fd6;
                --ucd-epic: #9c62cc;
                --ucd-legendary: #d39a1c;
                max-width: 62em;
                display: flex;
                flex-direction: column;
                gap: 2.5em;
                padding-bottom: 2em;
            }
            #ucd-page [hidden] { display: none !important; }
            #ucd-page .ucd-icon { width: 1.15em; height: 1.15em; flex: none; vertical-align: -.2em; }
            #ucd-page .lead { margin: 0; max-width: 40em; }
            #ucd-page section { display: flex; flex-direction: column; gap: .9em; min-width: 0; }
            #ucd-page .ucd-section-title {
                display: flex; align-items: center; gap: .5em; margin: 0;
                text-wrap: balance;
            }
            #ucd-page .ucd-section-title .ucd-icon { opacity: .75; }
            #ucd-page .ucd-section-title div.pill { margin: 0 0 0 auto; font-variant-numeric: tabular-nums; }
            #ucd-page .ucd-section-intro { margin: -.4em 0 0; color: var(--ucd-muted); max-width: 46em; }
            #ucd-page .ucd-entry-icon { width: 2.5em; height: 2.5em; flex: none; object-fit: contain; }
            #ucd-page .ucd-entry-glyph {
                display: inline-flex; align-items: center; justify-content: center;
                border-radius: 50%; background: var(--ucd-tint);
            }
            #ucd-page .ucd-entry-glyph .ucd-icon { width: 1.3em; height: 1.3em; }
            #ucd-page .ucd-actions { display: flex; flex-wrap: wrap; gap: .6em; align-items: center; }
            #ucd-page .ucd-actions .boton, #ucd-page .ucd-actions button { margin: 0; display: inline-flex; align-items: center; gap: .5em; }
            #ucd-page :is(button, .boton, input, textarea, select, label):focus-visible {
                outline: 2px solid color-mix(in srgb, currentColor 55%, transparent);
                outline-offset: 2px;
            }

            /* Configuración: lista de funciones */
            #ucd-page .ucd-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .6em 1em; }
            #ucd-page .ucd-toolbar div.pill { margin: 0; font-variant-numeric: tabular-nums; }
            #ucd-page .ucd-filter { flex: 1 1 16em; display: flex; align-items: center; gap: .5em; max-width: 24em; margin-left: auto; }
            #ucd-page .ucd-filter input { flex: 1; min-width: 0; margin: 0; }
            #ucd-page .ucd-feature-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--ucd-line); }
            #ucd-page .ucd-feature {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr) auto auto;
                align-items: center;
                gap: .4em 1em;
                padding: .75em .5em;
                border-bottom: 1px solid var(--ucd-line);
                cursor: pointer;
            }
            #ucd-page .ucd-feature:hover { background: var(--ucd-tint); }
            #ucd-page .ucd-feature-text { display: flex; flex-direction: column; min-width: 0; }
            #ucd-page .ucd-feature-name { font-weight: 600; }
            #ucd-page .ucd-feature-desc { color: var(--ucd-muted); font-size: .92em; }
            #ucd-page .ucd-feature div.pill { margin: 0; min-width: 5.5em; text-align: center; }
            #ucd-page .ucd-feature input[type=checkbox] { margin: 0 .4em; cursor: pointer; }
            #ucd-page .ucd-feature.is-off .ucd-entry-icon { filter: grayscale(1); opacity: .55; }
            #ucd-page .ucd-empty { color: var(--ucd-muted); padding: .5em; }

            /* Configuración: formularios nativos */
            #ucd-page table.form { width: 100%; }
            #ucd-page table.form th { width: 14em; vertical-align: top; }
            #ucd-page table.form input[type=text],
            #ucd-page table.form input[type=password],
            #ucd-page table.form textarea { width: 100%; box-sizing: border-box; }
            #ucd-page table.form textarea { min-height: 12em; resize: vertical; font-family: inherit; }
            #ucd-page .ucd-inline { display: flex; gap: .5em; align-items: center; }
            #ucd-page .ucd-inline input { flex: 1; min-width: 0; }
            #ucd-page .ucd-inline button { margin: 0; flex: none; }
            #ucd-page .ucd-help { display: block; margin-top: .4em; color: var(--ucd-muted); font-size: .9em; }
            #ucd-page ol.ucd-steps { margin: .3em 0 0; padding-left: 1.4em; }
            #ucd-page .ucd-storage-wrap { overflow-x: auto; }
            #ucd-page .ucd-storage-table { width: 100%; font-variant-numeric: tabular-nums; }
            #ucd-page .ucd-storage-table code {
                display: block; max-width: 38em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            #ucd-page .ucd-storage-table td:last-child { width: 1%; white-space: nowrap; }
            @media (max-width: 768px) {
                #ucd-page .ucd-feature { grid-template-columns: auto minmax(0, 1fr) auto; }
                #ucd-page .ucd-feature div.pill { display: none; }
                #ucd-page table.form th { width: auto; }
            }

            /* Logros */
            #ucd-page .ucd-progress { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .4em 1.5em; align-items: center; }
            #ucd-page .ucd-progress-count { grid-row: span 2; font-size: 2.6em; font-weight: 300; line-height: 1; font-variant-numeric: tabular-nums; }
            #ucd-page .ucd-progress-count small { font-size: .45em; color: var(--ucd-muted); }
            #ucd-page .ucd-progress div.porcentaje { display: block; width: 100%; }
            #ucd-page .ucd-progress div.porcentaje div.inner > div { transition: width .6s ease-out; }
            #ucd-page .ucd-rarity-legend { display: flex; flex-wrap: wrap; gap: .4em 1.2em; margin: 0; padding: 0; list-style: none; color: var(--ucd-muted); font-size: .92em; font-variant-numeric: tabular-nums; }
            #ucd-page .ucd-rarity-legend li { display: inline-flex; align-items: center; gap: .4em; }
            #ucd-page .ucd-rarity-dot { width: .7em; height: .7em; border-radius: 50%; background: var(--ucd-rarity); }
            #ucd-page .ucd-progress > div.info,
            #ucd-page .ucd-progress > div.ok { grid-column: 1 / -1; margin: .4em 0 0; }

            #ucd-page .ucd-achievement-grid {
                list-style: none; margin: 0; padding: 0;
                display: grid; grid-template-columns: repeat(auto-fill, minmax(15em, 1fr)); gap: 1em;
            }
            #ucd-page .ucd-achievement {
                --ucd-rarity: var(--ucd-common);
                display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .3em 1em; align-items: start;
                padding: 1em; border: 1px solid var(--ucd-line); border-radius: .5em;
            }
            #ucd-page .ucd-achievement.rarity-rare, #ucd-page .ucd-rarity-legend .rarity-rare { --ucd-rarity: var(--ucd-rare); }
            #ucd-page .ucd-achievement.rarity-epic, #ucd-page .ucd-rarity-legend .rarity-epic { --ucd-rarity: var(--ucd-epic); }
            #ucd-page .ucd-achievement.rarity-legendary, #ucd-page .ucd-rarity-legend .rarity-legendary { --ucd-rarity: var(--ucd-legendary); }
            #ucd-page .ucd-rarity-legend .rarity-common { --ucd-rarity: var(--ucd-common); }
            #ucd-page .ucd-achievement.is-unlocked { background: color-mix(in srgb, var(--ucd-rarity) 7%, transparent); border-color: color-mix(in srgb, var(--ucd-rarity) 35%, transparent); }
            #ucd-page .ucd-medal { position: relative; width: 3.6em; height: 4em; grid-row: span 3; }
            #ucd-page .ucd-medal svg.ucd-medal-shape { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
            #ucd-page .ucd-medal .ucd-medal-fill { fill: color-mix(in srgb, var(--ucd-rarity) 18%, transparent); stroke: var(--ucd-rarity); stroke-width: 3; }
            #ucd-page .ucd-medal .ucd-medal-inner { fill: none; stroke: var(--ucd-rarity); stroke-width: 1; opacity: .5; }
            #ucd-page .ucd-medal .ucd-entry-icon {
                position: absolute; left: 50%; top: 50%; width: 1.9em; height: 1.9em;
                transform: translate(-50%, -50%); background: none;
            }
            #ucd-page .ucd-medal .ucd-entry-glyph { color: var(--ucd-rarity); }
            #ucd-page .ucd-achievement.is-locked .ucd-medal-fill { fill: var(--ucd-tint); stroke: var(--ucd-line); stroke-dasharray: 5 4; }
            #ucd-page .ucd-achievement.is-locked .ucd-medal-inner { stroke: var(--ucd-line); }
            #ucd-page .ucd-achievement.is-locked .ucd-entry-icon { filter: grayscale(1); opacity: .35; }
            #ucd-page .ucd-achievement.is-locked .ucd-entry-glyph { color: inherit; }
            #ucd-page .ucd-achievement-name { margin: 0; font-size: 1em; font-weight: 600; line-height: 1.35; }
            #ucd-page .ucd-achievement-desc { margin: 0; color: var(--ucd-muted); font-size: .92em; }
            #ucd-page .ucd-achievement-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .3em .8em; font-size: .85em; color: var(--ucd-muted); }
            #ucd-page .ucd-achievement-meta .ucd-rarity { display: inline-flex; align-items: center; gap: .35em; color: var(--ucd-rarity); font-weight: 600; }
            #ucd-page .ucd-achievement.is-locked .ucd-rarity { color: var(--ucd-muted); }
            #ucd-page .ucd-achievement-meta .ucd-icon { width: 1em; height: 1em; }

            @media (prefers-reduced-motion: reduce) {
                #ucd-page * { transition: none !important; animation: none !important; }
            }
        `;
        document.head.appendChild(style);
    }

    window.UcursedntPages = Object.assign({}, Catalog, {
        escapeHTML,
        preparePage,
        sectionHeading
    });

})();
