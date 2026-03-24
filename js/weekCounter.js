// Basado en https://github.com/Nyveon/tU-Cursos - Modificado por matias-saavedra-g el 2024.07.16
// Se halló la solución del problema del contador al usar U-Cursos en inglés.

(async function() {

    // Function to set an item in Chrome Storage
    function setChromeStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.set({ [key]: value }, () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to get an item from Chrome Storage
    function getChromeStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get([key], (result) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(result[key] !== undefined ? result[key] : null);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Function that returns an array of Dates representing each day of the week
     * that contains date
     */
    function getWeek(date) {
        var day = date.getDay();

        //We need to do this because Date uses sunday as the first day of the week
        var monday_date = date.getDate() + (day === 0 ? -6 : -day + 1);

        var week_date = new Date(date.setDate(monday_date));
        var week = [new Date(week_date)];
        while (week_date.setDate(week_date.getDate() + 1) && week_date.getDay() !== 1) {
            week.push(new Date(week_date));
        }
        return week;
    }

    /**
     * Compares two dates ignoring time of the day
     */
    function areSameDate(d1, d2) {
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return +d1 === +d2;
    }

    function areInSameWeek(d1, d2) {
        var semana_d1 = getWeek(d1);
        for (var day of semana_d1) {
            if (areSameDate(day, d2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns the first day of the week of d1
     */
    function startOfWeek(d1) {
        let dia = 24 * 60 * 60 * 1000;
        const diaSemana = d1.getDay();
        return new Date(d1.getTime() - diaSemana * dia);
    }

    /**
     * Returns the number of weeks between d1 and d2
     */
    function weeksBetween(d1, d2) {
        let semana = 7 * 24 * 60 * 60 * 1000;
        return Math.round((startOfWeek(d2) - startOfWeek(d1)) / semana);
    }

    /**
     * Function that reduces an array of dates so as to only include one day per
     * week
     */
    function reduceWeek(dates) {
        var current = dates[0];
        var filtered = [];

        var i = 1;
        while (i < dates.length) {
            // console.log(current);
            while (areInSameWeek(current, dates[i])) {
                current = dates[i];
                i += 1;
                if (i >= dates.length) {
                    break;
                }
            }
            filtered.push(current);
            current = dates[i];
            i += 1;
        }
        return filtered;
    }

    // Weeks with classes
    function isNormalWeek(date, class_weeks) {
        for (var day of class_weeks) {
            if (areInSameWeek(day, date)) {
                return true;
            }
        }
        return false;
    }

    // Number of recess weeks until current
    function recessWeeksUntil(current, class_weeks) {
        var recess_weeks = 0;
        var weeks_in_between = 0;

        var i = 0;
        while (i < class_weeks.length - 1) {
            if ( class_weeks[i] > current || areInSameWeek(class_weeks[i], current)) {
                return recess_weeks;
            }

            weeks_in_between = weeksBetween(class_weeks[i], class_weeks[i + 1]);
            recess_weeks += weeks_in_between - 1;
            i += weeks_in_between;
        }
        return recess_weeks;
    }

    // Función principal para agregar contador
    async function addCounter() {
        // Find the current week info from the paginas navigation
        // Format: "2026 - Semana 11 - 09/03 al 15/03"
        const weekSpan = document.querySelector('ul.paginas li.sel span');
        if (!weekSpan) return;

        const weekText = weekSpan.textContent;
        const match = weekText.match(/(\d{4}).*?(\d{2})\/(\d{2})\s+al/);
        if (!match) return;

        const year = parseInt(match[1]);
        const day = parseInt(match[2]);
        const month = parseInt(match[3]);
        var current_date = new Date(year, month - 1, day);

        // Get class weeks from the Monday row (tr.odd) of the mini calendar
        const mondayRow = document.querySelector('#body table tbody tr.odd');
        if (!mondayRow) return;

        var dates = [];
        mondayRow.querySelectorAll('td[class*="semana-"]').forEach(cell => {
            const anchor = cell.querySelector('a.n');
            if (anchor && parseFloat(anchor.getAttribute('data-n') || '0') > 0) {
                const tooltip = cell.querySelector('span.tooltip');
                if (tooltip) {
                    const dateMatch = tooltip.textContent.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    if (dateMatch) {
                        dates.push(new Date(parseInt(dateMatch[3]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1])));
                    }
                }
            }
        });

        if (dates.length === 0) {
            weekSpan.append(" (Off)");
            return;
        }

        dates.sort((d1, d2) => d1 - d2);

        // Dates from Monday row are already one per week, no need to reduce
        var filtered_dates = dates;

        // +1 because we want to take into account the current week
        var total_weeks = weeksBetween(filtered_dates[0], current_date) + 1;
        var past_recess_weeks = recessWeeksUntil(current_date, filtered_dates);
        var is_class_week = isNormalWeek(current_date, filtered_dates);

        var text = is_class_week ? total_weeks - past_recess_weeks : "Off";

        // Insert the number into the page with a newline character
        weekSpan.append(document.createElement("br"));
        weekSpan.append("Semana lectiva: " + text);

        // Show one-time alert on first hover
        let firstHoverScheduleDate = await getChromeStorageItem("scheduleDateFirstHover") !== true;
        async function showAlert() {
            if (firstHoverScheduleDate) {
                alert("¡Ahora contamos semanas!");
                await setChromeStorageItem("scheduleDateFirstHover", true);
                firstHoverScheduleDate = false;
            }
        }
        weekSpan.addEventListener("mouseover", showAlert);
    }

    const settings = await getChromeStorageItem("settings");
    if (settings) {
        const weekCounterConfig = settings.features.weekCounter;
        if (!weekCounterConfig) {return}
    }

    await addCounter();

})();