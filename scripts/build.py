import os
import shutil
import json
import time
import glob
import re
import stat

# Define absolute paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
SRC_DIR = os.path.join(BASE_DIR, 'src')
DIST_DIR = os.path.join(BASE_DIR, 'dist')
ARCHIVE_DIR = os.path.join(BASE_DIR, 'archive')
LOG_DIR = os.path.join(SCRIPT_DIR, 'logs')

BUILD_LOG = None


class BuildLogger:
    def __init__(self, log_path):
        self.log_path = log_path
        self.handle = open(log_path, 'w', encoding='utf-8')

    def close(self):
        if self.handle and not self.handle.closed:
            self.handle.close()

    def write(self, message=''):
        self.handle.write(f"{message}\n")
        self.handle.flush()

    def detail(self, message=''):
        self.write(message)


def init_build_log():
    os.makedirs(LOG_DIR, exist_ok=True)
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    log_path = os.path.join(LOG_DIR, f'{timestamp}_build.log')
    return BuildLogger(log_path)


def relpath_from_base(path):
    return os.path.relpath(path, BASE_DIR)


def format_source_context(filepath, line_number, radius=2):
    try:
        with open(filepath, 'r', encoding='utf-8') as source_file:
            lines = source_file.readlines()
    except OSError:
        return [f'    [Unable to read source context from {relpath_from_base(filepath)}]']

    if line_number is None or line_number < 1:
        return []

    start_line = max(1, line_number - radius)
    end_line = min(len(lines), line_number + radius)
    context_lines = []

    for current_line in range(start_line, end_line + 1):
        prefix = '>' if current_line == line_number else ' '
        text = lines[current_line - 1].rstrip('\n')
        context_lines.append(f'{prefix} {current_line:4d} | {text}')

    return context_lines


def log_issue(level, filepath, line_number, message, extra_details=None):
    global BUILD_LOG

    relative_path = relpath_from_base(filepath)
    summary = f'  {level} {message} in {relative_path}'
    if line_number is not None:
        summary += f' (Line {line_number})'

    print(summary)
    if BUILD_LOG:
        BUILD_LOG.write(summary)
        if extra_details:
            for detail in extra_details:
                BUILD_LOG.detail(f'    {detail}')
        if line_number is not None:
            for context_line in format_source_context(filepath, line_number):
                BUILD_LOG.detail(f'    {context_line}')
        BUILD_LOG.detail('')

def get_version():
    """Extracts the version number from the Chrome manifest."""
    manifest_path = os.path.join(SRC_DIR, 'manifest_chrome.json')
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('version', '0.0.0')
    except FileNotFoundError:
        print("❌ Error: manifest_chrome.json not found in src/")
        exit(1)

def run_linter():
    """Performs basic static analysis on the source files before building."""
    print("🔍 Running pre-build linter...")
    if BUILD_LOG:
        BUILD_LOG.write("🔍 Running pre-build linter...")
        BUILD_LOG.detail('')
    errors = 0
    warnings = 0

    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            filepath = os.path.join(root, file)

            # 1. Flag skipped files
            if file.endswith('.old'):
                skip_message = f"  [Skip] Flagged filename found and will be excluded: {file}"
                print(skip_message)
                if BUILD_LOG:
                    BUILD_LOG.write(skip_message)
                continue

            # 2. Strict JSON validation
            if file.endswith('.json'):
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        json.load(f)
                except json.JSONDecodeError as e:
                    log_issue(
                        '❌ [Error]',
                        filepath,
                        getattr(e, 'lineno', None),
                        f'Invalid JSON syntax: {e.msg}',
                        [f'Column: {getattr(e, "colno", "?")}', f'Path: {relpath_from_base(filepath)}']
                    )
                    errors += 1

            # 3. JavaScript static checks
            if file.endswith('.js') and file != 'browser-polyfill.min.js':
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for i, line in enumerate(lines):
                        # Catch Mozilla AMO innerHTML warnings
                        if '.innerHTML' in line and '=' in line:
                            log_issue(
                                '⚠️ [Warning]',
                                filepath,
                                i + 1,
                                'Unsafe innerHTML assignment detected',
                                ['Pattern: .innerHTML = ...']
                            )
                            warnings += 1
                        
                        # Catch syntax errors like empty array items or double commas (e.g., [a, , b])
                        if re.search(r',\s*,', line):
                            log_issue(
                                '❌ [Error]',
                                filepath,
                                i + 1,
                                'Consecutive commas detected',
                                ['Pattern: ", ," or equivalent empty item']
                            )
                            errors += 1

    if errors > 0:
        failure_message = f"\n🚨 Linter failed with {errors} error(s). Build aborted."
        print(failure_message)
        if BUILD_LOG:
            BUILD_LOG.write(failure_message)
        exit(1)
    else:
        success_message = f"✅ Linter passed ({warnings} warning(s) found).\n"
        print(success_message)
        if BUILD_LOG:
            BUILD_LOG.write(success_message.rstrip('\n'))
            BUILD_LOG.detail('')

