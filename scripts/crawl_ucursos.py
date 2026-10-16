"""
crawl_ucursos.py - Explora U-Cursos con la sesión de Zen Browser para verificar los
selectores que usa src/js/ucursosActivity.js (logros por acciones de U-Cursos).

Solo hace GET y nunca sigue enlaces con csrf/accion/subaccion/logout, así que no
publica, no vota, no marca estrellas ni cierra tu sesión.

Uso:
    pip install requests beautifulsoup4
    python scripts/crawl_ucursos.py                  # perfil de Zen más reciente
    python scripts/crawl_ucursos.py --profile <ruta> # carpeta de perfil específica
    python scripts/crawl_ucursos.py --max-pages 120 --delay 1.5
    python scripts/crawl_ucursos.py --cookies scripts/logs/ucursos_cookies.json

--cookies acepta el JSON que exportan extensiones como Cookie-Editor. Guárdalo en
scripts/logs/ (ignorado por git): las cookies de sesión dan acceso a tu cuenta.

Resultado: scripts/logs/ucursos_crawl_<fecha>/ con el HTML de cada página y report.md.
Cierra Zen o espera unos segundos si la base de cookies está bloqueada.
"""

import argparse
import glob
import json
import os
import re
import shutil
import sqlite3
import sys
import tempfile
import time
from collections import deque
from urllib.parse import urljoin, urlparse

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit('Faltan dependencias: pip install requests beautifulsoup4')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(SCRIPT_DIR, 'logs')
BASE_URL = 'https://www.u-cursos.cl/'

# Nunca seguir enlaces que ejecutan acciones
UNSAFE_RE = re.compile(r'csrf=|accion=|subaccion=|logout|_hook=|theme=|javascript:|mailto:', re.I)

# Módulos relevantes para los logros (el resto se registra, pero no se recorre)
MODULES_OF_INTEREST = {
    'foro', 'foro_institucion', 'notas', 'tareas', 'tareas_usuario', 'encuestas', 'votaciones',
    'material_docente', 'material_alumnos', 'materiales', 'asistencias2', 'clases', 'correo',
    'afiches', 'novedades_institucion', 'novedades', 'comunidades', 'historial', 'integrantes',
    'calendario', 'favoritos', 'datos_usuario', 'horario', 'mis_canales', 'todos_cursos'
}

# Enlaces dentro de un módulo que suelen llevar a formularios (nuevo tema, subir afiche, etc.)
SUBPAGE_RE = re.compile(r'(^|/)(nuevo|nueva|afiche|responder|redactar|enviar|detalle|o/\d+|editar)', re.I)

# Selectores que usa ucursosActivity.js
PROBES = {
    'modulo seleccionado (ul.modulos li.servicio.sel)': 'ul.modulos li.servicio.sel',
    'hilos del foro (div[id^=raiz_])': 'div[id^="raiz_"]',
    'respuestas (.msg.hijo)': '.msg.hijo',
    'titulo de hilo (#mensaje-titulo)': '#mensaje-titulo',
    'estrella sin marcar (a.star.off)': 'a.star.off',
    'estrella marcada (a.star:not(.off))': 'a.star:not(.off)',
    'reacciones (span.reaccion a)': 'span.reaccion a',
    'enlaces adh_accion': 'a[href*="adh_accion"]',
    'archivos (a.file)': 'a.file',
    'enlaces a r/ (archivos)': 'a[href*="r/"]',
    'mascota sin tareas (.mascota-ok)': '.mascota.mascota-ok',
    'selector de tema (ul.themes a)': 'ul.themes a',
    'favorito (subaccion=favorito)': 'a[href*="subaccion=favorito"]',
    'inicio (subaccion=inicio)': 'a[href*="subaccion=inicio"]',
    'textarea': 'textarea',
    'input file': 'input[type="file"]',
    'paginacion (ul.paginas)': 'ul.paginas',
}


def find_zen_profile(explicit=None):
    if explicit:
        return explicit
    appdata = os.environ.get('APPDATA', os.path.expanduser('~/.zen'))
    candidates = glob.glob(os.path.join(appdata, 'zen', 'Profiles', '*', 'cookies.sqlite'))
    candidates += glob.glob(os.path.expanduser('~/.zen/*/cookies.sqlite'))
    if not candidates:
        sys.exit('No encontré cookies.sqlite de Zen. Usa --profile <carpeta del perfil>.')
    return os.path.dirname(max(candidates, key=os.path.getmtime))


