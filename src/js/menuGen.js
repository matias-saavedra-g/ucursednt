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

(async function() {

    const Pages = window.UcursedntPages;
    const { icon, entryIcon, escapeHTML } = Pages;

    // Inicializar configuraciones
    async function initSettings() {
        if (!await UcursedntUtils.Storage.get("settings")) {
            await UcursedntUtils.Storage.set("settings", { features: Pages.defaultFeatureSettings() });
        }
    }

    // Muestra un estado temporal en un botón (p. ej. "¡Guardado!") y lo restaura
    function flashButton(button, html, okClass, restoreClass) {
        const originalHTML = UcursedntUtils.DOM.getHTML(button);
        UcursedntUtils.DOM.safeSetHTML(button, html);
        if (okClass) button.classList.add(okClass);
        if (restoreClass) button.classList.remove(restoreClass);
        setTimeout(() => {
            UcursedntUtils.DOM.safeSetHTML(button, originalHTML);
            if (okClass) button.classList.remove(okClass);
            if (restoreClass) button.classList.add(restoreClass);
        }, 2000);
    }

    // ── Funciones ───────────────────────────────────────────────────────────
    async function createFeaturesSection() {
        const settings = await UcursedntUtils.Storage.get("settings") || { features: {} };
        settings.features = settings.features || {};
        const features = settings.features;

        await Pages.unlockEnabledFeatureAchievements(features);

        const container = document.createDocumentFragment();

        const intro = document.createElement('section');
        intro.setAttribute('aria-label', 'Resumen');
        UcursedntUtils.DOM.safeSetHTML(intro, `
            <p class="lead">Activa o desactiva cada función de U-Cursedn't. Los cambios se guardan al instante y se aplican al recargar la página de U-Cursos.</p>
            <div class="ucd-toolbar">
                <div class="pill ok" data-count="on"></div>
                <div class="pill" data-count="off"></div>
                <label class="ucd-filter" for="ucd-feature-filter">
                    ${icon('search')}
                    <input type="text" id="ucd-feature-filter" placeholder="Filtrar funciones..." autocomplete="off">
                </label>
            </div>
        `);
        container.appendChild(intro);

        const onCount = intro.querySelector('[data-count="on"]');
        const offCount = intro.querySelector('[data-count="off"]');
        function updateCounts() {
            const enabled = Pages.FEATURES.filter(f => Pages.isFeatureEnabled(features, f)).length;
            onCount.textContent = `${enabled} activas`;
            offCount.textContent = `${Pages.FEATURES.length - enabled} inactivas`;
        }
        updateCounts();

        const groupSections = [];

        Pages.GROUPS.forEach(group => {
            const groupFeatures = Pages.FEATURES.filter(f => f.group === group.id);
            if (!groupFeatures.length) return;

            const section = document.createElement('section');
            UcursedntUtils.DOM.safeSetHTML(section, Pages.sectionHeading(group.icon, group.title));

            const list = document.createElement('ul');
            list.className = 'ucd-feature-list';

            groupFeatures.forEach(feature => {
                const enabled = Pages.isFeatureEnabled(features, feature);
                const item = document.createElement('li');
                item.dataset.search = `${feature.name} ${feature.description}`.toLowerCase();

                const label = document.createElement('label');
                label.className = `ucd-feature ${enabled ? '' : 'is-off'}`;
                label.htmlFor = `feature-${feature.id}`;
                UcursedntUtils.DOM.safeSetHTML(label, `
                    ${entryIcon(feature)}
                    <span class="ucd-feature-text">
                        <span class="ucd-feature-name">${escapeHTML(feature.name)}</span>
                        <span class="ucd-feature-desc">${escapeHTML(feature.description)}</span>
                    </span>
                    <div class="pill ${enabled ? 'ok' : ''}">${enabled ? 'Activa' : 'Inactiva'}</div>
                `);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `feature-${feature.id}`;
                checkbox.checked = enabled;
                label.appendChild(checkbox);

                const status = label.querySelector('div.pill');
                checkbox.addEventListener('change', async () => {
                    const isOn = checkbox.checked;
                    features[feature.id] = isOn;
                    await UcursedntUtils.Storage.set("settings", settings);
                    if (isOn && feature.achievement) {
                        await UcursedntUtils.Achievements.unlock(feature.id);
                    }
                    label.classList.toggle('is-off', !isOn);
                    status.classList.toggle('ok', isOn);
                    status.textContent = isOn ? 'Activa' : 'Inactiva';
                    updateCounts();
                });

                item.appendChild(label);
                list.appendChild(item);
            });

            section.appendChild(list);
            groupSections.push(section);
            container.appendChild(section);
        });

        // Filtro por nombre o descripción; oculta los grupos sin resultados
        const filterInput = intro.querySelector('#ucd-feature-filter');
        filterInput.addEventListener('input', () => {
            const query = filterInput.value.trim().toLowerCase();
            groupSections.forEach(section => {
                let visible = 0;
                section.querySelectorAll('li[data-search]').forEach(item => {
                    const match = !query || item.dataset.search.includes(query);
                    item.hidden = !match;
                    if (match) visible++;
                });
                section.hidden = visible === 0;
            });
        });

        return container;
    }

    // ── Asistentes de IA ────────────────────────────────────────────────────
    async function createAIConfigSection() {
        const AI = UcursedntUtils.AI;
        const aiSettings = await AI.getSettings();
        const providerOptions = Object.entries(AI.PROVIDERS)
            .map(([id, provider]) => `<option value="${id}">${escapeHTML(provider.label)}</option>`).join('');

        const section = document.createElement('section');
        UcursedntUtils.DOM.safeSetHTML(section, `
            ${Pages.sectionHeading('send', 'Asistentes de IA')}
            <p class="ucd-section-intro">UCursitos y las funciones IA del foro abren tu pregunta en el asistente que elijas, con el texto ya escrito y usando tu propia sesión. No se necesita API key.</p>
            <div class="info">
                Claude, ChatGPT y Perplexity reciben el texto directamente en el enlace. Gemini no lo permite: el texto se copia al portapapeles para que lo pegues. Lo mismo pasa con textos muy largos en cualquier asistente.
            </div>
            <table class="form big">
                <tbody>
                    <tr>
                        <th><label for="ai-provider">Asistente por defecto</label></th>
                        <td><select id="ai-provider" class="ucd-select">${providerOptions}</select></td>
                    </tr>
                    <tr>
                        <th><label for="ai-instructions">Instrucciones</label></th>
                        <td>
                            <textarea id="ai-instructions" rows="4" placeholder="Texto que se antepone a todo lo que envías"></textarea>
                            <span class="ucd-help">Se agregan al inicio de cada envío. Déjalo vacío para enviar solo el contenido.</span>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="ucd-actions">
                <button type="button" class="boton ok" id="ai-save">${icon('save')} Guardar</button>
                <button type="button" class="boton" id="ai-reset">${icon('undo')} Restaurar instrucciones</button>
            </div>
        `);

        const providerSelect = section.querySelector('#ai-provider');
        const instructions = section.querySelector('#ai-instructions');
        const saveBtn = section.querySelector('#ai-save');
        const resetBtn = section.querySelector('#ai-reset');

        providerSelect.value = aiSettings.provider;
        instructions.value = aiSettings.instructions;

        resetBtn.addEventListener('click', () => {
            instructions.value = AI.DEFAULT_INSTRUCTIONS;
            flashButton(resetBtn, `${icon('check')} Restauradas`, 'ok');
        });

        saveBtn.addEventListener('click', async () => {
            await UcursedntUtils.Storage.set(AI.SETTINGS_KEY, {
                provider: providerSelect.value,
                instructions: instructions.value.trim()
            });
            flashButton(saveBtn, `${icon('check')} Guardado`);
        });

        return section;
    }

    // ── Sonido de entrega ───────────────────────────────────────────────────
    // Extract YouTube video ID from a URL or plain ID
    function extractYouTubeVideoId(input) {
        const urlMatch = input.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (urlMatch) return urlMatch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
        return null;
    }

    async function createSoundConfigSection() {
        const defaultVideoId = '_Z3ra0CxCE0';
        const defaultUrl = `https://www.youtube.com/watch?v=${defaultVideoId}`;
        const soundSettings = await UcursedntUtils.Storage.get('taskSubmissionSoundSettings') || {};
        const currentVideoId = soundSettings.videoId || defaultVideoId;

        const section = document.createElement('section');
        UcursedntUtils.DOM.safeSetHTML(section, `
            ${Pages.sectionHeading('music', 'Sonido de entrega de tareas')}
            <p class="ucd-section-intro">Elige el video de YouTube cuyo audio suena al entregar una tarea.</p>
            <table class="form big">
                <tbody>
                    <tr>
                        <th><label for="sound-youtube-url">URL o ID de YouTube</label></th>
                        <td>
                            <input type="text" id="sound-youtube-url" placeholder="${defaultUrl}">
                            <span class="ucd-help">Acepta la URL completa o el ID de 11 caracteres. Déjalo vacío para usar el sonido por defecto (<a href="${defaultUrl}" target="_blank" rel="noopener noreferrer">escuchar</a>).</span>
                            <div class="wrong" id="sound-error" hidden>La URL o el ID no son válidos. Revisa que sea un enlace de YouTube o un ID de 11 caracteres.</div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="ucd-actions">
                <button type="button" class="boton ok" id="sound-save">${icon('save')} Guardar sonido</button>
            </div>
        `);

        const urlInput = section.querySelector('#sound-youtube-url');
        const errorBox = section.querySelector('#sound-error');
        const saveBtn = section.querySelector('#sound-save');
        urlInput.value = currentVideoId !== defaultVideoId ? `https://www.youtube.com/watch?v=${currentVideoId}` : '';

        saveBtn.addEventListener('click', async () => {
            const input = urlInput.value.trim();
            let videoId = defaultVideoId;
            if (input) {
                const extracted = extractYouTubeVideoId(input);
                if (!extracted) {
                    errorBox.hidden = false;
                    urlInput.focus();
                    return;
                }
                videoId = extracted;
            }
            errorBox.hidden = true;
            await UcursedntUtils.Storage.set('taskSubmissionSoundSettings', { videoId });
            flashButton(saveBtn, `${icon('check')} Guardado`);
        });

        return section;
    }

    // ── Datos guardados ─────────────────────────────────────────────────────
    function createStorageSection() {
        const section = document.createElement('section');
        UcursedntUtils.DOM.safeSetHTML(section, `
            ${Pages.sectionHeading('database', 'Datos guardados')}
            <p class="ucd-section-intro">La extensión guarda tu configuración, logros y preferencias en el almacenamiento sincronizado del navegador.</p>
            <div class="ucd-actions">
                <button type="button" class="boton" id="showChromeStorageButton" aria-expanded="false">${icon('eye')} Mostrar datos guardados</button>
                <button type="button" class="boton wrong" id="clearChromeStorageButton">${icon('trash')} Borrar todos los datos</button>
            </div>
            <div class="ucd-storage-wrap" hidden>
                <table class="ucd-storage-table">
                    <thead><tr><th>Clave</th><th>Valor</th><th aria-label="Acciones"></th></tr></thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        const showButton = section.querySelector('#showChromeStorageButton');
        const clearButton = section.querySelector('#clearChromeStorageButton');
        const wrap = section.querySelector('.ucd-storage-wrap');
        const tbody = section.querySelector('tbody');

        async function updateStorageTable() {
            tbody.replaceChildren();
            const storageItems = await UcursedntUtils.Storage.getAll();

            Object.keys(storageItems).sort().forEach(key => {
                const value = JSON.stringify(storageItems[key]);
                const row = document.createElement('tr');

                const keyCell = document.createElement('td');
                keyCell.textContent = key;

                const valueCell = document.createElement('td');
                const code = document.createElement('code');
                code.textContent = value;
                code.title = value;
                valueCell.appendChild(code);

                const actionCell = document.createElement('td');
                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'boton wrong';
                deleteBtn.title = `Borrar "${key}"`;
                deleteBtn.setAttribute('aria-label', `Borrar "${key}"`);
                UcursedntUtils.DOM.safeSetHTML(deleteBtn, icon('trash'));
                deleteBtn.addEventListener('click', async () => {
                    if (confirm(`¿Borrar "${key}" del almacenamiento de la extensión?`)) {
                        await UcursedntUtils.Storage.remove(key);
                        await updateStorageTable();
                    }
                });
                actionCell.appendChild(deleteBtn);

                row.append(keyCell, valueCell, actionCell);
                tbody.appendChild(row);
            });
        }

        showButton.addEventListener('click', async () => {
            const willShow = wrap.hidden;
            if (willShow) await updateStorageTable();
            wrap.hidden = !willShow;
            showButton.setAttribute('aria-expanded', String(willShow));
            UcursedntUtils.DOM.safeSetHTML(showButton, willShow
                ? `${icon('eyeOff')} Ocultar datos guardados`
                : `${icon('eye')} Mostrar datos guardados`);
        });

        clearButton.addEventListener('click', async () => {
            const clearConfirmed = confirm('¿Borrar todos los datos de la extensión? Se pierden tu configuración, tus logros y tus preferencias. Esta acción no se puede deshacer.');
            if (!clearConfirmed) return;

            await UcursedntUtils.Storage.clear();
            await initSettings();
            location.reload();
        });

        return section;
    }

    // Inicializar la página
    async function initPage() {
        const page = Pages.preparePage("U-Cursedn't");
        UcursedntUtils.UI.ensureSelectStyles();

        page.appendChild(await createFeaturesSection());
        page.appendChild(await createAIConfigSection());
        page.appendChild(await createSoundConfigSection());
        page.appendChild(createStorageSection());
    }

    // Ejecutar la inicialización al cargar la página
    await initSettings();
    await initPage();

})();
