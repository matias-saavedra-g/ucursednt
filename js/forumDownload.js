// forumDownload.js - Download forum posts across multiple pages
// Adds a minimalist dropdown to forum pages to bulk-download threads as TXT/JSON/CSV

(async function () {
    'use strict';

    if (window.forumDownloadLoaded) return;
    window.forumDownloadLoaded = true;

    // ── Guard: only run on forum pages ────────────────────────────────────────

    function isForumPage() {
        return /\/(foro[_\/])/.test(window.location.pathname);
    }

    if (!isForumPage()) return;

    // ── Settings check ────────────────────────────────────────────────────────

    function getChromeStorageItem(key) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.get([key], (result) => {
                    if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                    else resolve(result[key] !== undefined ? result[key] : null);
                });
            } catch (e) { reject(e); }
        });
    }

    function setChromeStorageItem(key, value) {
        return new Promise((resolve, reject) => {
            try {
                chrome.storage.sync.set({ [key]: value }, () => {
                    if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                    else resolve();
                });
            } catch (e) { reject(e); }
        });
    }

    const settings = await getChromeStorageItem('settings');
    if (settings && settings.features && settings.features.forumDownload === false) return;

    // ── URL helpers ───────────────────────────────────────────────────────────

    function getForumBaseUrl() {
        return window.location.origin + window.location.pathname;
    }

    /** Preserve any active id_tema filter when building paginated URLs. */
    function buildPageUrl(offset) {
        const base    = getForumBaseUrl();
        const idTema  = new URLSearchParams(window.location.search).get('id_tema') || '';
        return `${base}?id_tema=${encodeURIComponent(idTema)}&offset=${offset}`;
    }

    /** Returns the total number of pages by scanning the paginator (≥1). */
    function detectTotalPages() {
        let maxOffset = 0;
        document.querySelectorAll('ul.paginas a').forEach(a => {
            const m = (a.getAttribute('href') || '').match(/offset=(\d+)/);
            if (m) maxOffset = Math.max(maxOffset, parseInt(m[1], 10));
        });
        return maxOffset + 1; // offset is 0-based, pages are 1-based
    }

    // ── Text helpers ──────────────────────────────────────────────────────────

    function cleanText(raw) {
        return (raw || '')
            .replace(/\u00a0/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    // ── HTML parser ───────────────────────────────────────────────────────────

    /**
     * Parse all threads from a (fetched or live) document.
     * Returns an array of thread objects:
     *   { threadId, title, theme, posts: [{ id, type, author, time, content }] }
     */
    function parseDocument(doc) {
        const threads = [];
        doc.querySelectorAll('div[id^="raiz_"]').forEach(thread => {
            threads.push(parseThread(thread));
        });
        return threads;
    }

    function parseThread(thread) {
        const threadId = thread.id.replace('raiz_', '');
        const titleEl  = thread.querySelector('h1 a[id="mensaje-titulo"]');
        const themeEl  = thread.querySelector('.pill.rainbow a');
        const title    = titleEl ? titleEl.textContent.trim() : '';
        const theme    = themeEl ? themeEl.textContent.trim() : '';

        // Root-post author & time are in the thread header (.sticky.objetoflex),
        // NOT inside the .msg.raiz element itself.
        const hAuthor  = thread.querySelector('.sticky.objetoflex h2 a.usuario');
        const hTimeEx  = thread.querySelector('.sticky.objetoflex h2 .only-excel');
        const hTimeRel = thread.querySelector('.sticky.objetoflex h2 .tiempo_rel');
        const rootAuthor = hAuthor  ? hAuthor.textContent.trim() : '';
        const rootTime   = hTimeEx  ? hTimeEx.textContent.trim()
                         : hTimeRel ? hTimeRel.textContent.trim() : '';

        const posts = [];

        // Root post
        const rootMsg = thread.querySelector('.msg.raiz');
        if (rootMsg) {
            const contentEl = rootMsg.querySelector('.texto .ta');
            posts.push({
                id:      rootMsg.id.replace('mensaje_', ''),
                type:    'original',
                author:  rootAuthor,
                time:    rootTime,
                content: contentEl ? cleanText(contentEl.textContent) : '',
            });
        }

        // Reply posts
        thread.querySelectorAll('.msg.hijo').forEach(reply => {
            const aEl  = reply.querySelector('.autor a.usuario');
            const tEx  = reply.querySelector('.autor .only-excel');
            const tRel = reply.querySelector('.autor .tiempo_rel');
            const cEl  = reply.querySelector('.texto .ta');
            posts.push({
                id:      reply.id.replace('mensaje_', ''),
                type:    'respuesta',
                author:  aEl  ? aEl.textContent.trim() : '',
                time:    tEx  ? tEx.textContent.trim()
                       : tRel ? tRel.textContent.trim() : '',
                content: cEl  ? cleanText(cEl.textContent) : '',
            });
        });

        return { threadId, title, theme, posts };
    }

    // ── Fetch a single paginated forum page ───────────────────────────────────

    async function fetchPage(offset) {
        const url  = buildPageUrl(offset);
        const resp = await fetch(url, { credentials: 'include' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status} al obtener offset ${offset}`);
        const html = await resp.text();
        const doc  = new DOMParser().parseFromString(html, 'text/html');
        return parseDocument(doc);
    }

    // ── Formatters ────────────────────────────────────────────────────────────

    function toTxt(threads) {
        const HR = '\u2500'.repeat(60);
        return threads.map(t => {
            const header = `${HR}\n\u{1F4CC} ${t.title}${t.theme ? `  [${t.theme}]` : ''}\n${HR}`;
            const body   = t.posts.map(p => {
                const label = p.type === 'original' ? '' : '  \u21A9 Respuesta\n';
                const lines = p.content.split('\n').map(l => '  ' + l).join('\n');
                return `${label}  \u{1F464} ${p.author}  \u{1F4C5} ${p.time}\n\n${lines}`;
            }).join('\n\n  \u00B7\u00B7\u00B7\n\n');
            return `${header}\n\n${body}`;
        }).join('\n\n\n');
    }

    function toJSON(threads) {
        return JSON.stringify(threads, null, 2);
    }

    function csvEscape(val) {
        const s = String(val == null ? '' : val).replace(/"/g, '""');
        return /[,"\n\r]/.test(s) ? `"${s}"` : s;
    }

    function toCSV(threads) {
        const rows = [['thread_id', 'title', 'theme', 'post_id', 'type', 'author', 'date', 'content']];
        threads.forEach(t => {
            t.posts.forEach(p => {
                rows.push([t.threadId, t.title, t.theme, p.id, p.type, p.author, p.time, p.content]);
            });
        });
        return rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
    }

    // ── File download ─────────────────────────────────────────────────────────

    function downloadBlob(content, filename, mime) {
        const bom  = mime.startsWith('text') ? '\uFEFF' : '';
        const blob = new Blob([bom + content], { type: `${mime};charset=utf-8` });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    }

    // ── Styles ────────────────────────────────────────────────────────────────

    function addStyles() {
        if (document.getElementById('fdt-styles')) return;
        const s = document.createElement('style');
        s.id = 'fdt-styles';
        s.textContent = `
/* Trigger button — same look as .show-more-button */
.fdt-trigger {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 12px;
    color: inherit;
    opacity: 0.65;
    text-decoration: underline;
    text-underline-offset: 3px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 6px 0 2px;
    transition: opacity 0.2s ease;
    font-family: inherit;
}
.fdt-trigger:hover { opacity: 1; }
.fdt-trigger:active { opacity: 0.4; }

/* Wrapper — mirrors .forum-ia-dropdown */
#forum-download-widget {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
}

/* Panel — mirrors .forum-ia-menu */
#fdt-panel {
    position: relative;
    max-height: 0;
    opacity: 0;
    margin-top: 0;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.12);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    min-width: 260px;
    overflow: hidden;
    pointer-events: none;
    transform-origin: top;
    transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, margin-top 0.25s ease;
}
#fdt-panel.open {
    opacity: 1;
    margin-top: 6px;
    pointer-events: auto;
}