def load_cookies(profile_dir):
    """Copia cookies.sqlite (y su WAL) a un temporal para leerla aunque Zen esté abierto."""
    src = os.path.join(profile_dir, 'cookies.sqlite')
    tmp_dir = tempfile.mkdtemp(prefix='zen_cookies_')
    dst = os.path.join(tmp_dir, 'cookies.sqlite')
    shutil.copy2(src, dst)
    for suffix in ('-wal', '-shm'):
        if os.path.exists(src + suffix):
            shutil.copy2(src + suffix, dst + suffix)

    jar = requests.cookies.RequestsCookieJar()
    try:
        con = sqlite3.connect(dst)
        rows = con.execute(
            "SELECT name, value, host, path FROM moz_cookies WHERE host LIKE '%u-cursos.cl'"
        ).fetchall()
        con.close()
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    for name, value, host, path in rows:
        jar.set(name, value, domain=host, path=path)
    return jar, len(rows)


def load_cookies_json(path):
    """Lee un export JSON de cookies (lista de {name, value, domain, path})."""
    with open(path, encoding='utf-8') as fh:
        items = json.load(fh)
    jar = requests.cookies.RequestsCookieJar()
    for item in items:
        if 'u-cursos.cl' in item.get('domain', ''):
            jar.set(item['name'], item['value'], domain=item['domain'], path=item.get('path', '/'))
    return jar, len(jar)


def module_of(soup):
    sel = soup.select_one('ul.modulos li.servicio.sel')
    if sel:
        for cls in sel.get('class', []):
            if cls.startswith('servicio_'):
                return cls[len('servicio_'):]
    body = soup.select_one('#body')
    if body:
        classes = [c for c in body.get('class', []) if c != 'ucursos' and not c.startswith(('focus', 'classic'))]
        if classes:
            return classes[0]
    return None


def describe_forms(soup):
    forms = []
    for form in soup.select('#body form, form'):
        fields = []
        for field in form.select('input, textarea, select, button'):
            ftype = field.get('type', field.name)
            if ftype == 'hidden' and field.get('name') == 'csrf':
                continue
            fields.append(f"{field.name}[type={ftype}, name={field.get('name')}]")
        forms.append({
            'action': form.get('action', ''),
            'method': (form.get('method') or 'get').lower(),
            'enctype': form.get('enctype', ''),
            'id': form.get('id', ''),
            'class': ' '.join(form.get('class', [])),
            'fields': fields,
        })
    # Quitar duplicados (el select de '#body form, form' repite)
    seen, unique = set(), []
    for f in forms:
        key = (f['action'], f['method'], tuple(f['fields']))
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return unique


def is_ucursos(url):
    host = urlparse(url).netloc
    return host.endswith('u-cursos.cl')


