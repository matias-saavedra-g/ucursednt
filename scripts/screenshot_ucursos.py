"""
screenshot_ucursos.py - Recorre U-Cursos en Chromium con la extensión cargada (dist/chrome)
y la sesión de Zen Browser, saca una captura de cada página y regenera las imágenes del
README en src/images/.

Usa las mismas reglas que crawl_ucursos.py: solo navega con GET y nunca abre enlaces con
csrf/accion/subaccion/logout, así que no publica, no vota ni cierra tu sesión.

Uso:
    pip install playwright beautifulsoup4 requests
    python -m playwright install chromium
    python scripts/build.py                              # genera dist/chrome
    python scripts/screenshot_ucursos.py                 # crawl + capturas del README
    python scripts/screenshot_ucursos.py --only readme   # solo las páginas guardadas del README
    python scripts/screenshot_ucursos.py --only crawl --max-pages 120
    python scripts/screenshot_ucursos.py --images menuGen achievementsGen
    python scripts/screenshot_ucursos.py --only readme --images muchoTexto --url muchoTexto=https://www.u-cursos.cl/...
    python scripts/screenshot_ucursos.py --cookies scripts/logs/ucursos_cookies.json
    python scripts/screenshot_ucursos.py --dry-run       # no toca src/images/
    python scripts/screenshot_ucursos.py --theme focus-dark  # tema de las capturas (por defecto Focus claro)

Resultado:
    scripts/logs/ucursos_screens_<fecha>/  capturas de página completa + report.md
    src/images/<nombre>.png                imágenes del README (o en la carpeta de logs con --dry-run)
    scripts/logs/readme_sources.json       URL de donde salió cada imagen del README

El modo completo recorre U-Cursos, busca una página para cada imagen y guarda su URL en
readme_sources.json. Después, --only readme abre solo esas páginas (y las fijas, como /logros/),
sin recorrer nada. --url NOMBRE=URL fija a mano la página de una imagen y también se guarda.
El archivo está en scripts/logs/ (ignorado por git) porque las URLs incluyen tu id de usuario.

Por defecto difumina nombres y fotos de otras personas (--no-blur para desactivarlo).
Revisa las imágenes con `git diff` antes de hacer commit: salen de tu cuenta real.
"""

import argparse
import json
import os
import re
import sys
import time
from collections import deque
from urllib.parse import urljoin

try:
    from bs4 import BeautifulSoup
    from playwright.sync_api import sync_playwright, Error as PlaywrightError
except ImportError:
    sys.exit('Faltan dependencias: pip install playwright beautifulsoup4 requests\n'
             '                    python -m playwright install chromium')

from crawl_ucursos import (BASE_URL, LOG_DIR, MODULES_OF_INTEREST, SUBPAGE_RE, find_zen_profile,
                           load_cookies, load_cookies_json, module_of, safe)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
EXTENSION_DIR = os.path.join(BASE_DIR, 'dist', 'chrome')
IMAGES_DIR = os.path.join(BASE_DIR, 'src', 'images')
PROFILE_DIR = os.path.join(LOG_DIR, 'screenshot_profile')  # conserva los ajustes de la extensión
SOURCES_FILE = os.path.join(LOG_DIR, 'readme_sources.json')

VIEWPORT = {'width': 1280, 'height': 900}

# Elementos con datos de otras personas que se difuminan en las capturas
BLUR_CSS = """
a.usuario, .autor .usuario, .sticky h2 a.usuario, #widget_perfil h1, #widget_perfil img,
td.objetoflex.string.responsive-main h1, td.objetoflex img, .msg img.foto, .autor img, img.avatar {
    filter: blur(5px) !important;
}
"""

# Los avisos de logros se ocultan siempre; la mascota UCursitos, salvo en su propia imagen
HIDE_TOASTS_CSS = '#ucd-toasts { display: none !important; }'
HIDE_FLOATING_CSS = '.ucd-ask { display: none !important; }'

THEMES = ['focus', 'focus-dark', 'classic', 'classic-dark']

COURSE_RE = r'^https://www\.u-cursos\.cl/[^/]+/\d{4}/[12]/[^/]+/\d+/'

