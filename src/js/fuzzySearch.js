// fuzzySearch.js - Injects and handles the fuzzy search UI in the course navigation

(async function() {
    'use strict';

    if (window.fuzzySearchUILoaded) return;
    window.fuzzySearchUILoaded = true;

    // ── 1. Guard: Validate URL Context ───────────────────────────────────────
    // function isCoursePage() {
    //     const path = window.location.pathname;
    //     return /^\/[^\/]+\/\d{4}\/[12]\/[^\/]+\/[^\/]+/.test(path);
    // }

    // if (!isCoursePage()) return;

    // ── 2. Settings check ────────────────────────────────────────────────────
    if (typeof UcursedntUtils !== 'undefined') {
        const settings = await UcursedntUtils.Storage.get('settings');
        if (settings && settings.features && settings.features.fuzzySearch === false) {
            return; 
        }
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
            width: 69%;
            padding: 5px 30px 5px 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 13px;
            box-sizing: border-box;
        }
        #ucursednt-fuzzy-form button {
            position: absolute;
            right: 31%; /* Adjust based on input width */
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
    navigationContainer.insertBefore(form, navigationContainer.firstChild);
    console.log('Fuzzy Search UI injected successfully.');

    // ── 6. Debounce Helper ───────────────────────────────────────────────────
    // Limits how often the search runs to prevent freezing during fast typing
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // ── 7. Handle Real-Time Filtering ────────────────────────────────────────
    const executeSearch = debounce((e) => {
        const query = e.target.value.trim();
        
        // Smart Selectors: Target logical UI blocks instead of every single nested node
        // Covers: Sidebar modules, lists inside navigation, table rows (grades/members), and forum threads
        const searchItems = document.querySelectorAll(`
            .curso ul.modulos > li, 
            #navigation ul:not(.paginas):not(#navbar) > li, 
            #navigation table tbody tr, 
            #navigation div[id^="raiz_"]
        `);

        searchItems.forEach(item => {
            // textContent automatically grabs all text inside nested elements (titles, authors, dates, content)
            const textContent = item.textContent.trim();
            
            if (window.FuzzySearchUtils && window.FuzzySearchUtils.match(query, textContent)) {
                item.style.display = ''; 
            } else {
                item.style.display = 'none'; 
            }
        });
    }, 250); // 250ms delay

    input.addEventListener('input', executeSearch);
})();