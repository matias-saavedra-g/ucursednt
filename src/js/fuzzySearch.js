// fuzzySearch.js - Injects and handles the fuzzy search UI in the course navigation

(async function() {
    'use strict';

    if (window.fuzzySearchUILoaded) return;
    window.fuzzySearchUILoaded = true;

    // ── 1. Guard: Validate URL Context ───────────────────────────────────────
    function isCoursePage() {
        const path = window.location.pathname;
        return /^\/[^\/]+\/\d{4}\/[12]\/[^\/]+\/[^\/]+/.test(path);
    }

    if (!isCoursePage()) return;

    // ── 2. Settings check ────────────────────────────────────────────────────
    try {
        const result = await browser.storage.sync.get(['settings']);
        if (result.settings && result.settings.features && result.settings.features.fuzzySearch === false) {
            return; // Feature is disabled in settings
        }
    } catch (error) {
        console.error('Error loading fuzzySearch settings:', error);
    }

    // ── 3. Locate Required DOM Elements ──────────────────────────────────────
    const cursoContainer = document.querySelector('.curso');
    const navigationContainer = document.querySelector('#navigation');

    if (!cursoContainer || !navigationContainer) return;

    // ── 4. Inject Styles ─────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        #ucursednt-fuzzy-form {
            display: flex;
            margin-top: 15px;
            position: relative;
        }
        #ucursednt-fuzzy-form input {
            width: 100%;
            padding: 5px 30px 5px 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 13px;
            box-sizing: border-box;
        }
        #ucursednt-fuzzy-form button {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #666;
            padding: 0 10px;
        }
    `;
    document.head.appendChild(style);

    // ── 5. Build the UI ──────────────────────────────────────────────────────
    const form = document.createElement('form');
    form.id = 'ucursednt-fuzzy-form';
    form.onsubmit = (e) => {
        e.preventDefault();
        return false;
    };

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'fuzzy_q';
    input.id = '__fuzzy_q';
    input.placeholder = 'Fuzzy search...';
    input.title = 'Búsqueda rápida';

    const button = document.createElement('button');
    button.type = 'submit';
    button.innerHTML = '<i class="fa fa-search"></i>'; 

    form.appendChild(input);
    form.appendChild(button);
    cursoContainer.appendChild(form);

    // ── 6. Handle Real-Time Filtering ────────────────────────────────────────
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Re-query elements on every keystroke to catch preloaded items.
        // Targets standard lists AND forum threads.
        const searchItems = document.querySelectorAll('ul[class^="c_"] > li, div[id^="raiz_"]');

        searchItems.forEach(item => {
            const textContent = item.textContent.trim();
            
            if (window.FuzzySearchUtils && window.FuzzySearchUtils.match(query, textContent)) {
                item.style.display = ''; 
            } else {
                item.style.display = 'none'; 
            }
        });
    });
})();