/* Panel inner padding */
#fdt-panel-inner {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
    color: inherit;
    font-family: inherit;
}

/* Rows inside the panel */
.fdt-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}
.fdt-row label {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
}
.fdt-row input[type=number],
.fdt-row select {
    border: 1px solid rgba(0,0,0,0.2);
    border-radius: 4px;
    font-size: 12px;
    padding: 2px 5px;
    background: #fafafa;
    color: inherit;
    outline: none;
    font-family: inherit;
}
.fdt-row input[type=number] { width: 52px; }
.fdt-row select { cursor: pointer; }

.fdt-action-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}
.fdt-dl-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 12px;
    color: inherit;
    opacity: 0.65;
    text-decoration: underline;
    text-underline-offset: 3px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.2s ease;
    font-family: inherit;
}
.fdt-dl-btn:hover { opacity: 1; }
.fdt-dl-btn:disabled { opacity: 0.3; cursor: not-allowed; text-decoration: none; }
.fdt-cancel-btn {
    color: #c0392b;
}

/* Progress */
#fdt-progress {
    display: none;
    flex-direction: column;
    gap: 4px;
}
.fdt-bar-wrap {
    height: 4px;
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
    overflow: hidden;
}
.fdt-bar-fill {
    height: 100%;
    background: currentColor;
    border-radius: 2px;
    opacity: 0.5;
    transition: width .25s ease;
    width: 0%;
}
#fdt-status {
    font-size: 11px;
    opacity: 0.7;
}
        `;
        document.head.appendChild(s);
    }

    // ── Widget DOM ────────────────────────────────────────────────────────────

    function buildWidget(totalPages) {
        if (document.getElementById('forum-download-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'forum-download-widget';

        // Trigger button
        const trigger = document.createElement('button');
        trigger.className = 'fdt-trigger';
        trigger.innerHTML = '<i class="fa fa-download"></i> Descargar Foro <i class="fa fa-caret-down"></i>';

        // Dropdown panel
        const panel = document.createElement('div');
        panel.id = 'fdt-panel';

        const inner = document.createElement('div');
        inner.id = 'fdt-panel-inner';
        inner.innerHTML = `
