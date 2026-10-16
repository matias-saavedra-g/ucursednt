// achievementToast.js - Muestra un toast al estilo Steam cada vez que se desbloquea un logro.
// Escucha los cambios del almacenamiento: los flags de interacción que guardan los demás
// scripts (p. ej. "menuBotonFirstClick") se convierten en logros permanentes, y cada id
// nuevo en "unlockedAchievements" se anuncia con un toast en la pestaña visible.

(function() {
    'use strict';

    if (window.achievementToastLoaded) return;
    window.achievementToastLoaded = true;

    if (typeof browser === 'undefined' || !browser.storage || !browser.storage.onChanged) return;

    const Catalog = window.UcursedntCatalog;
    const Utils = window.UcursedntUtils;
    const PENDING_KEY = 'ucursedntPendingAchievementToasts';

    // Toasts pendientes por pestaña: sobreviven a una recarga inmediata (p. ej. al cambiar de tema)
    function readPending() {
        try { return JSON.parse(sessionStorage.getItem(PENDING_KEY)) || []; } catch (e) { return []; }
    }

    function writePending(ids) {
        try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(ids)); } catch (e) {}
    }

    function medalHTML(achievement) {
        return `
            <div class="ucd-toast-medal" aria-hidden="true">
                <svg viewBox="0 0 64 72">
                    <polygon class="ucd-medal-fill" points="32,3 59,18.5 59,53.5 32,69 5,53.5 5,18.5"/>
                    <polygon class="ucd-medal-inner" points="32,10 53,22 53,50 32,62 11,50 11,22"/>
                </svg>
                ${Catalog.entryIcon(achievement)}
            </div>`;
    }

    function showAchievementToast(id) {
        const achievement = Catalog.findAchievement(id);
        if (!achievement) return;
        const rarity = Catalog.RARITIES[achievement.rarity] || Catalog.RARITIES.common;

        Utils.UI.toast({
            eyebrow: '¡Logro desbloqueado!',
            title: achievement.name,
            message: `<strong>${rarity.label}</strong> · ${Utils.DOM.escapeHTML(achievement.description)}`,
            iconHTML: medalHTML(achievement),
            accent: rarity.color,
            duration: 6000,
            onDone: () => writePending(readPending().filter(pendingId => pendingId !== id))
        });
    }

    // Ráfagas grandes (p. ej. la primera vez tras actualizar) se resumen en un solo toast extra
    const MAX_INDIVIDUAL = 3;

    function announce(ids) {
        const known = ids.filter(id => Catalog.findAchievement(id));
        if (!known.length) return;

        const individual = known.length > MAX_INDIVIDUAL ? known.slice(0, MAX_INDIVIDUAL - 1) : known;
        const pending = readPending();
        writePending(pending.concat(individual.filter(id => !pending.includes(id))));
        individual.forEach(showAchievementToast);

        const rest = known.length - individual.length;
        if (rest > 0) {
            Utils.UI.toast({
                eyebrow: '¡Logros desbloqueados!',
                title: `Y ${rest} logros más`,
                message: 'Revísalos en la página de Logros.',
                iconHTML: Catalog.icon('trophy'),
                accent: Catalog.RARITIES.legendary.color,
                duration: 6000
            });
        }
    }

    const isVisible = () => document.visibilityState === 'visible';

    browser.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync' || !isVisible()) return;

        // 1. Flags de interacción → logros permanentes
        const flagIds = Catalog.INTERACTIONS
            .filter(a => {
                const change = changes[a.flag || a.id];
                return change && change.newValue === true && change.oldValue !== true;
            })
            .map(a => a.id);
        if (flagIds.length) Utils.Achievements.unlock(flagIds);

        // 2. Funciones recién activadas → logros de función
        const settingsChange = changes.settings;
        if (settingsChange && settingsChange.newValue) {
            Catalog.unlockEnabledFeatureAchievements(settingsChange.newValue.features);
        }

        // 3. Logros nuevos → toast
        const unlockedChange = changes[Utils.Achievements.STORAGE_KEY];
        if (unlockedChange) {
            const before = unlockedChange.oldValue || {};
            const after = unlockedChange.newValue || {};
            announce(Object.keys(after).filter(id => !before[id]));
        }
    });

    // Mostrar los toasts que quedaron pendientes por una navegación
    function showPending() {
        const pending = readPending();
        if (pending.length) pending.forEach(showAchievementToast);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showPending);
    } else {
        showPending();
    }

})();
