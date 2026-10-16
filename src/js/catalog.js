// catalog.js - Catálogo compartido de U-Cursedn't: funciones, logros, rarezas e íconos SVG.
// Se carga en todas las páginas de U-Cursos para que el toast de logros y las páginas
// de Configuración y Logros usen la misma fuente de datos.

(function() {
    'use strict';

    if (window.UcursedntCatalog) return;

    const SERVICE_ICON_URL = 'https://static.u-cursos.cl/images/servicios/';

    // ── 1. Íconos SVG (24×24, trazo con currentColor) ───────────────────────
    const ICON_PATHS = {
        sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
        trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5a2.5 2.5 0 0 0 2.9 3.6M16 6h2.5a2.5 2.5 0 0 1-2.9 3.6"/><path d="M12 13v4M9 21h6M10 17h4v4h-4z"/>',
        check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
        lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
        search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
        sparkles: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
        heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.1 4.1 0 0 1 12 7.4a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
        bot: '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4.5V8M2 13v2M22 13v2"/><circle cx="12" cy="3.5" r="1"/><path d="M9 13v1.5M15 13v1.5"/>',
        contrast: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/>',
        map: '<path d="M3.5 6.5l5-2 7 2.5 5-2v13l-5 2-7-2.5-5 2z"/><path d="M8.5 4.5v13M15.5 7v13"/>',
        textFold: '<path d="M4 5h16M4 9.5h16M4 14h8"/><path d="M15 14.5l2.5 2.5 2.5-2.5"/>',
        database: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
        trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>',
        eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
        eyeOff: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
        key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M13.5 9.5l2 2"/>',
        music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
        save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
        undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
        pointer: '<path d="M5 3.5l13 6.5-5.5 1.8-2.3 5.7z"/><path d="M13 12.5l5 5"/>',
        info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
        copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
        book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
        calendarCheck: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M9 15l2 2 4-4"/>',
        compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
        calculator: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15v2.5M8.5 18h.01M12 18h.01"/>',
        send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
        x: '<path d="M6 6l12 12M18 6L6 18"/>'
    };

    function icon(name, extraClass = '') {
        const paths = ICON_PATHS[name] || ICON_PATHS.info;
        return `<svg class="ucd-icon ${extraClass}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
    }

    // ── 2. Catálogo de funciones ────────────────────────────────────────────
    // service: ícono de servicio de U-Cursos; icon: ícono SVG propio cuando no hay equivalente.
    const GROUPS = [
        { id: 'copy', title: 'Copiar y exportar', icon: 'copy' },
        { id: 'courses', title: 'Cursos y foros', icon: 'book' },
        { id: 'tasks', title: 'Tareas, horario y avisos', icon: 'calendarCheck' },
        { id: 'interface', title: 'Navegación e interfaz', icon: 'compass' },
        { id: 'assistant', title: 'Asistente y ayuda', icon: 'bot' }
    ];

    const FEATURES = [
        { id: 'easyCopyGrades', group: 'copy', service: 'notas', name: 'Copia fácil de notas', description: 'Botones para copiar notas en distintos formatos.',
          achievement: { name: 'Copia Fácil de Notas', rarity: 'common' } },
        { id: 'easyCopyMembers', group: 'copy', service: 'integrantes', name: 'Copia fácil de integrantes', description: 'Copia el listado de integrantes del curso.',
          achievement: { name: 'Copia Fácil de Miembros', rarity: 'common' } },
        { id: 'easyCopyCourseDetails', group: 'copy', service: 'datos_curso', name: 'Copia fácil de datos del curso', description: 'Copia el nombre y el código del curso con un clic.',
          achievement: { name: 'Copia Fácil de Datos del Curso', rarity: 'common' } },
        { id: 'forumDownload', group: 'copy', service: 'material_alumnos', name: 'Descargar foro', description: 'Descarga hilos del foro en TXT, JSON o CSV por rango de páginas.',
          achievement: { name: 'Descargador de Foro', rarity: 'rare' } },

        { id: 'forumInteraction', group: 'courses', service: 'foro', name: 'Interacción con foros', description: 'Copia posts e hilos, o envíalos a Claude, ChatGPT, Gemini o Perplexity.',
          achievement: { name: 'Interacción con Foros', rarity: 'rare' } },
        { id: 'muchoTexto', group: 'courses', icon: 'textFold', name: 'Recortar texto largo', description: 'Colapsa los posts muy largos del foro tras un botón "Mucho Texto".',
          achievement: { name: 'Recortar Texto Largo', rarity: 'common' } },
        { id: 'otrasRealizaciones', group: 'courses', service: 'todos_cursos', name: 'Otras realizaciones del curso', description: 'Acceso directo a versiones anteriores del mismo curso.',
          achievement: { name: 'Otras Realizaciones del Curso', rarity: 'common' } },
        { id: 'popupGrading', group: 'courses', service: 'notas', name: 'Calificaciones en ventana emergente', description: 'Abre el editor de calificaciones en un popup.',
          achievement: { name: 'Ventana Emergente de Calificaciones', rarity: 'rare' } },
        { id: 'resizePreviewPDF', group: 'courses', service: 'material_docente', name: 'Redimensionar vista previa de PDF', description: 'Ajusta la altura del visor de PDF.',
          achievement: { name: 'Redimensionar Vista Previa de PDF', rarity: 'rare' } },
        { id: 'gradesWeights', group: 'courses', service: 'actas', name: 'Ponderador de notas', description: 'Agrega una columna de pesos a la página de notas y calcula tu nota final.',
          achievement: { name: 'Ponderador de Notas', rarity: 'rare' } },
        { id: 'renameCourses', group: 'courses', service: 'mis_canales', name: 'Renombrar cursos', description: 'Ponle a cada curso el nombre que prefieras.',
          achievement: { name: 'Renombrar Cursos', rarity: 'epic' } },

        { id: 'weekCounter', group: 'tasks', service: 'horario', name: 'Contador de semanas', description: 'Muestra la semana lectiva actual en tu horario.',
          achievement: { name: 'Contador de Semanas', rarity: 'common' } },
        { id: 'pendingTasks', group: 'tasks', service: 'tareas_usuario', name: 'Insignia de tareas pendientes', description: 'Cuenta tus tareas pendientes en el menú.',
          achievement: { name: 'Notificación de Tareas Pendientes', rarity: 'common' } },
        { id: 'pendingNotifications', group: 'tasks', service: 'novedades', name: 'Notificaciones pendientes', description: 'Cuenta las novedades no leídas en cada sección.',
          achievement: { name: 'Notificación de Pendientes', rarity: 'common' } },
        { id: 'tareaPrefill', group: 'tasks', service: 'tareas', name: 'Autocompletar tareas', description: 'Rellena el tiempo invertido y un comentario al entregar una tarea.' },
        { id: 'taskSubmissionSound', group: 'tasks', icon: 'music', name: 'Sonido de entrega de tareas', description: 'Reproduce un sonido de recompensa al entregar una tarea.',
          achievement: { name: 'Sonido de Entrega de Tareas', rarity: 'epic' } },

        { id: 'collapsableMenus', group: 'interface', service: 'favoritos', name: 'Secciones colapsables', description: 'Colapsa secciones de la página principal y recuerda su estado.',
          achievement: { name: 'Secciones Colapsables', rarity: 'common' } },
        { id: 'fuzzySearch', group: 'interface', service: 'buscador', name: 'Búsqueda en navegación', description: 'Filtra al instante el menú lateral y los listados de cada curso.' },
        { id: 'autoPreloadPages', group: 'interface', service: 'historial', name: 'Autocarga de páginas', description: 'Carga la página siguiente al llegar al final del historial o del foro.' },
        { id: 'navigationAnimations', group: 'interface', icon: 'sparkles', name: 'Animaciones de navegación', description: 'Efecto de magnificación al pasar el cursor por el menú.' },
        { id: 'systemTheme', group: 'interface', icon: 'contrast', name: 'Tema según el sistema', description: 'Agrega Focus y Clásico (Sistema) al selector de temas del pie de página.',
          achievement: { name: 'Tema según el Sistema', rarity: 'common' } },
        { id: 'footerCredit', group: 'interface', icon: 'heart', name: 'Crédito en el pie de página', description: 'Muestra el crédito del desarrollador al final de cada página.' },

        { id: 'aiChatPopup', group: 'assistant', image: 'images/ucursitos.png', name: 'Preguntar a la IA', description: 'UCursitos abre tu pregunta en Claude, ChatGPT, Gemini o Perplexity, con el contexto de la página si quieres.' },
        { id: 'tourGuide', group: 'assistant', icon: 'map', name: 'Guía de usuario', description: 'Muestra avisos al descubrir funciones nuevas.', defaultEnabled: false }
    ];

    // ── 3. Logros por interacción (se desbloquean con flags que guardan otros scripts) ──
    const INTERACTIONS = [
        { id: 'menuBotonFirstClick', icon: 'sliders', name: 'Primer Click en Menú', description: 'Abre el menú de configuración por primera vez.', rarity: 'rare' },
        { id: 'showMoreFirstClick', icon: 'textFold', name: 'Primer Click en Mostrar Más', description: 'Expande un post recortado por "Mucho Texto".', rarity: 'rare' },
        { id: 'resizableFirstHover', service: 'material_docente', name: 'Primer Hover en Redimensionable', description: 'Pasa el cursor sobre un visor de PDF redimensionable.', rarity: 'rare' },
        { id: 'otherRealizationsFirstClick', service: 'todos_cursos', name: 'Primer Click en Otras Realizaciones', description: 'Visita otra realización de un curso.', rarity: 'epic' },
        { id: 'pendingTasksFirstHover', service: 'tareas_usuario', name: 'Primer Hover en Tareas Pendientes', description: 'Revisa la insignia de tareas pendientes.', rarity: 'rare' },
        { id: 'achievementsBotonFirstClick', icon: 'trophy', name: 'Primer Click en Botón de Logros', description: 'Abre esta página de logros por primera vez.', rarity: 'legendary' },
        { id: 'scheduleDateFirstHover', service: 'calendario', name: 'Primer Hover en Fecha de Programación', description: 'Pasa el cursor sobre una fecha programada.', rarity: 'epic' },
        { id: 'collapsableMenusFirstClick', service: 'favoritos', name: 'Primer Click en Menús Colapsables', description: 'Colapsa una sección de la página principal.', rarity: 'rare' },
        { id: 'taskSubmissionSoundFirstClick', icon: 'music', name: 'Primer Sonido de Entrega', description: 'Escucha el sonido de entrega de tareas.', rarity: 'legendary' },
        { id: 'navigationAnimationsDiscovered', flag: 'navigationAnimations', icon: 'sparkles', name: 'Animaciones de Navegación', description: 'Descubre las animaciones del menú de navegación.', rarity: 'legendary' },
        { id: 'forumDownloadFirstUse', service: 'foro', name: 'Archivista del Foro', description: 'Descarga un foro por primera vez.', rarity: 'epic' },
        { id: 'systemThemeFirstUse', icon: 'contrast', name: 'Camaleón', description: 'Elige un tema que se adapta a tu sistema.', rarity: 'rare' },
        { id: 'gradesWeightsFirstUse', icon: 'calculator', name: 'Calculadora en Mano', description: 'Ingresa tu primer peso en el ponderador de notas.', rarity: 'rare' },
        { id: 'aiProviderFirstUse', icon: 'send', name: 'Segunda Opinión', description: 'Envía contenido de U-Cursos a un asistente de IA.', rarity: 'epic' }
    ];

    const RARITIES = {
        common: { label: 'Común', color: '#8b969e' },
        rare: { label: 'Raro', color: '#3d8fd6' },
        epic: { label: 'Épico', color: '#9c62cc' },
        legendary: { label: 'Legendario', color: '#d39a1c' }
    };

    function isFeatureEnabled(features, feature) {
        const value = features ? features[feature.id] : undefined;
        if (typeof value === 'boolean') return value;
        return feature.defaultEnabled !== false;
    }

    function defaultFeatureSettings() {
        const features = {};
        FEATURES.forEach(feature => { features[feature.id] = feature.defaultEnabled !== false; });
        return features;
    }

    // Logros de funciones: uno por cada función con metadata de logro
    function featureAchievements() {
        return FEATURES.filter(f => f.achievement).map(f => ({
            id: f.id,
            featureId: f.id,
            service: f.service,
            icon: f.icon,
            image: f.image,
            name: f.achievement.name,
            description: `Activa la función "${f.name}".`,
            rarity: f.achievement.rarity
        }));
    }

    // Desbloquea (de forma permanente) los logros de las funciones activas
    async function unlockEnabledFeatureAchievements(features) {
        const ids = FEATURES.filter(f => f.achievement && isFeatureEnabled(features, f)).map(f => f.id);
        return UcursedntUtils.Achievements.unlock(ids);
    }

    // Ícono de una función o logro: servicio de U-Cursos, imagen de la extensión o SVG propio
    function entryIcon(entry) {
        if (entry.service) {
            return `<img class="ucd-entry-icon" src="${SERVICE_ICON_URL}${entry.service}.svg" alt="" loading="lazy">`;
        }
        if (entry.image && typeof browser !== 'undefined' && browser.runtime) {
            return `<img class="ucd-entry-icon" src="${browser.runtime.getURL(entry.image)}" alt="">`;
        }
        return `<span class="ucd-entry-icon ucd-entry-glyph">${icon(entry.icon || 'sparkles')}</span>`;
    }

    // Busca un logro (de función o de interacción) por id
    function findAchievement(id) {
        return featureAchievements().find(a => a.id === id) || INTERACTIONS.find(a => a.id === id) || null;
    }

    window.UcursedntCatalog = {
        SERVICE_ICON_URL,
        GROUPS,
        FEATURES,
        INTERACTIONS,
        RARITIES,
        icon,
        entryIcon,
        isFeatureEnabled,
        defaultFeatureSettings,
        featureAchievements,
        unlockEnabledFeatureAchievements,
        findAchievement
    };

})();