# Cada imagen del README: en qué página buscarla, qué elementos recortar y qué hacer antes.
#   url:        regex sobre las URLs visitadas (o una URL fija)
#   selectors:  se recorta la unión de las cajas de estos elementos (el primero que exista de cada uno)
#   wait_for:   elemento que inyecta la extensión; si no aparece, se salta la imagen
#   prepare:    enlace (selector) que se abre antes, p. ej. Mis Tareas para que la extensión cuente
#   blur:       selectores extra que se difuminan solo en esa imagen
#   pad / max_height / min_width / show_floating: ajustes del recorte
#   all:        unir todas las coincidencias de cada selector, no solo la primera
README_SHOTS = {
    'ucursitos': {
        'url': BASE_URL, 'wait_for': '.ucd-ask', 'selectors': ['.ucd-ask'],
        'show_floating': True, 'pad': 12,
    },
    'easyCopyGrades': {
        'url': COURSE_RE + r'notas/', 'wait_for': 'thead button',
        'selectors': ['.ucd-gw-summary', 'table:has(thead button)'], 'max_height': 640,
    },
    'easyCopyMembers': {
        'url': COURSE_RE + r'integrantes/', 'wait_for': 'tbody td div button',
        'selectors': ['table:has(tbody td div button)'], 'max_height': 300,
    },
    'easyCopyCourseDetails': {
        'url': COURSE_RE, 'wait_for': '#navigation-wrapper div.curso button',
        'selectors': ['#navigation-wrapper > div.curso'],
    },
    'renameCourses': {
        'url': COURSE_RE, 'wait_for': '#ucursednt-rename-btn',
        'selectors': ['#navigation-wrapper > div.curso'],
    },
    'collapsableMenus': {
        'url': BASE_URL, 'wait_for': '#modulos .collapsable-button',
        'selectors': ['#modulos'], 'max_height': 380, 'min_width': 150,
    },
    'forumInteraction': {
        'url': r'/foro(_institucion)?/', 'wait_for': '.ucd-forum-ai',
        'selectors': ['.msg:has(.ucd-forum-ai)'], 'max_height': 420,
    },
    'muchoTexto': {
        'url': r'/foro(_institucion)?/', 'wait_for': '.show-more-button',
        'selectors': ['.msg:has(.show-more-button)'], 'max_height': 520,
    },
    'resizePreviewPDF': {
        'url': r'/material_docente/detalle\?id=\d+', 'wait_for': '#body > div.streaming.no-movil',
        'selectors': ['#body > div.streaming.no-movil'], 'max_height': 700,
    },
    'pendingTasks': {
        'url': BASE_URL, 'wait_for': '#pending-tasks-notification',
        'prepare': 'li.servicio_tareas_usuario a[href]',
        'selectors': ['#navigation-wrapper li.servicio_tareas_usuario'], 'pad': 10,
    },
    'pendingNotifications': {
        'url': BASE_URL, 'wait_for': '#pending-notifications',
        'selectors': ['#modulos h1:has(#pending-notifications)'], 'pad': 10,
    },
    'weekCounter': {
        'url': r'/horario(_curso)?/', 'wait_for': '.ucursednt-semana-lectiva',
        'selectors': ['ul.paginas', '.ucursednt-semana-lectiva'], 'max_height': 260,
    },
    'otrasRealizaciones': {
        'url': COURSE_RE, 'wait_for': 'ul.modulos img[src*="todos_cursos"]',
        'selectors': ['ul.modulos li:nth-last-child(-n+4)'], 'all': True, 'pad': 8,
    },
    'achievementsGen': {
        'url': 'https://www.u-cursos.cl/logros/', 'wait_for': '#ucd-page',
        'selectors': ['h1.modulo', '#ucd-page'], 'max_height': 760,
    },
    'menuGen': {
        'url': 'https://www.u-cursos.cl/ucursednt/', 'wait_for': '.ucd-feature-list',
        'selectors': ['h1.modulo', '#ucd-page'], 'max_height': 760,
    },
}
# navigationAnimations.gif es una animación: no se regenera aquí.


def to_playwright_cookies(jar, theme=None):
    """Cookies de Zen para Playwright; `theme` reemplaza la cookie de tema solo en este navegador."""
    cookies = []
    for c in jar:
        value = theme if c.name == 'theme' and theme else c.value
        cookies.append({
            'name': c.name, 'value': value, 'domain': c.domain,
            'path': c.path or '/', 'secure': True, 'sameSite': 'Lax',
        })
    if theme and not any(c['name'] == 'theme' for c in cookies):
        cookies.append({'name': 'theme', 'value': theme, 'domain': 'www.u-cursos.cl', 'path': '/',
                        'secure': True, 'sameSite': 'Lax'})
    return cookies


