import os
import shutil
import json

# Define absolute paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
SRC_DIR = os.path.join(BASE_DIR, 'src')
DIST_DIR = os.path.join(BASE_DIR, 'dist')

def get_version():
    """Extracts the version number from the Chrome manifest."""
    manifest_path = os.path.join(SRC_DIR, 'manifest_chrome.json')
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('version', '0.0.0')
    except FileNotFoundError:
        print("Error: manifest_chrome.json not found in src/")
        exit(1)

def build_browser_dist(browser_name, manifest_file):
    """Copies source files and applies the correct manifest for the browser."""
    print(f"🔨 Building {browser_name} extension...")
    target_dir = os.path.join(DIST_DIR, browser_name)
    
    # 1. Copy all src files to the target directory
    shutil.copytree(SRC_DIR, target_dir)
    
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
    
    # shutil.make_archive automatically adds the .zip extension
    shutil.make_archive(zip_path, 'zip', source_dir)
    print(f"📦 Packaged: {zip_name}.zip")

def main():
    version = get_version()
    print(f"🚀 Starting build process for U-Cursedn't v{version}\n")
    
    # Clean the dist directory if it already exists
    if os.path.exists(DIST_DIR):
        print("🧹 Cleaning old dist/ directory...")
        shutil.rmtree(DIST_DIR)
    
    # Ensure dist exists
    os.makedirs(DIST_DIR)
    
    # Build unpacked directories
    chrome_dir = build_browser_dist('chrome', 'manifest_chrome.json')
    firefox_dir = build_browser_dist('firefox', 'manifest_firefox.json')
    
    print()
    
    # Zip them for production
    create_zip(chrome_dir, 'chrome', version)
    create_zip(firefox_dir, 'firefox', version)
    
    print(f"\n✅ Build complete! You can find your unzipped testing folders and production zips in: {DIST_DIR}")

if __name__ == '__main__':
    main()