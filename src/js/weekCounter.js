// Auto-injected extension alert wrapper (Tour Guide feature)
if (typeof window.showExtensionAlert === 'undefined') {
    window.showExtensionAlert = function(message) {
        if (typeof browser !== 'undefined' && browser.storage) {
            browser.storage.sync.get(['settings']).then(res => {
                // Suppress the alert if tourGuide is explicitly disabled
                if (res && res.settings && res.settings.features && res.settings.features.tourGuide === false) {
                    return; 
                }
                alert(message);
            }).catch(() => alert(message));
        } else {
            alert(message);
        }
    };
}

// Basado en https://github.com/Nyveon/tU-Cursos - Modificado por matias-saavedra-g
// Auto-detecta semanas lectivas, soporta todas las vistas y almacena el calendario
// en la memoria del navegador para optimizar el rendimiento.

(async function() {
    'use strict';

    // ── Storage Utilities ────────────────────────────────────────────────────
    

    

    // ── Date Utilities ───────────────────────────────────────────────────────
    function getWeek(date) {
        let day = date.getDay();
        let monday_date = date.getDate() + (day === 0 ? -6 : -day + 1);
        let week_date = new Date(date.getTime());
        week_date.setDate(monday_date);
        
        let week = [new Date(week_date)];
        while (week_date.setDate(week_date.getDate() + 1) && week_date.getDay() !== 1) {
            week.push(new Date(week_date));
        }
        return week;
    }

    function areSameDate(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    function areInSameWeek(d1, d2) {
        let semana_d1 = getWeek(d1);
        for (let day of semana_d1) {
            if (areSameDate(day, d2)) return true;
        }
        return false;
    }

    

    function weeksBetween(d1, d2) {
        let semana = 7 * 24 * 60 * 60 * 1000;
        let start1 = UcursedntUtils.Date.startOfWeek(d1).getTime();
        let start2 = UcursedntUtils.Date.startOfWeek(d2).getTime();
        return Math.round((start2 - start1) / semana);
    }

    function reduceWeek(dates) {
        if (!dates || dates.length === 0) return [];
        let current = dates[0];
        let filtered = [current];

        for (let i = 1; i < dates.length; i++) {
            if (!areInSameWeek(current, dates[i])) {
                current = dates[i];
                filtered.push(current);
            }
        }
        return filtered;
    }

    function isNormalWeek(date, class_weeks) {
        for (let day of class_weeks) {
            if (areInSameWeek(day, date)) return true;
        }
        return false;
    }

    function recessWeeksUntil(current, class_weeks) {
        let recess_weeks = 0;
        for (let i = 0; i < class_weeks.length - 1; i++) {
            if (class_weeks[i] > current || areInSameWeek(class_weeks[i], current)) {
                return recess_weeks;
            }
            let weeks_in_between = weeksBetween(class_weeks[i], class_weeks[i + 1]);
            recess_weeks += (weeks_in_between - 1);
        }
        return recess_weeks;
    }

    // ── Core Logic ───────────────────────────────────────────────────────────
    async function addCounter() {
        // 1. Target UI element
        const weekSpan = document.querySelector('ul.paginas li.sel span');
        if (!weekSpan) return;

        // 2. Fetch current date from URL parameters safely
        const urlParams = new URLSearchParams(window.location.search);
        const fechaParam = urlParams.get('fecha');
        let current_date = new Date(); // Default to today
        if (fechaParam) {
            // Append fixed time to avoid timezone shift inconsistencies
            current_date = new Date(fechaParam + 'T12:00:00'); 
        }

        // 3. Build a precise cache key using user data and URL context
        let cacheKey = '';
        const path = window.location.pathname;

        if (path.includes('/usuario/')) {
            // It's the user's personal schedule
            const userId = await UcursedntUtils.Storage.get('userId') || 'unknown';
            const academicInfo = await UcursedntUtils.Storage.get('currentAcademicInfo') || { year: current_date.getFullYear(), semester: current_date.getMonth() > 6 ? 2 : 1 };
            cacheKey = `weekCache_user_${userId}_${academicInfo.year}_${academicInfo.semester}`;
        } else {
            // It's a course schedule
            // Extract from URL: /ingenieria/2026/1/ME5120/2/horario_curso/...
            const match = path.match(/^\/([^\/]+)\/(\d{4})\/([12])\/([^\/]+)\/([^\/]+)/);
            if (match) {
                cacheKey = `weekCache_course_${match[1]}_${match[4]}_${match[5]}_${match[2]}_${match[3]}`;
            } else {
                cacheKey = `weekCache_fallback_${current_date.getFullYear()}`;
            }
        }

        // 4. Check Cache
        let class_weeks = [];
        const cachedData = await UcursedntUtils.Storage.get(cacheKey);

        if (cachedData && cachedData.class_weeks && cachedData.class_weeks.length > 0) {
            // Cache Hit: Rebuild Date objects from stored timestamps
            class_weeks = cachedData.class_weeks.map(t => new Date(t));
        } else {
            // Cache Miss: Scrape the heatmap
            const heatmapCells = document.querySelectorAll('.github table td a.n');
            if (heatmapCells.length === 0) {
                weekSpan.append(" (Off)");
                return;
            }

            let classDates = [];
            heatmapCells.forEach(anchor => {
                const dataN = parseFloat(anchor.getAttribute('data-n') || '0');
                if (dataN > 0) {
                    const href = anchor.getAttribute('href');
                    const dateMatch = href.match(/fecha=(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        classDates.push(new Date(dateMatch[1] + 'T12:00:00'));
                    }
                }
            });

            if (classDates.length === 0) {
                weekSpan.append(" (Off)");
                return;
            }

            classDates.sort((d1, d2) => d1 - d2);
            class_weeks = reduceWeek(classDates);

            // Save array of timestamps to storage
            await UcursedntUtils.Storage.set(cacheKey, {
                class_weeks: class_weeks.map(d => d.getTime()),
                savedAt: Date.now()
            });
        }

        // 5. Calculate Weeks
        const total_weeks = weeksBetween(class_weeks[0], current_date) + 1;
        const past_recess_weeks = recessWeeksUntil(current_date, class_weeks);
        const is_class_week = isNormalWeek(current_date, class_weeks);

        if (total_weeks < 1) {
            weekSpan.innerHTML += `<br>Semana lectiva: Pre-semestre`;
            return;
        }

        const text = is_class_week ? (total_weeks - past_recess_weeks) : "Off (Receso/Feriado)";
        weekSpan.innerHTML += `<br>Semana lectiva: ${text}`;

        weekSpan.innerHTML += `<br><i>aproximado, comprobar si había tareas en semana de receso</i>`;

        // 6. Alert configuration
        let firstHoverScheduleDate = await UcursedntUtils.Storage.get("scheduleDateFirstHover") !== true;
        async function showAlert() {
            if (firstHoverScheduleDate) {
                window.showExtensionAlert("¡Ahora contamos semanas con precisión y guardamos la info para que cargue instantáneamente!");
                await UcursedntUtils.Storage.set("scheduleDateFirstHover", true);
                firstHoverScheduleDate = false;
            }
        }
        weekSpan.addEventListener("mouseover", showAlert);
    }

    // ── Init ─────────────────────────────────────────────────────────────────
    const settings = await UcursedntUtils.Storage.get("settings");
    if (settings && settings.features && settings.features.weekCounter === false) {
        return; 
    }

    await addCounter();

})();