def archive_old_builds():
    """Moves existing zips to the archive folder and limits history to 3 versions per browser."""
    if not os.path.exists(DIST_DIR):
        return

    if not os.path.exists(ARCHIVE_DIR):
        os.makedirs(ARCHIVE_DIR)

    # Timestamp format: YYYYMMDD_HHMMSS
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    
    # 1. Move current dist zips to archive
    for file in os.listdir(DIST_DIR):
        if file.endswith('.zip'):
            base_name = file.replace('.zip', '')
            new_name = f"{base_name}_{timestamp}.zip"
            shutil.move(os.path.join(DIST_DIR, file), os.path.join(ARCHIVE_DIR, new_name))
            if BUILD_LOG:
                BUILD_LOG.write(f"🗄️  Archived {file} -> {new_name}")

    # 2. Prune old archives (Keep max 3 per browser)
    print("🗄️  Managing archives...")
    if BUILD_LOG:
        BUILD_LOG.write("🗄️  Managing archives...")
    for browser in ['chrome', 'firefox']:
        archives = glob.glob(os.path.join(ARCHIVE_DIR, f"{browser}_*.zip"))
        
        # Sort chronologically (newest first)
        archives.sort(reverse=True)
        
        if len(archives) > 3:
            for old_archive in archives[3:]:
                os.remove(old_archive)
                prune_message = f"  🗑️  Pruned old archive: {os.path.basename(old_archive)}"
                print(prune_message)
                if BUILD_LOG:
                    BUILD_LOG.write(prune_message)

def remove_tree(path):
    """Removes a directory tree, clearing Windows read-only attributes if needed."""
    def handle_remove_error(function, target_path, exc_info):
        os.chmod(target_path, stat.S_IWRITE)
        function(target_path)

    shutil.rmtree(path, onerror=handle_remove_error)

def build_browser_dist(browser_name, manifest_file):
    """Copies source files and applies the correct manifest for the browser."""
    print(f"🔨 Building {browser_name} extension...")
    if BUILD_LOG:
        BUILD_LOG.write(f"🔨 Building {browser_name} extension...")
    target_dir = os.path.join(DIST_DIR, browser_name)
    
    # 1. Copy all src files to target, explicitly ignoring *.old and caches
    ignore_rules = shutil.ignore_patterns('*.old', '__pycache__', '*.pyc')
    shutil.copytree(SRC_DIR, target_dir, ignore=ignore_rules)
    
    # 2. Delete the specific manifest templates from the final build
    os.remove(os.path.join(target_dir, 'manifest_chrome.json'))
    os.remove(os.path.join(target_dir, 'manifest_firefox.json'))
    
    # 3. Inject the correct manifest as 'manifest.json'
    correct_manifest = os.path.join(SRC_DIR, manifest_file)
    shutil.copy2(correct_manifest, os.path.join(target_dir, 'manifest.json'))
    if BUILD_LOG:
        BUILD_LOG.write(f"  Manifest selected: {relpath_from_base(correct_manifest)}")
    
    return target_dir

def create_zip(source_dir, browser_name, version):
    """Zips the output directory for distribution."""
    zip_name = f"{browser_name}_v{version}"
    zip_path = os.path.join(DIST_DIR, zip_name)
    
    shutil.make_archive(zip_path, 'zip', source_dir)
    print(f"  📦 Packaged: {zip_name}.zip")
    if BUILD_LOG:
        BUILD_LOG.write(f"  📦 Packaged: {zip_name}.zip")

def main():
    global BUILD_LOG

    BUILD_LOG = init_build_log()
    version = get_version()
    start_message = f"🚀 Starting build process for U-Cursedn't v{version}\n"
    print(start_message)
    if BUILD_LOG:
        BUILD_LOG.write(start_message.rstrip('\n'))
        BUILD_LOG.detail('')
    
    try:
        # Run sanity checks
        run_linter()
        
        # Archive the previous build's zips
        archive_old_builds()
        
        # Clean the dist directory
        if os.path.exists(DIST_DIR):
            cleaning_message = "🧹 Cleaning old dist/ directory..."
            print(cleaning_message)
            if BUILD_LOG:
                BUILD_LOG.write(cleaning_message)
            remove_tree(DIST_DIR)
        
        os.makedirs(DIST_DIR)
        if BUILD_LOG:
            BUILD_LOG.write(f"Created dist directory: {DIST_DIR}")
        print()
        
        # Build unpacked directories
        chrome_dir = build_browser_dist('chrome', 'manifest_chrome.json')
        firefox_dir = build_browser_dist('firefox', 'manifest_firefox.json')
        
        print()
        if BUILD_LOG:
            BUILD_LOG.detail('')
        
        # Zip them for production
        create_zip(chrome_dir, 'chrome', version)
        create_zip(firefox_dir, 'firefox', version)
        
        success_message = f"\n✅ Build complete! You can find your unzipped testing folders and production zips in: {DIST_DIR}"
        archive_message = f"   (Previous builds are safely stored in: {ARCHIVE_DIR})"
        print(success_message)
        print(archive_message)
        if BUILD_LOG:
            BUILD_LOG.write(success_message)
            BUILD_LOG.write(archive_message)
    except Exception as exc:
        if BUILD_LOG:
            BUILD_LOG.write('')
            BUILD_LOG.write(f'💥 Build failed: {exc.__class__.__name__}: {exc}')
        raise
    finally:
        if BUILD_LOG:
            BUILD_LOG.close()

if __name__ == '__main__':
    main()