def block_unsafe(route):
    """Corta cualquier petición que cambie algo en U-Cursos, venga del script o de la extensión."""
    url = route.request.url
    if 'u-cursos.cl' in url and not safe(url):
        route.abort()
    else:
        route.continue_()


def is_logged_in(page):
    return page.evaluate("!!document.body && document.body.classList.contains('logeado')")


def settle(page, extra=1.5):
    """Espera a que la página y los content scripts de la extensión terminen."""
    try:
        page.wait_for_load_state('networkidle', timeout=15000)
    except PlaywrightError:
        pass
    page.wait_for_timeout(int(extra * 1000))


def open_page(page, url, args):
    try:
        resp = page.goto(url, wait_until='domcontentloaded', timeout=30000)
    except PlaywrightError as error:
        return None, str(error)
    settle(page)
    page.add_style_tag(content=HIDE_TOASTS_CSS)
    if not args.no_blur:
        page.add_style_tag(content=BLUR_CSS)
    time.sleep(args.delay)
    return resp, None


def discover(soup, url, reason, push, state, args):
    """Mismo criterio que crawl_ucursos.py: menú lateral, módulos de interés y pocas subpáginas."""
    if reason == 'inicio':
        for a in soup.select('#cursos a[href], #comunidades a[href], #instituciones a[href], #favs a[href]'):
            if state['courses'] < args.max_courses * 3:
                push(urljoin(url, a['href']), 'menu lateral')
                state['courses'] += 1
        for a in soup.select('ul.modulos li.servicio a[href]'):
            push(urljoin(url, a['href']), 'modulo de usuario')

    for a in soup.select('ul.modulos li.servicio a[href]'):
        li = a.find_parent('li')
        name = next((c[len('servicio_'):] for c in li.get('class', []) if c.startswith('servicio_')), '') if li else ''
        if name in MODULES_OF_INTEREST:
            push(urljoin(url, a['href']), f'modulo {name}')

    module = module_of(soup)
    if module in MODULES_OF_INTEREST and reason.startswith('modulo'):
        module_root = url.split('?')[0]
        body = soup.select_one('#body') or soup
        found = 0
        for a in body.select('a[href]'):
            full = urljoin(url, a['href'])
            if SUBPAGE_RE.search(a['href']) and full.startswith(module_root):
                push(full, f'subpagina de {module}')
                found += 1
                if found >= 4:
                    break


def crawl(page, out_dir, args):
    queue = deque([(BASE_URL, 'inicio')])
    visited, report = [], []
    state = {'courses': 0}

    def push(url, reason):
        url = url.split('#')[0]
        if url not in visited and safe(url):
            queue.append((url, reason))

    while queue and len(visited) < args.max_pages:
        url, reason = queue.popleft()
        if url in visited:
            continue
        visited.append(url)

        resp, error = open_page(page, url, args)
        if error:
            report.append({'url': url, 'reason': reason, 'error': error})
            continue

        soup = BeautifulSoup(page.content(), 'html.parser')
        if soup.body and 'logeado' not in soup.body.get('class', []):
            print(f'  ! {url}: no parece haber sesión iniciada')
            report.append({'url': url, 'reason': reason, 'error': 'sin sesión'})
            continue

        module = module_of(soup)
        filename = f'{len(visited):03d}_{module or "pagina"}.png'
        page.screenshot(path=os.path.join(out_dir, filename), full_page=True)
        print(f'[{len(visited):03d}] {module or "-":<22} {url}')
        report.append({'url': url, 'reason': reason, 'file': filename, 'module': module,
                       'status': resp.status if resp else '-'})

        discover(soup, url, reason, push, state, args)

    return visited, report


def element_clip(page, selectors, pad, max_height, all_matches=False):
    """Caja (en coordenadas de página) que une al primer elemento visible de cada selector."""
    return page.evaluate("""([selectors, pad, maxHeight, allMatches]) => {
        const boxes = selectors.flatMap(sel => {
            const found = [];
            for (const el of document.querySelectorAll(sel)) {
                const r = el.getBoundingClientRect();
                if (!r.width || !r.height) continue;
                found.push({x: r.left + scrollX, y: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY});
                if (!allMatches) break;
            }
            return found;
        });
        if (!boxes.length) return null;
        const x = Math.max(0, Math.min(...boxes.map(b => b.x)) - pad);
        const y = Math.max(0, Math.min(...boxes.map(b => b.y)) - pad);
        const right = Math.min(document.documentElement.scrollWidth, Math.max(...boxes.map(b => b.r)) + pad);
        let height = Math.max(...boxes.map(b => b.b)) + pad - y;
        if (maxHeight) height = Math.min(height, maxHeight);
        return {x, y, width: right - x, height};
    }""", [selectors, pad, max_height, all_matches])


