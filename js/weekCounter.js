// Créditos a https://github.com/Nyveon/tU-Cursos por la inspiración inicial.
// Se halló la solución del problema del contador al usar U-Cursos en inglés.

(function() {

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

    // Función para establecer un dato en LocalStorage
    function setLocalStorageItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // Función para obtener un dato de LocalStorage
    function getLocalStorageItem(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    // Función principal para agregar contador
    function addCounter(file) {
        var schedule_date_dom = document.getElementById("body").getElementsByTagName("h1")[0];

        // Verificar si ya se ha mostrado la alerta para schedule_date_dom
        let firstHoverScheduleDate = getLocalStorageItem("scheduleDateFirstHover") !== true;

        // Función para mostrar la alerta
        function showAlert() {
            if (firstHoverScheduleDate) {
                alert("¡Ahora contamos semanas!");
                setLocalStorageItem("scheduleDateFirstHover", true); // Marcar que ya se mostró la alerta
                firstHoverScheduleDate = false; // Asegurar que la alerta se muestre solo una vez
            }
        }

        // Verificar si el elemento schedule_date_dom está presente antes de añadir el evento mouseover
        if (schedule_date_dom) {
            schedule_date_dom.addEventListener("mouseover", showAlert);
        }

        // Resto de tu función addCounter...
        var date_parts;
        if (schedule_date_dom.innerText.includes("Semana del")) {
            // Spanish language case: "Semana del 08/07/2024"
            date_parts = schedule_date_dom.innerText.split(" ")[2].split("/");
        } else if (schedule_date_dom.innerText.includes("Week")) {
            // English language case: "08/07/2024 Week"
            date_parts = schedule_date_dom.innerText.split(" ")[0].split("/");
        } else {
            // Handle other cases if needed
            console.log("Unsupported format or language");
            return;
        }

        // date_parts now contains ["08", "07", "2024"]
        // You can use date_parts[0], date_parts[1], date_parts[2] to access day, month, year respectively
        console.log(date_parts);

        var current_date = new Date(date_parts[2], date_parts[1] - 1, date_parts[0]);

        // Parse data from iCal
        var calendar_events = ICAL.parse(file)[2];

        /**
         * We build an array containing only the dates from calendar_events.
         * The rest of the metadata is ignored.
         */
        var dates = [];
        calendar_events.forEach(e => dates.push(new Date(e[1][4][3])));
        dates.sort(function(d1, d2){
            return d1 - d2;
        });

        // Last item is undefined for some reason?
        //dates.splice(-1)

        var filtered_dates = reduceWeek(dates);

        // +1 because we want to take into account the current week
        var total_weeks = weeksBetween(filtered_dates[0], current_date) + 1;
        var past_recess_weeks = recessWeeksUntil(current_date, filtered_dates);
        var is_class_week = isNormalWeek(current_date, filtered_dates);

        var text = is_class_week ? total_weeks - past_recess_weeks : "Off";

        const add = " (" + text + ")";

        // Insert the number into the page
        schedule_date_dom.append(add);
    }

    const weekCounterConfig = JSON.parse(localStorage.getItem("settings")).features.weekCounter
    if (getLocalStorageItem("settings")) {
        if (!weekCounterConfig) {return}
    }

    var href = document.getElementsByClassName("file ical")[0].href;
    fetch(href).then(r => r.text()).then(d => addCounter(d));

})();