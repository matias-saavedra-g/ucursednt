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

    // ── DEBUG CONFIGURATION ──────────────────────────────────────────────────
    const VERBOSE_DEBUG = false;

    function debug(...args) {
        if (VERBOSE_DEBUG) {
            console.log('%c[WeekCounter Debug]', 'color: #bada55; font-weight: bold;', ...args);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

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

    // ── Semester Helpers ─────────────────────────────────────────────────────
    function getAcademicPeriod(date, pathname) {
        const courseMatch = pathname.match(/\/(\d{4})\/([12])\//);
        if (courseMatch) {
            return {
                year: parseInt(courseMatch[1], 10),
                semester: parseInt(courseMatch[2], 10)
            };
        }

        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        const day = date.getDate();

        let semester = 1;
        if (month >= 8 || (month === 7 && day >= 20)) {
            semester = 2; // Segundo semestre (Primavera)
        } else if (month >= 3 || (month === 2 && day >= 20)) {
            semester = 1; // Primer semestre (Otoño)
        } else {
            semester = 0; // Verano / Enero-Febrero
        }

        return { year, semester };
    }

    function filterDatesBySemester(dates, year, semester) {
        if (!dates || dates.length === 0) return [];

        if (semester === 2) {
            // Semester 2: Late July / August to December, and January of next year
            return dates.filter(d => {
                const y = d.getFullYear();
                const m = d.getMonth() + 1;
                const day = d.getDate();
                if (y === year) {
                    return m >= 8 || (m === 7 && day >= 20);
                }
                if (y === year + 1) {
                    return m === 1;
                }
                return false;
            });
        } else if (semester === 1) {
            // Semester 1: Late February to July
            return dates.filter(d => {
                const y = d.getFullYear();
                const m = d.getMonth() + 1;
                const day = d.getDate();
                if (y === year) {
                    return (m >= 3 && m <= 7) || (m === 2 && day >= 20);
                }
                return false;
            });
        } else {
            // Summer (January - February)
            return dates.filter(d => {
                const y = d.getFullYear();
                const m = d.getMonth() + 1;
                return y === year && (m === 1 || m === 2);
            });
        }
    }

    // ── UI Helpers ───────────────────────────────────────────────────────────
    function updateWeekDisplay(weekSpan, text) {
        let lectivaSpan = weekSpan.querySelector('.ucursednt-semana-lectiva');
        if (lectivaSpan) {
            lectivaSpan.textContent = `Semana lectiva: ${text}`;
        } else {
            const currentHTML = UcursedntUtils.DOM.getHTML(weekSpan);
            const cleanedHTML = currentHTML.replace(/<br\s*\/?>\s*Semana lectiva:[^<]*/gi, '');
            if (cleanedHTML !== currentHTML) {
                UcursedntUtils.DOM.safeSetHTML(weekSpan, cleanedHTML);
            }

            const br = document.createElement('br');
            lectivaSpan = document.createElement('span');
            lectivaSpan.className = 'ucursednt-semana-lectiva';
            lectivaSpan.textContent = `Semana lectiva: ${text}`;
            weekSpan.appendChild(br);
            weekSpan.appendChild(lectivaSpan);
        }
    }

    function addManualButton(onRecount) {
        const buttonId = 'ucursednt-btn-contar-semanas';
        if (document.getElementById(buttonId)) {
            return;
        }

        const addEventBtn = document.querySelector('a.boton[href*="evento"], a[href*="evento"]');

        const button = document.createElement('a');
        button.id = buttonId;
        button.href = 'javascript:void(0)';
        button.className = 'boton';
        button.title = 'Contar semanas para el semestre actual, en caso de que el automático haya fallado';
        button.textContent = 'Contar semanas';

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const originalText = button.textContent;
            button.textContent = 'Contando...';
            try {
                await onRecount(true);
                button.textContent = '¡Contado!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 1500);
            } catch (err) {
                console.error('Error recounting weeks:', err);
                button.textContent = originalText;
            }
        });

        if (addEventBtn && addEventBtn.parentNode) {
            addEventBtn.after(button);
        } else {
            const container = document.querySelector('ul.modulo') || document.querySelector('#body') || document.querySelector('ul.paginas');
            if (container) {
                container.appendChild(button);
            }
        }
    }

    // ── Core Logic ───────────────────────────────────────────────────────────
    async function addCounter(forceRefresh = false) {
        debug(`Script running (forceRefresh=${forceRefresh}). Waiting for DOM...`);
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        debug("DOM Loaded.");

        // 1. Inject manual trigger button next to "Add Event"
        addManualButton(addCounter);

        // 2. Target UI element
        const weekSpan = document.querySelector('ul.paginas li.sel span');
        if (!weekSpan) {
            debug("Target UI element 'ul.paginas li.sel span' not found. Exiting.");
            return;
        }

        // 3. Fetch current date from URL parameters safely
        const urlParams = new URLSearchParams(window.location.search);
        const fechaParam = urlParams.get('fecha');
        let current_date = new Date(); // Default to today
        if (fechaParam) {
            current_date = new Date(fechaParam + 'T12:00:00'); 
        }
        debug("Current evaluated date:", current_date);

        // 4. Determine academic period & build cache key
        const path = window.location.pathname;
        const period = getAcademicPeriod(current_date, path);
        debug("Academic Period:", period);

        let cacheKey = '';
        if (path.includes('/usuario/')) {
            const userId = await UcursedntUtils.Storage.get('userId') || 'unknown';
            cacheKey = `weekCache_user_${userId}_${period.year}_${period.semester}`;
        } else {
            const match = path.match(/^\/([^\/]+)\/(\d{4})\/([12])\/([^\/]+)\/([^\/]+)/);
            if (match) {
                cacheKey = `weekCache_course_${match[1]}_${match[4]}_${match[5]}_${match[2]}_${match[3]}`;
            } else {
                cacheKey = `weekCache_fallback_${period.year}_${period.semester}`;
            }
        }
        debug("Using Cache Key:", cacheKey);

        if (forceRefresh) {
            debug("Forcing cache invalidation for key:", cacheKey);
            await UcursedntUtils.Storage.remove(cacheKey);
        }

        // 5. Load or Scrape class weeks
        let class_weeks = [];
        const cachedData = forceRefresh ? null : await UcursedntUtils.Storage.get(cacheKey);

        if (cachedData && cachedData.class_weeks && cachedData.class_weeks.length > 0) {
            class_weeks = cachedData.class_weeks.map(t => new Date(t));
            debug(`Cache Hit! Loaded ${class_weeks.length} weeks from storage.`);
        } else {
            debug("Cache Miss / Forced Refresh. Scraping heatmap...");
            const heatmapCells = document.querySelectorAll('.github table td a.n');
            if (heatmapCells.length === 0) {
                debug("No heatmap cells found. Setting 'Off'.");
                updateWeekDisplay(weekSpan, "Off (Receso/Feriado)");
                return;
            }

            let rawClassDates = [];
            heatmapCells.forEach(anchor => {
                const dataN = parseFloat(anchor.getAttribute('data-n') || '0');
                if (dataN > 0) {
                    const href = anchor.getAttribute('href');
                    const dateMatch = href ? href.match(/fecha=(\d{4}-\d{2}-\d{2})/) : null;
                    if (dateMatch) {
                        rawClassDates.push(new Date(dateMatch[1] + 'T12:00:00'));
                    }
                }
            });

            if (rawClassDates.length === 0) {
                debug("No valid class dates found in heatmap. Setting 'Off'.");
                updateWeekDisplay(weekSpan, "Off (Receso/Feriado)");
                return;
            }

            rawClassDates.sort((d1, d2) => d1 - d2);

            // Filter strictly to current evaluated semester
            const semesterDates = filterDatesBySemester(rawClassDates, period.year, period.semester);
            const effectiveDates = semesterDates.length > 0 ? semesterDates : rawClassDates;

            class_weeks = reduceWeek(effectiveDates);
            debug(`Scraped ${class_weeks.length} weeks for current semester. Saving to cache.`);

            if (class_weeks.length > 0) {
                await UcursedntUtils.Storage.set(cacheKey, {
                    class_weeks: class_weeks.map(d => d.getTime()),
                    savedAt: Date.now()
                });
            }
        }

        if (class_weeks.length === 0) {
            debug("class_weeks array is empty. Setting 'Off'.");
            updateWeekDisplay(weekSpan, "Off (Receso/Feriado)");
            return;
        }

        // 6. Dynamic Evaluation based on schedule blocks (Spanish & English keywords + Course links)
        const bloques = document.querySelectorAll('.bloque');
        debug(`Found ${bloques.length} '.bloque' elements on the page.`);
        
        if (bloques.length > 0) {
            let matchLog = [];
            
            const hasValidClass = Array.from(bloques).some((bloque, index) => {
                const html = UcursedntUtils.DOM.getHTML(bloque).toLowerCase();
                const text = (bloque.innerText || '').toLowerCase().replace(/\n/g, ' ');
                
                const hasCourseLink = bloque.querySelector('a[href*="/20"], a[href*="/1/"], a[href*="/2/"]') !== null ||
                                      /\/(\d{4})\/([12])\//.test(html);
                const hasPillOrDetail = bloque.querySelector('.pill, .detalle') !== null;
                
                const isMatch = hasCourseLink ||
                                hasPillOrDetail ||
                                html.includes('control') || 
                                html.includes('evaluación') || 
                                html.includes('evaluacion') || 
                                html.includes('evaluation') || 
                                html.includes('taller') || 
                                html.includes('workshop') || 
                                html.includes('cátedra') || 
                                html.includes('catedra') || 
                                html.includes('lecture') || 
                                html.includes('auxiliar') || 
                                html.includes('ta session') || 
                                html.includes('ayudant') || 
                                html.includes('laboratorio') || 
                                html.includes('lab') || 
                                html.includes('ejercicio') || 
                                html.includes('exercise') || 
                                html.includes('práctico') || 
                                html.includes('practico') || 
                                html.includes('practical') || 
                                html.includes('clase') || 
                                html.includes('class') || 
                                html.includes('examen') || 
                                html.includes('exam') || 
                                html.includes('test');
                
                matchLog.push(`Block [${index}]: Match=${isMatch} | Text="${text.substring(0, 50)}..."`);
                return isMatch;
            });

            debug("Block evaluation summary:", matchLog);
            debug(`Overall hasValidClass result: ${hasValidClass}`);

            if (!hasValidClass) {
                const initialLength = class_weeks.length;
                class_weeks = class_weeks.filter(w => !areInSameWeek(w, current_date));
                debug(`Week ruled out. Removed from class_weeks. Length dropped from ${initialLength} to ${class_weeks.length}`);
                
                if (class_weeks.length < initialLength) {
                    debug("Updating cache with filtered class_weeks array.");
                    await UcursedntUtils.Storage.set(cacheKey, {
                        class_weeks: class_weeks.map(d => d.getTime()),
                        savedAt: Date.now()
                    });
                }
            } else {
                debug("Week confirmed as a valid class week.");
            }
        } else {
            debug("No '.bloque' elements found to evaluate.");
        }

        // 7. Calculate Weeks
        const total_weeks = weeksBetween(class_weeks[0], current_date) + 1;
        const past_recess_weeks = recessWeeksUntil(current_date, class_weeks);
        const is_class_week = isNormalWeek(current_date, class_weeks);
        const calculatedWeekNumber = total_weeks - past_recess_weeks;

        debug("Final Calculations:", {
            total_weeks: total_weeks,
            past_recess_weeks: past_recess_weeks,
            is_class_week: is_class_week,
            calculatedWeekNumber: calculatedWeekNumber
        });

        let text = "";
        if (total_weeks < 1) {
            text = "Pre-semestre";
        } else if (!is_class_week) {
            text = "Off (Receso/Feriado)";
        } else if (calculatedWeekNumber > 18 || calculatedWeekNumber < 1) {
            // Guard against impossible semester week numbers (> 18)
            text = "Off (Receso/Feriado)";
        } else {
            text = `${calculatedWeekNumber}`;
        }

        updateWeekDisplay(weekSpan, text);

        // 8. Alert configuration
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
    debug("Checking user settings...");
    const settings = await UcursedntUtils.Storage.get("settings");
    if (settings && settings.features && settings.features.weekCounter === false) {
        debug("Extension feature disabled in settings. Exiting.");
        return; 
    }

    await addCounter();

})();