def load_sources():
    try:
        with open(SOURCES_FILE, encoding='utf-8') as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def save_sources(sources):
    with open(SOURCES_FILE, 'w', encoding='utf-8') as fh:
        json.dump(sources, fh, ensure_ascii=False, indent=2)


def fixed_url(recipe):
    """URL de la receta si es una dirección concreta y no una regex."""
    pattern = recipe['url']
    if pattern.startswith('http') and not re.search(r'[\\^$()\[\]?*+]', pattern):
        return pattern
    return None


def candidate_urls(name, recipe, sources, visited, args):
    """Orden: --url, la URL guardada, la URL fija de la receta y (sin --only readme) las del crawl."""
    urls = []
    if name in args.url:
        urls.append(args.url[name])
    if name in sources:
        urls.append(sources[name]['url'])
    if fixed_url(recipe):
        urls.append(fixed_url(recipe))
    urls += [u for u in visited if re.search(recipe['url'], u)][:args.max_candidates]
    return list(dict.fromkeys(urls))


def shoot(page, name, recipe, url, out_dir, args):
    """Abre `url`, aplica la receta y guarda el recorte. Devuelve la ruta o None."""
    if recipe.get('prepare'):
        _, error = open_page(page, url, args)
        link = None if error else page.query_selector(recipe['prepare'])
        if link:
            open_page(page, urljoin(url, link.get_attribute('href')), args)

    _, error = open_page(page, url, args)
    if error or not is_logged_in(page):
        return None
    if not recipe.get('show_floating'):
        page.add_style_tag(content=HIDE_FLOATING_CSS)
    if recipe.get('blur') and not args.no_blur:
        page.add_style_tag(content=', '.join(recipe['blur']) + ' { filter: blur(5px) !important; }')
    try:
        page.wait_for_selector(recipe['wait_for'], state='attached', timeout=6000)
    except PlaywrightError:
        return None
    page.wait_for_timeout(400)

    clip = element_clip(page, recipe['selectors'], recipe.get('pad', 6), recipe.get('max_height'),
                        recipe.get('all', False))
    if not clip or clip['width'] < recipe.get('min_width', 10) or clip['height'] < 10:
        return None

    path = os.path.join(out_dir if args.dry_run else IMAGES_DIR, f'{name}.png')
    page.screenshot(path=path, clip=clip, full_page=True)
    return path


def capture_readme(page, visited, out_dir, args):
    sources = load_sources()
    results = {}
    for name in args.images or list(README_SHOTS):
        recipe = README_SHOTS[name]
        candidates = candidate_urls(name, recipe, sources, visited, args)
        if not candidates:
            hint = 'ejecuta sin --only readme o usa --url' if args.only == 'readme' else 'ninguna página visitada coincide'
            results[name] = f'sin página ({hint})'
            print(f'  - {name}: {results[name]}')
            continue

        for url in candidates:
            path = shoot(page, name, recipe, url, out_dir, args)
            if path:
                results[name] = f'{os.path.relpath(path, BASE_DIR)} desde {url}'
                print(f'  + {name}: {url}')
                if not args.dry_run:
                    sources[name] = {'url': url, 'captured': time.strftime('%Y-%m-%d')}
                    save_sources(sources)
                break
        else:
            results[name] = f"no apareció {recipe['wait_for']} en {len(candidates)} página(s)"
            print(f'  - {name}: {results[name]}')
    return results