def safe(url):
    return is_ucursos(url) and not UNSAFE_RE.search(url)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--profile', help='Carpeta del perfil de Zen (contiene cookies.sqlite)')
    parser.add_argument('--cookies', help='Archivo JSON con cookies exportadas (en vez del perfil de Zen)')
    parser.add_argument('--max-pages', type=int, default=80)
    parser.add_argument('--delay', type=float, default=1.0, help='Segundos entre peticiones')
    parser.add_argument('--max-courses', type=int, default=6)
    args = parser.parse_args()

    if args.cookies:
        jar, count = load_cookies_json(args.cookies)
        print(f'Cookies: {args.cookies} ({count} de u-cursos.cl)')
    else:
        profile = find_zen_profile(args.profile)
        jar, count = load_cookies(profile)
        print(f'Perfil: {profile} ({count} cookies de u-cursos.cl)')
    if not count:
        sys.exit('No hay cookies de u-cursos.cl: inicia sesión en Zen primero.')

    session = requests.Session()
    session.cookies = jar
    session.headers['User-Agent'] = 'Mozilla/5.0 (U-Cursednt crawler; solo lectura)'

    out_dir = os.path.join(LOG_DIR, time.strftime('ucursos_crawl_%Y%m%d_%H%M%S'))
    os.makedirs(out_dir, exist_ok=True)

    queue = deque([(BASE_URL, 'inicio')])
    visited = set()
    report = []
    courses_seen = 0
    modal_fetched = False

    def push(url, reason):
        url = url.split('#')[0]
        if url not in visited and safe(url):
            queue.append((url, reason))

    while queue and len(visited) < args.max_pages:
        url, reason = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        try:
            resp = session.get(url, timeout=20)
        except requests.RequestException as error:
            report.append({'url': url, 'reason': reason, 'error': str(error)})
            continue
        time.sleep(args.delay)

        resp.encoding = resp.encoding or 'iso-8859-1'
        html = resp.text
        soup = BeautifulSoup(html, 'html.parser')

        body_classes = soup.body.get('class', []) if soup.body else []
        if 'logeado' not in body_classes:
            print(f'  ! {url}: no parece haber sesión iniciada')

        module = module_of(soup)
        filename = f'{len(visited):03d}_{module or "pagina"}.html'
        with open(os.path.join(out_dir, filename), 'w', encoding='utf-8') as fh:
            fh.write(html)

        theme_css = soup.select_one('link#css_ucampus')
        widget = soup.select_one('#widget_perfil')
        entry = {
            'url': url,
            'reason': reason,
            'file': filename,
            'status': resp.status_code,
            'module': module,
            'body_class': ' '.join(soup.select_one('#body').get('class', [])) if soup.select_one('#body') else '',
            'html_lang': soup.html.get('lang') if soup.html else '',
            'theme_css': theme_css.get('href') if theme_css else '',
            'widget_perfil': ' '.join(widget.get('class', [])) if widget else '',
            'probes': {label: len(soup.select(sel)) for label, sel in PROBES.items()},
            'forms': describe_forms(soup),
            'sample_links': [],
        }

        threads = soup.select('div[id^="raiz_"]')
        if threads:
            entry['max_replies'] = max(len(t.select('.msg.hijo')) for t in threads)
            entry['thread_titles'] = [t.select_one('#mensaje-titulo').get_text(strip=True)
                                      for t in threads if t.select_one('#mensaje-titulo')][:10]

        print(f'[{len(visited):03d}] {module or "-":<22} {url}')

        # Descubrir enlaces
        body = soup.select_one('#body') or soup
        if reason == 'inicio':
            for a in soup.select('#cursos a[href], #comunidades a[href], #instituciones a[href], #favs a[href]'):
                if courses_seen < args.max_courses * 3:
                    push(urljoin(url, a['href']), 'menu lateral')
                    courses_seen += 1
            for a in soup.select('ul.modulos li.servicio a[href]'):
                push(urljoin(url, a['href']), 'modulo de usuario')

        for a in soup.select('ul.modulos li.servicio a[href]'):
            li = a.find_parent('li')
            name = next((c[len('servicio_'):] for c in li.get('class', []) if c.startswith('servicio_')), '') if li else ''
            if name in MODULES_OF_INTEREST:
                push(urljoin(url, a['href']), f'modulo {name}')

        # Pocas subpáginas por módulo: basta con ver un hilo, un formulario, un detalle
        if module in MODULES_OF_INTEREST and reason.startswith('modulo'):
            module_root = url.split('?')[0]
            for a in body.select('a[href]'):
                href = a['href']
                full = urljoin(url, href)
                if not SUBPAGE_RE.search(href) or not full.startswith(module_root):
                    continue
                entry['sample_links'].append(href)
                push(full, f'subpagina de {module}')
                if len(entry['sample_links']) >= 4:
                    break

        # El modal de reacciones solo se lee (adh_accion=modal no reacciona)
        if not modal_fetched:
            modal = soup.select_one('a[href*="adh_accion=modal"]')
            if modal:
                modal_url = urljoin(url, modal['href'])
                try:
                    m = session.get(modal_url, timeout=20)
                    m.encoding = m.encoding or 'iso-8859-1'
                    with open(os.path.join(out_dir, 'modal_reacciones.html'), 'w', encoding='utf-8') as fh:
                        fh.write(m.text)
                    entry['reaction_modal'] = modal_url
                    modal_fetched = True
                except requests.RequestException:
                    pass

        report.append(entry)

    write_report(out_dir, report)
    print(f'\nListo: {len(visited)} páginas. Reporte en {os.path.join(out_dir, "report.md")}')


def write_report(out_dir, report):
    lines = ['# Crawl de U-Cursos para logros', '',
             f'Generado: {time.strftime("%Y-%m-%d %H:%M:%S")}', '']

    modules = sorted({e.get('module') or '-' for e in report if 'error' not in e})
    lines += ['## Módulos encontrados', '', ', '.join(modules), '']

    for e in report:
        lines.append(f"## {e.get('module') or '-'} — {e['url']}")
        if 'error' in e:
            lines += [f"Error: {e['error']}", '']
            continue
        lines.append(f"- archivo: `{e['file']}` · estado {e['status']} · motivo: {e['reason']}")
        lines.append(f"- #body: `{e['body_class']}` · lang: `{e['html_lang']}` · css: `{e['theme_css']}`")
        lines.append(f"- widget_perfil: `{e['widget_perfil']}`")
        hits = {k: v for k, v in e['probes'].items() if v}
        if hits:
            lines.append('- selectores: ' + ', '.join(f'{k}={v}' for k, v in hits.items()))
        if 'max_replies' in e:
            lines.append(f"- hilo con más respuestas: {e['max_replies']}")
            lines.append('- títulos: ' + ' | '.join(e.get('thread_titles', [])))
        if e.get('reaction_modal'):
            lines.append(f"- modal de reacciones guardado en `modal_reacciones.html` ({e['reaction_modal']})")
        if e['sample_links']:
            lines.append('- subenlaces: ' + ', '.join(f'`{h}`' for h in e['sample_links']))
        for form in e['forms']:
            lines.append(f"- form `{form['method']}` action=`{form['action']}` id=`{form['id']}` "
                         f"class=`{form['class']}` enctype=`{form['enctype']}`")
            lines.append('    - ' + ', '.join(form['fields']))
        lines.append('')

    with open(os.path.join(out_dir, 'report.md'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))


if __name__ == '__main__':
    main()
