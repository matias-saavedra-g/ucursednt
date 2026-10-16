// ucursosActivity.js - Logros por acciones típicas de U-Cursos (no de la extensión):
// leer y publicar en foros, revisar notas, entregar tareas, marcar estrellas, votar, etc.
// Los ids y textos de cada logro viven en catalog.js (UCURSOS_ACTIONS).
//
// Los clicks y envíos de formularios suelen navegar a otra página antes de que termine
// la escritura en el almacenamiento, así que se encolan en sessionStorage (síncrono) y
// se procesan de inmediato o, si la página alcanzó a cambiar, al cargar la siguiente.

(function() {
    'use strict';

    if (window.ucursosActivityLoaded) return;
    window.ucursosActivityLoaded = true;

    const Utils = window.UcursedntUtils;
    if (!Utils || !Utils.Achievements) return;

    const STATE_KEY = 'ucursosActivity';
    const QUEUE_KEY = 'ucursedntActivityQueue';
    const THEMES = ['focus', 'focus-dark', 'classic', 'classic-dark'];
    const FORUM_MODULES = ['foro', 'foro_institucion'];
    const MATERIAL_MODULES = ['material_docente', 'material_alumnos', 'materiales'];

    const MARKET_RE = /\b(vendo|compro|se vende|regalo|se regala|arriendo|permuto)\b/i;
    const GRADES_RE = /\bnotas?\b/i;

    const LIMITS = {
        forumPosts: 10,
        gradesVisits: 5,
        downloads: 10,
        communities: 3,
        modules: 12,
        deepPage: 49,      // ?p es 0-indexado: 49 = página 50
        oldCourseYears: 5,
        hotThreadReplies: 10
    };

    // ── Contexto de la página ───────────────────────────────────────────────
    const pathParts = location.pathname.split('/').filter(Boolean);
    const params = new URLSearchParams(location.search);

    // Módulo actual: el servicio marcado en la barra de módulos o, si no hay, la clase de #body
    function currentModule() {
        if (pathParts[0] === 'm' && pathParts[1] === 'buscador') return 'buscador';
        const selected = document.querySelector('ul.modulos li.servicio.sel');
        if (selected) {
            const cls = Array.from(selected.classList).find(c => c.startsWith('servicio_'));
            if (cls) return cls.slice('servicio_'.length);
        }
        const body = document.getElementById('body');
        if (body) {
            const cls = Array.from(body.classList).find(c => c !== 'ucursos' && !THEMES.includes(c));
            if (cls) return cls;
        }
        return null;
    }

    // /<institución>/<año>/<semestre>/<código>/<sección>/... ; semestre 0 = comunidad
    function currentCourse() {
        if (pathParts.length < 5 || !/^\d{4}$/.test(pathParts[1]) || !/^\d+$/.test(pathParts[2])) return null;
        return {
            year: Number(pathParts[1]),
            semester: Number(pathParts[2]),
            key: pathParts.slice(0, 5).join('/'),
            isCommunity: pathParts[2] === '0'
        };
    }

    function ownUserHash() {
        const widget = document.querySelector('#widget_perfil');
        const cls = widget ? Array.from(widget.classList).find(c => c.startsWith('usuario.')) : null;
        return cls ? cls.slice('usuario.'.length) : null;
    }

    function dayKey(date) {
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    // Vista de un solo hilo (permalink /foro/o/<id> o detalle)
    function isSingleThreadView() {
        return pathParts.includes('o') || /detalle/.test(location.pathname);
    }

    // ── Estado persistente (contadores) ────────────────────────────────────
    async function loadState() {
        const state = await Utils.Storage.get(STATE_KEY);
        return state && typeof state === 'object' ? state : {};
    }

    function addUnique(list, value, max = 60) {
        const arr = Array.isArray(list) ? list : [];
        if (!arr.includes(value)) arr.push(value);
        return arr.slice(-max);
    }

    // ── Cola de eventos (sessionStorage) ───────────────────────────────────
    function readQueue() {
        try { return JSON.parse(sessionStorage.getItem(QUEUE_KEY)) || []; } catch (e) { return []; }
    }

    function writeQueue(events) {
        try { sessionStorage.setItem(QUEUE_KEY, JSON.stringify(events)); } catch (e) {}
    }

    function enqueue(type, data = {}) {
        writeQueue(readQueue().concat({ type, hour: new Date().getHours(), ...data }));
        setTimeout(processQueue, 0);
    }

    // Aplica los eventos encolados a los contadores y devuelve los logros que corresponden
    function applyEvent(event, state, ids) {
        switch (event.type) {
            case 'forumPost':
                state.forumPosts = (state.forumPosts || 0) + 1;
                ids.push('ucFirstPost');
                if (state.forumPosts >= LIMITS.forumPosts) ids.push('ucForumRegular');
                break;
            case 'taskSubmit':
                ids.push('ucTaskSubmit');
                if (event.hour === 23) ids.push('ucLastMinute');
                break;
            case 'download':
                state.downloads = (state.downloads || 0) + 1;
                if (state.downloads >= LIMITS.downloads) ids.push('ucMaterialHoarder');
                break;
            case 'threadTitle':
                if (MARKET_RE.test(event.title)) ids.push('ucMarketplace');
                if (GRADES_RE.test(event.title)) ids.push('ucGradesThread');
                break;
            default:
                // Eventos sin contador: el tipo es directamente el id del logro
                if (event.achievement) ids.push(event.achievement);
        }
    }

    // Serializa las lecturas/escrituras del estado para no perder incrementos
    let lock = Promise.resolve();
    function exclusive(task) {
        const run = lock.then(task, task);
        lock = run.catch(() => {});
        return run;
    }

    function processQueue() {
        return exclusive(async () => {
            const events = readQueue();
            if (!events.length) return;
            writeQueue([]); // vaciar antes de procesar evita contar dos veces tras una navegación

            const state = await loadState();
            const ids = [];
            events.forEach(event => applyEvent(event, state, ids));
            await Utils.Storage.set(STATE_KEY, state);
            if (ids.length) await Utils.Achievements.unlock(ids);
        });
    }

    // ── Logros al cargar la página ─────────────────────────────────────────
    function forumPageAchievements(module, ids) {
        if (!FORUM_MODULES.includes(module)) return;
        ids.push(module === 'foro' ? 'ucForumVisit' : 'ucForoInstitucion');

        const threads = document.querySelectorAll('div[id^="raiz_"]');
        const hasHotThread = Array.from(threads)
            .some(thread => thread.querySelectorAll('.msg.hijo').length >= LIMITS.hotThreadReplies);
        if (hasHotThread) ids.push('ucHotThread');

        if (isSingleThreadView()) {
            const title = document.querySelector('#mensaje-titulo');
            if (title) applyEvent({ type: 'threadTitle', title: title.textContent }, {}, ids);
        }
    }

    function moduleAchievements(module, ids) {
        const byModule = {
            asistencias2: 'ucAttendance',
            clases: 'ucVirtualClass',
            historial: 'ucHistorial',
            afiches: 'ucPosters',
            novedades_institucion: 'ucNews',
            buscador: 'ucSearch'
        };
        if (byModule[module]) ids.push(byModule[module]);

        // "No hay tareas": U-Cursos muestra la mascota feliz
        if (module === 'tareas_usuario' && document.querySelector('.mascota.mascota-ok')) ids.push('ucNoHomework');
    }

    function contextAchievements(ids) {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        if (hour < 5) ids.push('ucNightOwl');
        if (day === 0 || day === 6) ids.push('ucWeekend');
        if (now.getMonth() === 8 && now.getDate() >= 17 && now.getDate() <= 19) ids.push('ucDieciocho');

        const themeCss = document.querySelector('link#css_ucampus');
        if (themeCss && /-dark\./.test(themeCss.getAttribute('href') || '')) ids.push('ucDarkTheme');
        if ((document.documentElement.lang || '').toLowerCase().startsWith('en')) ids.push('ucEnglish');

        if (Number(params.get('p')) >= LIMITS.deepPage) ids.push('ucDeepScroll');

        const course = currentCourse();
        if (course && !course.isCommunity && now.getFullYear() - course.year >= LIMITS.oldCourseYears) {
            ids.push('ucArchaeologist');
        }

        const ownHash = ownUserHash();
        if (pathParts[0] === 'usuario' && /^[0-9a-f]{32}$/.test(pathParts[1] || '') && ownHash && pathParts[1] !== ownHash) {
            ids.push('ucProfileVisit');
        }
    }

    // Contadores que dependen de la visita: racha de días, módulos, comunidades y F5 a las notas
    function updateVisitState(state, module, ids) {
        const now = new Date();
        const today = dayKey(now);
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(now.getDate() - 1);

        if (state.lastDay !== today) {
            state.streak = state.lastDay === dayKey(yesterdayDate) ? (state.streak || 0) + 1 : 1;
            state.lastDay = today;
        }
        if (state.streak >= 7) ids.push('ucStreak7');
        if (state.streak >= 30) ids.push('ucStreak30');

        if (module) {
            state.modules = addUnique(state.modules, module);
            if (state.modules.length >= LIMITS.modules) ids.push('ucExplorer');
        }

        const course = currentCourse();
        if (course && course.isCommunity) {
            state.communities = addUnique(state.communities, course.key);
            if (state.communities.length >= LIMITS.communities) ids.push('ucCommunities');
        }

        if (module === 'notas' && course) {
            const visits = state.gradesVisits && state.gradesVisits.day === today && state.gradesVisits.course === course.key
                ? state.gradesVisits.count + 1
                : 1;
            state.gradesVisits = { day: today, course: course.key, count: visits };
            if (visits >= LIMITS.gradesVisits) ids.push('ucGradesF5');
        }
    }

    async function onPageLoad() {
        const module = currentModule();
        const ids = [];

        forumPageAchievements(module, ids);
        moduleAchievements(module, ids);
        contextAchievements(ids);

        await exclusive(async () => {
            const state = await loadState();
            const before = JSON.stringify(state);
            updateVisitState(state, module, ids);
            // Solo escribir si algo cambió: storage.sync limita las escrituras por minuto
            if (JSON.stringify(state) !== before) await Utils.Storage.set(STATE_KEY, state);
            if (ids.length) await Utils.Achievements.unlock(ids);
        });
        await processQueue();
    }

    // ── Clicks ──────────────────────────────────────────────────────────────
    function onClick(event) {
        // Reacciones: el modal (?adh_accion=modal) muestra <span onclick="adhesion(…'?adh_accion=votar…')">
        if (event.target.closest('.reaccion-reaccionar span')) return enqueue('achievement', { achievement: 'ucReaction' });

        const link = event.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href') || '';

        // Estrella: "off" indica que todavía no está en mis Estrellas
        if (link.matches('a.star.off')) return enqueue('achievement', { achievement: 'ucStar' });

        // Menú del curso: "Agregar a Favoritos" / "Establecer como Inicio" (.sel = ya activo)
        if (/subaccion=favorito/.test(href) && !link.classList.contains('sel')) return enqueue('achievement', { achievement: 'ucFavorite' });
        if (/subaccion=inicio/.test(href) && !link.classList.contains('sel')) return enqueue('achievement', { achievement: 'ucHomePage' });

        // Selector de tema del pie de página
        if (link.closest('ul.themes') && !link.closest('li.sel')) return enqueue('achievement', { achievement: 'ucThemeChange' });

        // Título de un hilo del foro
        if (link.id === 'mensaje-titulo') return enqueue('threadTitle', { title: link.textContent });

        // Descarga de material: botones a.download que apuntan a bajar?id=…
        const module = currentModule();
        if (MATERIAL_MODULES.includes(module) && (link.classList.contains('download') || /(^|\/)bajar\?/.test(href))) {
            enqueue('download');
        }
    }

    // ── Envío de formularios ────────────────────────────────────────────────
    function onSubmit(event) {
        const form = event.target;
        if (!(form instanceof HTMLFormElement)) return;
        const module = currentModule();
        const isPost = (form.getAttribute('method') || 'get').toLowerCase() === 'post';
        const hasText = !!form.querySelector('textarea, [contenteditable="true"]');
        // El cargador de U-Cursos sube los archivos aparte y deja campos ocultos _file / archivo[]
        const hasFile = !!form.querySelector('input[type="file"], input[name="_file"]');

        // Foro: <form method="post" action="mensaje"> con <textarea name="contenido">
        if (FORUM_MODULES.includes(module) && isPost && hasText) return enqueue('forumPost');
        if (module === 'tareas' && (hasFile || isPost)) return enqueue('taskSubmit');
        if (module === 'encuestas' && isPost) return enqueue('achievement', { achievement: 'ucSurvey' });
        if (module === 'votaciones' && isPost) return enqueue('achievement', { achievement: 'ucVote' });
        if (module === 'afiches' && isPost && (hasFile || form.querySelector('[name="afiche[titulo]"]'))) return enqueue('achievement', { achievement: 'ucPosterUpload' });
        if (module === 'correo' && isPost && hasText) return enqueue('achievement', { achievement: 'ucMail' });
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onPageLoad);
    } else {
        onPageLoad();
    }

})();