<div class="fdt-row">
    <label>P&aacute;gs.&nbsp;<input type="number" id="fdt-from" min="1" max="${totalPages}" value="1"> &ndash; <input type="number" id="fdt-to" min="1" max="${totalPages}" value="${totalPages}"></label>
    <span style="opacity:.6">de&nbsp;${totalPages}</span>
</div>
<div class="fdt-row">
    <label>Formato&nbsp;
        <select id="fdt-format">
            <option value="txt">Texto (.txt)</option>
            <option value="json">JSON (.json)</option>
            <option value="csv">CSV (.csv)</option>
        </select>
    </label>
</div>
<div class="fdt-action-row">
    <button id="fdt-btn" class="fdt-dl-btn"><i class="fa fa-download"></i> Descargar</button>
    <button id="fdt-cancel" class="fdt-dl-btn fdt-cancel-btn" style="display:none">Cancelar</button>
</div>
<div id="fdt-progress">
    <div class="fdt-bar-wrap"><div class="fdt-bar-fill" id="fdt-fill"></div></div>
    <span id="fdt-status"></span>
</div>`;

        panel.appendChild(inner);
        widget.appendChild(trigger);
        widget.appendChild(panel);

        // Insert before the first thread
        const firstThread = document.querySelector('div[id^="raiz_"]');
        if (firstThread && firstThread.parentElement) {
            firstThread.parentElement.insertBefore(widget, firstThread);
        } else {
            document.body.prepend(widget);
        }

        // Toggle open/close
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = panel.classList.toggle('open');
            if (open) {
                panel.style.maxHeight = panel.scrollHeight + 200 + 'px';
                trigger.querySelector('.fa-caret-down, .fa-caret-up').className = 'fa fa-caret-up';
            } else {
                panel.style.maxHeight = '0';
                trigger.querySelector('.fa-caret-down, .fa-caret-up').className = 'fa fa-caret-down';
            }
        });

        document.addEventListener('click', (e) => {
            if (!widget.contains(e.target) && panel.classList.contains('open')) {
                panel.classList.remove('open');
                panel.style.maxHeight = '0';
                trigger.querySelector('.fa-caret-down, .fa-caret-up').className = 'fa fa-caret-down';
            }
        });

        inner.querySelector('#fdt-btn').addEventListener('click', () => runDownload(totalPages));
        inner.querySelector('#fdt-cancel').addEventListener('click', () => { cancelRequested = true; });
    }

    // ── Download flow ─────────────────────────────────────────────────────────

    let cancelRequested = false;

    async function runDownload(totalPages) {
        const fromVal = parseInt(document.getElementById('fdt-from').value, 10);
        const toVal   = parseInt(document.getElementById('fdt-to').value,   10);
        const format  = document.getElementById('fdt-format').value;

        if (!Number.isFinite(fromVal) || !Number.isFinite(toVal) ||
            fromVal < 1 || toVal < fromVal || toVal > totalPages) {
            alert(`Rango inválido. Ingresa valores entre 1 y ${totalPages}.`);
            return;
        }

        const pageCount = toVal - fromVal + 1;
        if (pageCount > 50) {
            const ok = confirm(
                `Vas a descargar ${pageCount} páginas (~${pageCount * 10} hilos).\n¿Deseas continuar?`
            );
            if (!ok) return;
        }

        cancelRequested = false;

        const btn      = document.getElementById('fdt-btn');
        const cancelBtn = document.getElementById('fdt-cancel');
        const progress = document.getElementById('fdt-progress');
        const fill     = document.getElementById('fdt-fill');
        const status   = document.getElementById('fdt-status');

        btn.disabled            = true;
        cancelBtn.style.display = '';
        progress.style.display  = 'flex';

        const allThreads = [];
        let   aborted    = false;

        for (let page = fromVal; page <= toVal; page++) {
            if (cancelRequested) {
                status.textContent   = 'Descarga cancelada.';
                cancelBtn.style.display = 'none';
                aborted = true;
                break;
            }

            const offset = page - 1;
            status.textContent  = `Obteniendo página ${page} / ${toVal}…`;
            fill.style.width    = `${((page - fromVal) / pageCount) * 100}%`;

            try {
                const threads = await fetchPage(offset);
                allThreads.push(...threads);
            } catch (err) {
                status.textContent   = `✗ Error en página ${page}: ${err.message}`;
                aborted = true;
                btn.disabled            = false;
                cancelBtn.style.display = 'none';
                return;
            }

            // Polite pause so we don't hammer the server
            await new Promise(r => setTimeout(r, 250));
        }

        if (!aborted) {
            fill.style.width   = '100%';
            status.textContent = 'Generando archivo…';

            const OPTS = {
                txt:  { fn: toTxt,  ext: 'txt',  mime: 'text/plain'       },
                json: { fn: toJSON, ext: 'json', mime: 'application/json' },
                csv:  { fn: toCSV,  ext: 'csv',  mime: 'text/csv'         },
            };
            const { fn, ext, mime } = OPTS[format];

            const safeTitle  = (document.title || 'foro')
                .replace(/[^\w\s\-]/g, '')
                .trim()
                .replace(/\s+/g, '_')
                .slice(0, 40) || 'foro';
            const filename   = `${safeTitle}_p${fromVal}-${toVal}.${ext}`;

            downloadBlob(fn(allThreads), filename, mime);

            const threadCount = allThreads.length;
            const postCount   = allThreads.reduce((s, t) => s + t.posts.length, 0);
            status.textContent =
                `✓ ${threadCount} hilos, ${postCount} msgs (págs. ${fromVal}–${toVal})`;

            // Achievement: first forum download
            try {
                const stored = await getChromeStorageItem('forumDownloadFirstUse');
                if (!stored) await setChromeStorageItem('forumDownloadFirstUse', true);
            } catch (_) {}
        }

        cancelBtn.style.display = 'none';
        btn.disabled = false;
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    function init() {
        const totalPages = detectTotalPages();
        addStyles();
        buildWidget(totalPages);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
    } else {
        setTimeout(init, 800);
    }
})();
