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
    errors = 0
    warnings = 0

    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            filepath = os.path.join(root, file)

            # 1. Flag skipped files
            if file.endswith('.old'):
                print(f"  [Skip] Flagged filename found and will be excluded: {file}")
                continue

            # 2. Strict JSON validation
            if file.endswith('.json'):
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        json.load(f)
                except json.JSONDecodeError as e:
                    print(f"  ❌ [Error] Invalid JSON syntax in {file}: {e}")
                    errors += 1

            # 3. JavaScript static checks
            if file.endswith('.js') and file != 'browser-polyfill.min.js':
                with open(filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for i, line in enumerate(lines):
                        # Catch Mozilla AMO innerHTML warnings
                        if '.innerHTML' in line and '=' in line:
                            print(f"  ⚠️ [Warning] Unsafe innerHTML assignment in {file} (Line {i+1})")
                            warnings += 1
                        
                        # Catch syntax errors like empty array items or double commas (e.g., [a, , b])
                        if re.search(r',\s*,', line):
                            print(f"  ❌ [Error] Consecutive commas detected in {file} (Line {i+1})")
                            errors += 1

    if errors > 0:
        print(f"\n🚨 Linter failed with {errors} error(s). Build aborted.")
        exit(1)
    else:
        print(f"✅ Linter passed ({warnings} warning(s) found).\n")

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

    # 2. Prune old archives (Keep max 3 per browser)
    print("🗄️  Managing archives...")
    for browser in ['chrome', 'firefox']:
        archives = glob.glob(os.path.join(ARCHIVE_DIR, f"{browser}_*.zip"))
        
        # Sort chronologically (newest first)
        archives.sort(reverse=True)
        
        if len(archives) > 3:
            for old_archive in archives[3:]:
                os.remove(old_archive)
                print(f"  🗑️  Pruned old archive: {os.path.basename(old_archive)}")

def remove_tree(path):
    """Removes a directory tree, clearing Windows read-only attributes if needed."""
    def handle_remove_error(function, target_path, exc_info):
        os.chmod(target_path, stat.S_IWRITE)
        function(target_path)

    shutil.rmtree(path, onerror=handle_remove_error)

def build_browser_dist(browser_name, manifest_file):
    """Copies source files and applies the correct manifest for the browser."""
    print(f"🔨 Building {browser_name} extension...")
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
    
    return target_dir

def create_zip(source_dir, browser_name, version):
    """Zips the output directory for distribution."""
    zip_name = f"{browser_name}_v{version}"
    zip_path = os.path.join(DIST_DIR, zip_name)
    
    shutil.make_archive(zip_path, 'zip', source_dir)
    print(f"  📦 Packaged: {zip_name}.zip")

def main():
    version = get_version()
    print(f"🚀 Starting build process for U-Cursedn't v{version}\n")
    
    # Run sanity checks
    run_linter()
    
    # Archive the previous build's zips
    archive_old_builds()
    
    # Clean the dist directory
    if os.path.exists(DIST_DIR):
        print("🧹 Cleaning old dist/ directory...")
        remove_tree(DIST_DIR)
    
    os.makedirs(DIST_DIR)
    print()
    
    # Build unpacked directories
    chrome_dir = build_browser_dist('chrome', 'manifest_chrome.json')
    firefox_dir = build_browser_dist('firefox', 'manifest_firefox.json')
    
    print()
    
    # Zip them for production
    create_zip(chrome_dir, 'chrome', version)
    create_zip(firefox_dir, 'firefox', version)
    
    print(f"\n✅ Build complete! You can find your unzipped testing folders and production zips in: {DIST_DIR}")
    print(f"   (Previous builds are safely stored in: {ARCHIVE_DIR})")

if __name__ == '__main__':
    main()