def write_report(out_dir, report, readme_results):
    lines = ['# Capturas de U-Cursos', '', f'Generado: {time.strftime("%Y-%m-%d %H:%M:%S")}', '']
    if readme_results:
        lines += ['## Imágenes del README', '']
        lines += [f'- **{name}**: {result}' for name, result in readme_results.items()]
        lines.append('')
    if report:
        lines += ['## Páginas', '']
        for e in report:
            if 'error' in e:
                lines.append(f"- {e['url']} — error: {e['error']}")
            else:
                lines.append(f"- `{e['file']}` · {e['module'] or '-'} · {e['status']} · {e['reason']} · {e['url']}")
    with open(os.path.join(out_dir, 'report.md'), 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--profile', help='Carpeta del perfil de Zen (contiene cookies.sqlite)')
    parser.add_argument('--cookies', help='Archivo JSON con cookies exportadas (en vez del perfil de Zen)')
    parser.add_argument('--only', choices=['crawl', 'readme'], help='Hacer solo una de las dos partes')
    parser.add_argument('--images', nargs='+', choices=list(README_SHOTS), help='Regenerar solo estas imágenes')
    parser.add_argument('--max-pages', type=int, default=80)
    parser.add_argument('--max-courses', type=int, default=6)
    parser.add_argument('--max-candidates', type=int, default=8, help='Páginas a probar por imagen del README')
    parser.add_argument('--delay', type=float, default=1.0, help='Segundos entre páginas')
    parser.add_argument('--headless', action='store_true', help='Sin ventana (Chromium nuevo headless)')
    parser.add_argument('--no-blur', action='store_true', help='No difuminar nombres ni fotos')
    parser.add_argument('--theme', choices=THEMES + ['cuenta'], default='focus',
                        help='Tema de las capturas, solo en este navegador ("cuenta" usa el tuyo)')
    parser.add_argument('--dry-run', action='store_true', help='Guardar las imágenes del README en logs, no en src/images')
    parser.add_argument('--url', action='append', default=[], metavar='NOMBRE=URL',
                        help='Página de la que sacar una imagen del README (se puede repetir)')
    args = parser.parse_args()

    overrides = {}
    for item in args.url:
        name, _, url = item.partition('=')
        if name not in README_SHOTS or not url.startswith('https://') or not safe(url):
            sys.exit(f'--url inválido: {item} (usa NOMBRE=https://www.u-cursos.cl/..., NOMBRE en {", ".join(README_SHOTS)})')
        overrides[name] = url
    args.url = overrides

    if not os.path.exists(os.path.join(EXTENSION_DIR, 'manifest.json')):
        sys.exit('No existe dist/chrome: ejecuta primero python scripts/build.py')

    if args.cookies:
        jar, count = load_cookies_json(args.cookies)
        print(f'Cookies: {args.cookies} ({count} de u-cursos.cl)')
    else:
        profile = find_zen_profile(args.profile)
        jar, count = load_cookies(profile)
        print(f'Perfil: {profile} ({count} cookies de u-cursos.cl)')
    if not count:
        sys.exit('No hay cookies de u-cursos.cl: inicia sesión en Zen primero.')

    out_dir = os.path.join(LOG_DIR, time.strftime('ucursos_screens_%Y%m%d_%H%M%S'))
    os.makedirs(out_dir, exist_ok=True)

    with sync_playwright() as pw:
        # Las extensiones necesitan un contexto persistente; 'chromium' permite cargarlas en headless
        context = pw.chromium.launch_persistent_context(
            PROFILE_DIR,
            channel='chromium',
            headless=args.headless,
            viewport=VIEWPORT,
            device_scale_factor=1,
            locale='es-CL',
            args=[f'--disable-extensions-except={EXTENSION_DIR}', f'--load-extension={EXTENSION_DIR}'],
        )
        context.clear_cookies()
        context.add_cookies(to_playwright_cookies(jar, None if args.theme == 'cuenta' else args.theme))
        context.route('**/*', block_unsafe)
        page = context.pages[0] if context.pages else context.new_page()
        page.on('dialog', lambda dialog: dialog.dismiss())  # avisos de primera vez de la extensión

        # /ucursednt/ crea los ajustes por defecto de la extensión si aún no existen
        open_page(page, 'https://www.u-cursos.cl/ucursednt/', args)
        if not is_logged_in(page):
            context.close()
            sys.exit('U-Cursos no reconoce la sesión: vuelve a iniciar sesión en Zen (o usa --cookies con un export nuevo).')

        # --only readme no recorre: usa las URLs guardadas, las fijas y --url
        visited, report = [], []
        if args.only != 'readme':
            visited, report = crawl(page, out_dir, args)

        readme_results = {}
        if args.only != 'crawl':
            print('\nImágenes del README:')
            readme_results = capture_readme(page, visited, out_dir, args)

        context.close()

    write_report(out_dir, report, readme_results)
    print(f'\nListo. Reporte en {os.path.join(out_dir, "report.md")}')
    if readme_results and not args.dry_run:
        print('Revisa los cambios con: git diff --stat src/images')


if __name__ == '__main__':
    main()
