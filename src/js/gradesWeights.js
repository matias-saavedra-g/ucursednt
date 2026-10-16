// gradesWeights.js - Ponderador de notas
// Agrega una columna "Peso" a la tabla de notas y un peso por grupo en cada fila separadora,
// y muestra arriba la nota final ponderada:
//     nota = Σ_j W_j · Σ_i ( w_ij · g_i )
// donde W_j es el peso del grupo j y w_ij el peso de la evaluación i dentro del grupo j (en %).
// Los campos vacíos se reparten en partes iguales el porcentaje que queda libre en su nivel.

(async function() {
    'use strict';

    if (window.gradesWeightsLoaded) return;
    window.gradesWeightsLoaded = true;

    const settings = await UcursedntUtils.Storage.get("settings");
    if (settings && settings.features && settings.features.gradesWeights === false) {
        return; // Feature is disabled
    }

    // Grupos que contienen la nota oficial: se excluyen por defecto para no contarla dos veces
    const EXCLUDED_BY_DEFAULT = /notas?\s+para\s+el\s+acta|final\s+grades/i;
    const PASSING_GRADE = 3.95;

    // ── Lectura de la tabla ─────────────────────────────────────────────────
    function findGradesTable() {
        return Array.from(document.querySelectorAll('#body table')).find(table =>
            table.querySelector('thead th') && table.querySelector('tr.separador, tbody tr td h1')
        ) || null;
    }

    function parseGrade(text) {
        const clean = (text || '').trim().replace(',', '.').replace('%', '');
        if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
        return parseFloat(clean);
    }

    function getItemName(row) {
        const h1 = row.querySelector('td h1');
        if (!h1) return '';
        const clone = h1.cloneNode(true);
        clone.querySelectorAll('.opcion').forEach(el => el.remove());
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function getItemKey(row, name) {
        const stats = row.querySelector('a.stats[href*="id_evaluacion="]');
        if (stats) {
            const match = stats.getAttribute('href').match(/id_evaluacion=(\d+)/);
            if (match) return match[1];
        }
        return `name:${name}`;
    }

    // Recorre las filas en orden: cada tr.separador abre un grupo
    function readStructure(table) {
        const groups = [];
        let current = null;

        table.querySelectorAll('tr').forEach(row => {
            if (row.closest('thead')) return;

            if (row.classList.contains('separador')) {
                const cell = row.querySelector('td');
                const name = cell ? cell.textContent.replace(/\s+/g, ' ').trim() : `Grupo ${groups.length + 1}`;
                current = { name, row, cell, items: [], excludedByDefault: EXCLUDED_BY_DEFAULT.test(name) };
                groups.push(current);
                return;
            }

            const cells = row.querySelectorAll(':scope > td');
            if (cells.length < 2 || !row.querySelector('td h1')) return;

            if (!current) {
                current = { name: 'General', row: null, cell: null, items: [], excludedByDefault: false };
                groups.push(current);
            }

            const name = getItemName(row);
            const gradeSpan = cells[cells.length - 1].querySelector('h1 span');
            current.items.push({
                row,
                name,
                key: getItemKey(row, name),
                grade: parseGrade(gradeSpan ? gradeSpan.textContent : '')
            });
        });

        return groups.filter(group => group.items.length);
    }

    // ── Cálculo ─────────────────────────────────────────────────────────────
    // entries: [{ explicit: number|null }] → pesos efectivos en %
    function resolveWeights(entries) {
        const explicitSum = entries.reduce((sum, e) => sum + (e.explicit ?? 0), 0);
        const autoCount = entries.filter(e => e.explicit === null).length;
        const share = autoCount ? Math.max(0, 100 - explicitSum) / autoCount : 0;
        return {
            weights: entries.map(e => e.explicit ?? share),
            explicitSum,
            autoCount
        };
    }

    function compute(groups, stored) {
        const warnings = [];

        groups.forEach(group => {
            const itemLevel = resolveWeights(group.items.map(item => ({ explicit: stored.items[item.key] ?? null })));
            group.itemWeights = itemLevel.weights;
            if (itemLevel.explicitSum > 100.0001) {
                warnings.push(`En "${group.name}" los pesos de las evaluaciones suman ${formatNumber(itemLevel.explicitSum)}%.`);
            } else if (!itemLevel.autoCount && Math.abs(itemLevel.explicitSum - 100) > 0.0001) {
                warnings.push(`En "${group.name}" los pesos de las evaluaciones suman ${formatNumber(itemLevel.explicitSum)}%, no 100%.`);
            }

            group.score = 0;      // Σ_i w_ij · g_i (solo evaluaciones con nota)
            group.covered = 0;    // Σ_i w_ij       (solo evaluaciones con nota)
            group.items.forEach((item, i) => {
                if (item.grade === null) return;
                group.score += (group.itemWeights[i] / 100) * item.grade;
                group.covered += group.itemWeights[i] / 100;
            });
            group.average = group.covered ? group.score / group.covered : null;
        });

        const groupLevel = resolveWeights(groups.map(group => ({
            explicit: stored.groups[group.name] ?? (group.excludedByDefault ? 0 : null)
        })));
        groups.forEach((group, j) => { group.weight = groupLevel.weights[j]; });

        if (groupLevel.explicitSum > 100.0001) {
            warnings.push(`Los pesos de los grupos suman ${formatNumber(groupLevel.explicitSum)}%.`);
        } else if (!groupLevel.autoCount && Math.abs(groupLevel.explicitSum - 100) > 0.0001) {
            warnings.push(`Los pesos de los grupos suman ${formatNumber(groupLevel.explicitSum)}%, no 100%.`);
        }

        // nota = Σ_j W_j · Σ_i w_ij · g_i
        const final = groups.reduce((sum, group) => sum + (group.weight / 100) * group.score, 0);
        const coverage = groups.reduce((sum, group) => sum + (group.weight / 100) * group.covered, 0);

        return { final, coverage, warnings };
    }

    // Mismo formato que U-Cursos (punto decimal). Las notas usan decimales fijos; los pesos, recortados.
    function formatGrade(value, decimals = 1) {
        return value.toFixed(decimals);
    }

    function formatNumber(value, decimals = 1) {
        return String(Number(value.toFixed(decimals)));
    }

    // ── Interfaz ────────────────────────────────────────────────────────────
    function addStyles() {
        if (document.getElementById('ucd-grades-weights-styles')) return;
        const style = document.createElement('style');
        style.id = 'ucd-grades-weights-styles';
        style.textContent = `
            .ucd-gw-cell { white-space: nowrap; vertical-align: middle; }
            .ucd-gw-field { display: inline-flex; align-items: center; gap: .3em; }
            input.ucd-gw-input {
                width: 4.2em; height: auto; margin: 0; padding: .2em .4em;
                text-align: right; font-variant-numeric: tabular-nums;
            }
            input.ucd-gw-input::placeholder { font-style: italic; opacity: .55; }
            .ucd-gw-group {
                float: right; display: inline-flex; align-items: center; gap: .6em;
                font-size: 14px; font-family: inherit; font-weight: 400;
            }
            .ucd-gw-group > * { margin: 0; }
            .ucd-gw-group .ucd-gw-avg { opacity: .7; font-variant-numeric: tabular-nums; margin-right: .6em; }
            .ucd-gw-summary.box {
                display: flex; flex-wrap: wrap; align-items: center; gap: 1em 2.5em;
                box-sizing: border-box; width: 100%; margin: .5em 0 1.5em; padding: 1em 1.5em;
            }
            .ucd-gw-figure { display: flex; flex-direction: column; min-width: 9em; }
            .ucd-gw-label { font-size: .85em; text-transform: uppercase; letter-spacing: .05em; opacity: .7; }
            .ucd-gw-value { font-size: 2.6em; font-weight: 300; line-height: 1.1; font-variant-numeric: tabular-nums; }
            .ucd-gw-value span { padding: 0 .1em; border-radius: 4px; }
            .ucd-gw-exact { font-size: .85em; opacity: .7; font-variant-numeric: tabular-nums; }
            .ucd-gw-details { flex: 1 1 22em; min-width: 0; display: flex; flex-direction: column; gap: .4em; }
            .ucd-gw-details p { margin: 0; }
            .ucd-gw-hint { opacity: .75; font-size: .92em; }
            .ucd-gw-details div.warn { margin: 0; }
            .ucd-gw-actions { display: flex; gap: .5em; }
            .ucd-gw-actions .boton { margin: 0; }
        `;
        document.head.appendChild(style);
    }

    function createWeightInput(id, label) {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.autocomplete = 'off';
        input.id = id;
        input.className = 'ucd-gw-input';
        input.setAttribute('aria-label', label);

        const field = document.createElement('span');
        field.className = 'ucd-gw-field';
        const suffix = document.createElement('span');
        suffix.textContent = '%';
        field.append(input, suffix);
        return { field, input };
    }

    function readInputValue(input) {
        if (input.value.trim() === '') return null;
        const value = parseFloat(input.value.replace(',', '.'));
        return Number.isFinite(value) ? Math.max(0, value) : null;
    }

    async function init() {
        const table = findGradesTable();
        if (!table || table.dataset.ucdGradesWeights) return;
        const groups = readStructure(table);
        if (!groups.length) return;
        table.dataset.ucdGradesWeights = 'true';

        const courseKey = location.pathname.split('/notas')[0].replace(/^\/|\/$/g, '');
        const storageKey = `gradesWeights_${courseKey}`;
        const stored = Object.assign({ groups: {}, items: {} }, await UcursedntUtils.Storage.get(storageKey) || {});
        const allGrades = groups.flatMap(g => g.items.map(i => i.grade)).filter(g => g !== null);
        const isChileanScale = allGrades.length > 0 && allGrades.every(g => g >= 1 && g <= 7);

        addStyles();

        // Columna nueva en el encabezado
        const headRow = table.querySelector('thead tr');
        if (headRow) {
            const th = document.createElement('th');
            th.className = 'number ucd-gw-cell';
            th.textContent = 'Peso';
            th.title = 'Peso de cada evaluación dentro de su grupo (%)';
            headRow.appendChild(th);
        }

        const itemInputs = [];
        const groupInputs = [];
        const groupAverages = [];

        groups.forEach((group, j) => {
            if (group.cell) {
                const control = document.createElement('span');
                control.className = 'ucd-gw-group';
                const average = document.createElement('span');
                average.className = 'ucd-gw-avg';
                const { field, input } = createWeightInput(`ucd-gw-group-${j}`, `Peso del grupo ${group.name}`);
                const label = document.createElement('label');
                label.htmlFor = input.id;
                label.textContent = 'Peso del grupo';
                control.append(average, label, field);
                group.cell.appendChild(control);
                if (stored.groups[group.name] !== undefined) input.value = stored.groups[group.name];
                groupInputs.push({ group, input });
                groupAverages.push({ group, average });
            }

            group.items.forEach((item, i) => {
                const td = document.createElement('td');
                td.className = 'ucd-gw-cell';
                const { field, input } = createWeightInput(`ucd-gw-item-${j}-${i}`, `Peso de ${item.name}`);
                td.appendChild(field);
                item.row.appendChild(td);
                if (stored.items[item.key] !== undefined) input.value = stored.items[item.key];
                itemInputs.push({ item, input });
            });
        });

        // Panel de resultado sobre la tabla
        const summary = document.createElement('div');
        summary.className = 'box ucd-gw-summary';
        summary.setAttribute('aria-live', 'polite');
        UcursedntUtils.DOM.safeSetHTML(summary, `
            <div class="ucd-gw-figure">
                <span class="ucd-gw-label">Nota final ponderada</span>
                <span class="ucd-gw-value"><span></span></span>
                <span class="ucd-gw-exact"></span>
            </div>
            <div class="ucd-gw-details">
                <p class="ucd-gw-coverage"></p>
                <p class="ucd-gw-hint">Escribe los pesos en % en la columna "Peso" y en cada grupo. Los campos vacíos se reparten en partes iguales el porcentaje que queda libre.</p>
                <div class="ucd-gw-warnings"></div>
                <div class="ucd-gw-actions"><button type="button" class="boton">Restablecer pesos</button></div>
            </div>
        `);
        const anchor = table.previousElementSibling && table.previousElementSibling.matches('form.filtros')
            ? table.previousElementSibling.nextSibling
            : table;
        table.parentNode.insertBefore(summary, anchor);

        const valueEl = summary.querySelector('.ucd-gw-value > span');
        const exactEl = summary.querySelector('.ucd-gw-exact');
        const coverageEl = summary.querySelector('.ucd-gw-coverage');
        const warningsEl = summary.querySelector('.ucd-gw-warnings');
        const resetBtn = summary.querySelector('button');

        function render() {
            const { final, coverage, warnings } = compute(groups, stored);

            itemInputs.forEach(({ item, input }) => {
                const group = groups.find(g => g.items.includes(item));
                const weight = group.itemWeights[group.items.indexOf(item)];
                input.placeholder = formatNumber(weight);
            });
            groupInputs.forEach(({ group, input }) => {
                input.placeholder = formatNumber(group.weight);
            });
            groupAverages.forEach(({ group, average }) => {
                average.textContent = group.average === null ? 'Sin notas' : `Promedio ${formatGrade(group.average, 2)}`;
            });

            if (coverage <= 0) {
                valueEl.textContent = '—';
                valueEl.className = '';
                exactEl.textContent = '';
                coverageEl.textContent = 'Todavía no hay notas con peso asignado.';
            } else {
                valueEl.textContent = formatGrade(final, 1);
                valueEl.className = isChileanScale && coverage >= 0.9999 && final < PASSING_GRADE ? 'wrong' : '';
                exactEl.textContent = `Exacta: ${formatGrade(final, 3)}`;
                coverageEl.textContent = coverage >= 0.9999
                    ? 'Calculada con el 100% del peso.'
                    : `Llevas el ${formatNumber(coverage * 100)}% del peso evaluado. Promedio de lo evaluado: ${formatGrade(final / coverage, 2)}.`;
            }

            warningsEl.replaceChildren();
            warnings.forEach(text => {
                const warn = document.createElement('div');
                warn.className = 'warn';
                warn.textContent = text;
                warningsEl.appendChild(warn);
            });
        }

        let saveTimer = null;
        function scheduleSave() {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(async () => {
                await UcursedntUtils.Storage.set(storageKey, stored);
                await UcursedntUtils.Storage.set('gradesWeightsFirstUse', true);
            }, 400);
        }

        itemInputs.forEach(({ item, input }) => {
            input.addEventListener('input', () => {
                const value = readInputValue(input);
                if (value === null) delete stored.items[item.key];
                else stored.items[item.key] = value;
                render();
                scheduleSave();
            });
        });

        groupInputs.forEach(({ group, input }) => {
            input.addEventListener('input', () => {
                const value = readInputValue(input);
                if (value === null) delete stored.groups[group.name];
                else stored.groups[group.name] = value;
                render();
                scheduleSave();
            });
        });

        resetBtn.addEventListener('click', async () => {
            stored.groups = {};
            stored.items = {};
            itemInputs.forEach(({ input }) => { input.value = ''; });
            groupInputs.forEach(({ input }) => { input.value = ''; });
            render();
            await UcursedntUtils.Storage.remove(storageKey);
        });

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
