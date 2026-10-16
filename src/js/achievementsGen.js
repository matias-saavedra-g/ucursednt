(async function() {

    const Pages = window.UcursedntPages;
    const { icon, entryIcon, escapeHTML } = Pages;

    const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

    // Sincroniza los logros con el estado actual y devuelve el mapa persistente { id: timestamp }.
    // Un logro desbloqueado se mantiene aunque después se desactive la función.
    async function syncUnlockedAchievements() {
        const settings = await UcursedntUtils.Storage.get('settings');
        const storageItems = await UcursedntUtils.Storage.getAll();

        await Pages.unlockEnabledFeatureAchievements(settings && settings.features);

        const interactionIds = Pages.INTERACTIONS
            .filter(a => storageItems[a.flag || a.id] === true)
            .map(a => a.id);
        return UcursedntUtils.Achievements.unlock(interactionIds);
    }

    function completionMessage(percentage) {
        if (percentage === 100) return '¡Eres el dios de U-Cursos! Ya te puedes titular de la carrera.';
        if (percentage >= 90) return '¡Increíble! Has completado más del 90% de los logros.';
        if (percentage >= 80) return '¡Genial! Has completado más del 80% de los logros.';
        if (percentage >= 70) return '¡Muy bien! Has completado más del 70% de los logros.';
        if (percentage >= 60) return '¡Buen trabajo! Has completado más del 60% de los logros.';
        if (percentage >= 50) return '¡Bien hecho! Has completado más de la mitad de los logros.';
        if (percentage >= 40) return '¡Sigue así! Has completado más del 40% de los logros.';
        if (percentage >= 30) return '¡No te detengas! Has completado más del 30% de los logros.';
        if (percentage >= 20) return '¡Estás en buen camino! Has completado más del 20% de los logros.';
        if (percentage >= 10) return '¡Buen comienzo! Has completado más del 10% de los logros.';
        return 'Usa las funciones de la extensión para empezar a desbloquear logros.';
    }

    function formatDate(timestamp) {
        try {
            return new Date(timestamp).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return '';
        }
    }

    // Medalla hexagonal; el color de la rareza se aplica por CSS
    function medalHTML(achievement) {
        return `
            <div class="ucd-medal" aria-hidden="true">
                <svg class="ucd-medal-shape" viewBox="0 0 64 72">
                    <polygon class="ucd-medal-fill" points="32,3 59,18.5 59,53.5 32,69 5,53.5 5,18.5"/>
                    <polygon class="ucd-medal-inner" points="32,10 53,22 53,50 32,62 11,50 11,22"/>
                </svg>
                ${entryIcon(achievement)}
            </div>`;
    }

    function achievementCardHTML(achievement, unlockedAt) {
        const rarity = Pages.RARITIES[achievement.rarity] || Pages.RARITIES.common;
        const state = unlockedAt
            ? `<span>${icon('check')} Desbloqueado el ${escapeHTML(formatDate(unlockedAt))}</span>`
            : `<span>${icon('lock')} Bloqueado</span>`;

        return `
            <li class="ucd-achievement rarity-${achievement.rarity} ${unlockedAt ? 'is-unlocked' : 'is-locked'}">
                ${medalHTML(achievement)}
                <h3 class="ucd-achievement-name">${escapeHTML(achievement.name)}</h3>
                <p class="ucd-achievement-desc">${escapeHTML(achievement.description)}</p>
                <div class="ucd-achievement-meta">
                    <span class="ucd-rarity">${rarity.label}</span>
                    ${state}
                </div>
            </li>`;
    }

    function createProgressSection(achievements, unlocked) {
        const total = achievements.length;
        const unlockedCount = achievements.filter(a => unlocked[a.id]).length;
        const percentage = total ? Math.floor((unlockedCount / total) * 100) : 0;

        const legend = RARITY_ORDER.map(rarityId => {
            const ofRarity = achievements.filter(a => a.rarity === rarityId);
            if (!ofRarity.length) return '';
            const done = ofRarity.filter(a => unlocked[a.id]).length;
            return `<li class="rarity-${rarityId}"><span class="ucd-rarity-dot"></span>${Pages.RARITIES[rarityId].label} ${done}/${ofRarity.length}</li>`;
        }).join('');

        const section = document.createElement('section');
        section.setAttribute('aria-label', 'Progreso');
        UcursedntUtils.DOM.safeSetHTML(section, `
            <p class="lead">Desbloquea logros activando y usando las funciones de U-Cursedn't. Una vez desbloqueado, un logro se mantiene aunque después desactives la función.</p>
            <div class="ucd-progress">
                <div class="ucd-progress-count">${unlockedCount}<small> / ${total}</small></div>
                <div class="porcentaje" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}" aria-label="Logros desbloqueados">
                    <span>${percentage}%</span>
                    <div class="inner"><div class="ok" style="width: ${percentage}%"></div></div>
                </div>
                <ul class="ucd-rarity-legend">${legend}</ul>
                <div class="${percentage === 100 ? 'ok' : 'info'}">${escapeHTML(completionMessage(percentage))}</div>
            </div>
        `);
        return section;
    }

    function createCategorySection(title, iconName, achievements, unlocked) {
        const unlockedCount = achievements.filter(a => unlocked[a.id]).length;
        const pillClass = unlockedCount === achievements.length ? 'pill ok' : 'pill';

        const section = document.createElement('section');
        UcursedntUtils.DOM.safeSetHTML(section, `
            ${Pages.sectionHeading(iconName, title, `<div class="${pillClass}">${unlockedCount}/${achievements.length}</div>`)}
            <ul class="ucd-achievement-grid">
                ${achievements.map(a => achievementCardHTML(a, unlocked[a.id])).join('')}
            </ul>
        `);
        return section;
    }

    async function initPage() {
        const page = Pages.preparePage('Logros');
        const unlocked = await syncUnlockedAchievements();

        const featureAchievements = Pages.featureAchievements();
        const interactionAchievements = Pages.INTERACTIONS;
        const all = featureAchievements.concat(interactionAchievements);

        page.appendChild(createProgressSection(all, unlocked));
        page.appendChild(createCategorySection('Funciones de la extensión', 'sliders', featureAchievements, unlocked));
        page.appendChild(createCategorySection('Interacciones y descubrimientos', 'pointer', interactionAchievements, unlocked));
    }

    await initPage();

})();
