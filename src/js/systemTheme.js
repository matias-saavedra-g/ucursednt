// systemTheme.js - Tema automático según la preferencia del sistema (claro/oscuro)
// Reemplaza la lista de temas del footer de U-Cursos por un dropdown que incluye
// "Focus (Sistema)" y "Clásico (Sistema)". Al elegir uno, la extensión cambia entre la
// variante clara u oscura del tema según prefers-color-scheme, y reacciona en vivo
// cuando el sistema cambia de modo.

(async function() {
    if (window.systemThemeLoaded) return;
    window.systemThemeLoaded = true;

    // Check if the feature is enabled in settings
    const settings = await UcursedntUtils.Storage.get("settings");
    if (settings && settings.features && settings.features.systemTheme === false) {
        return; // Feature is disabled
    }

    const STORAGE_KEY = 'systemThemeSettings';
    const RELOAD_GUARD_KEY = 'ucursedntSystemThemeAttempt';
    const RELOAD_GUARD_MS = 15000;
    const SYSTEM_PREFIX = 'system:';

    // Familias de tema: cada una tiene su variante clara y oscura (valores del parámetro ?theme=)
    const THEME_FAMILIES = {
        focus: { label: 'Focus (Sistema)', light: 'focus', dark: 'focus-dark' },
        classic: { label: 'Clásico (Sistema)', light: 'classic', dark: 'classic-dark' }
    };

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function getThemeFromLink(link) {
        try {
            return new URL(link.href, location.href).searchParams.get('theme');
        } catch (e) {
            return null;
        }
    }

    // Lista ordenada de temas nativos: [{ theme, label, link }]
    function getNativeThemes(themesList) {
        return Array.from(themesList.querySelectorAll(':scope > li > a'))
            .map(link => ({ theme: getThemeFromLink(link), label: link.textContent.trim(), link }))
            .filter(entry => entry.theme);
    }

    // El tema activo es el <li class="sel"> nativo del selector
    function getCurrentTheme(themesList) {
        const selected = themesList.querySelector(':scope > li.sel > a');
        return selected ? getThemeFromLink(selected) : null;
    }

    function getTargetTheme(mode) {
        const family = THEME_FAMILIES[mode];
        if (!family) return null;
        return darkQuery.matches ? family.dark : family.light;
    }

    // Evita bucles de recarga si U-Cursos no aplica el tema solicitado
    function canAttemptReload(target) {
        try {
            const raw = sessionStorage.getItem(RELOAD_GUARD_KEY);
            if (raw) {
                const attempt = JSON.parse(raw);
                if (attempt.target === target && Date.now() - attempt.ts < RELOAD_GUARD_MS) {
                    return false;
                }
            }
            sessionStorage.setItem(RELOAD_GUARD_KEY, JSON.stringify({ target, ts: Date.now() }));
        } catch (e) {
            // sessionStorage no disponible: seguimos sin protección
        }
        return true;
    }

    function clearReloadGuard() {
        try { sessionStorage.removeItem(RELOAD_GUARD_KEY); } catch (e) {}
    }

    // Quita ?theme= de la URL tras un cambio automático para no dejarlo pegado al navegar
    function cleanThemeParam() {
        const url = new URL(location.href);
        if (!url.searchParams.has('theme')) return;
        url.searchParams.delete('theme');
        history.replaceState(history.state, '', url.toString());
    }

    function applySystemTheme(themesList, mode) {
        const target = getTargetTheme(mode);
        const current = getCurrentTheme(themesList);
        if (!target || !current) return;

        if (current === target) {
            clearReloadGuard();
            cleanThemeParam();
            return;
        }

        const entry = getNativeThemes(themesList).find(t => t.theme === target);
        if (!entry) return;

        if (!canAttemptReload(target)) {
            console.warn(`U-Cursedn't: no se pudo aplicar el tema "${target}" automáticamente.`);
            return;
        }

        location.replace(entry.link.href);
    }

    function addPickerStyles() {
        if (document.getElementById('ucursednt-theme-picker-styles')) return;
        const style = document.createElement('style');
        style.id = 'ucursednt-theme-picker-styles';
        style.textContent = `
            #footer li.theme.ucursednt-has-picker > a,
            #footer li.theme.ucursednt-has-picker > ul.themes {
                display: none !important;
            }
            #footer .ucursednt-theme-picker {
                display: inline-flex;
                align-items: center;
                gap: .5em;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        UcursedntUtils.UI.ensureSelectStyles();
    }

    function createOption(value, label) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        return option;
    }

    // Construye el dropdown: un grupo automático (sistema) y un grupo con los temas nativos
    function createPicker(nativeThemes, availableModes) {
        const label = document.createElement('label');
        label.className = 'ucursednt-theme-picker';
        label.htmlFor = 'ucursednt-theme-select';
        UcursedntUtils.DOM.safeSetHTML(label, '<i class="fa-regular fa-paint-roller"></i> Tema');

        const select = document.createElement('select');
        select.id = 'ucursednt-theme-select';
        select.className = 'ucd-select';
        select.title = 'Los temas "(Sistema)" alternan entre claro y oscuro según la preferencia de tu sistema';

        const systemGroup = document.createElement('optgroup');
        systemGroup.label = 'Automático';
        availableModes.forEach(mode => {
            systemGroup.appendChild(createOption(SYSTEM_PREFIX + mode, THEME_FAMILIES[mode].label));
        });

        const manualGroup = document.createElement('optgroup');
        manualGroup.label = 'Manual';
        nativeThemes.forEach(({ theme, label: themeLabel }) => {
            manualGroup.appendChild(createOption(theme, themeLabel));
        });

        select.appendChild(systemGroup);
        select.appendChild(manualGroup);
        label.appendChild(select);
        return { label, select };
    }

    async function init() {
        const themeItem = document.querySelector('#footer li.theme');
        const themesList = themeItem && themeItem.querySelector('ul.themes');
        if (!themesList || themeItem.classList.contains('ucursednt-has-picker')) return;

        const nativeThemes = getNativeThemes(themesList);
        const nativeValues = nativeThemes.map(t => t.theme);
        const availableModes = Object.keys(THEME_FAMILIES).filter(mode =>
            nativeValues.includes(THEME_FAMILIES[mode].light) && nativeValues.includes(THEME_FAMILIES[mode].dark)
        );
        if (!availableModes.length) return;

        const stored = await UcursedntUtils.Storage.get(STORAGE_KEY) || {};
        let mode = availableModes.includes(stored.mode) ? stored.mode : null;

        addPickerStyles();
        const { label, select } = createPicker(nativeThemes, availableModes);
        select.value = mode ? SYSTEM_PREFIX + mode : (getCurrentTheme(themesList) || '');
        themeItem.classList.add('ucursednt-has-picker');
        themeItem.appendChild(label);

        select.addEventListener('change', async () => {
            const value = select.value;

            if (value.startsWith(SYSTEM_PREFIX)) {
                mode = value.slice(SYSTEM_PREFIX.length);
                await UcursedntUtils.Storage.set(STORAGE_KEY, { mode });
                await UcursedntUtils.Storage.set('systemThemeFirstUse', true);
                await UcursedntUtils.Achievements.unlock('systemThemeFirstUse');
                clearReloadGuard();
                applySystemTheme(themesList, mode);
                return;
            }

            // Elegir un tema nativo desactiva el modo sistema antes de navegar
            mode = null;
            await UcursedntUtils.Storage.set(STORAGE_KEY, { mode: null });
            const entry = nativeThemes.find(t => t.theme === value);
            if (entry) location.href = entry.link.href;
        });

        // Reaccionar en vivo cuando el sistema cambia entre claro y oscuro
        darkQuery.addEventListener('change', () => {
            if (mode) applySystemTheme(themesList, mode);
        });

        if (mode) applySystemTheme(themesList, mode);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
