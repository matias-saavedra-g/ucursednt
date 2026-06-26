import os
import re
import json
import urllib.request

# Define absolute paths based on script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
SRC_DIR = os.path.join(BASE_DIR, 'src')
JS_DIR = os.path.join(SRC_DIR, 'js')

POLYFILL_URL = "https://unpkg.com/webextension-polyfill/dist/browser-polyfill.min.js"
POLYFILL_PATH = os.path.join(JS_DIR, "browser-polyfill.min.js")

def download_polyfill():
    print(f"Downloading browser-polyfill.min.js to {JS_DIR}...")
    urllib.request.urlretrieve(POLYFILL_URL, POLYFILL_PATH)
    print("Download complete.")

def update_html_files():
    html_files = [f for f in os.listdir(SRC_DIR) if f.endswith('.html')]
    script_tag = '<script src="js/browser-polyfill.min.js"></script>\n'
    
    for file in html_files:
        filepath = os.path.join(SRC_DIR, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Only inject if not already present
        if 'browser-polyfill.min.js' not in content:
            # Safely insert right before the first script tag to ensure it loads first
            if '<script' in content:
                content = content.replace('<script', script_tag + '<script', 1)
            else:
                content = script_tag + content
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated HTML: {file}")

def update_manifests():
    manifests = ['manifest_chrome.json', 'manifest_firefox.json']
    for m in manifests:
        filepath = os.path.join(SRC_DIR, m)
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified = False
        
        # Update background scripts list (Firefox style)
        if 'background' in data and 'scripts' in data['background']:
            scripts = data['background']['scripts']
            if 'js/browser-polyfill.min.js' not in scripts:
                data['background']['scripts'].insert(0, 'js/browser-polyfill.min.js')
                modified = True
                
        # Update background service worker (Chrome style)
        # Note: Polyfill should ideally be imported via importScripts inside the worker, 
        # but injecting it into the HTML/scripts arrays covers the UI pages.
                
        # Update content scripts
        if 'content_scripts' in data:
            for cs in data['content_scripts']:
                if 'js' in cs:
                    if 'js/browser-polyfill.min.js' not in cs['js']:
                        cs['js'].insert(0, 'js/browser-polyfill.min.js')
                        modified = True
                        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"Updated Manifest: {m}")

def refactor_js_files():
    sidepanel_wrapper = """
// Auto-injected cross-browser side panel opener
async function openExtensionSidePanel(tabId) {
    if (typeof browser !== 'undefined' && browser.sidebarAction) {
        await browser.sidebarAction.open();
    } else if (typeof chrome !== 'undefined' && chrome.sidePanel) {
        await chrome.sidePanel.open({ tabId: tabId });
    }
}
"""
    for root, _, files in os.walk(JS_DIR):
        for file in files:
            if not file.endswith('.js') or file == 'browser-polyfill.min.js':
                continue
                
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # 1. Intercept chrome.sidePanel.open({tabId: ...}) and replace with cross-browser wrapper
            if 'chrome.sidePanel.open' in content:
                content = re.sub(
                    r'chrome\.sidePanel\.open\(\{\s*tabId:\s*([^\}]+)\s*\}\);?',
                    r'openExtensionSidePanel(\1);',
                    content
                )
                if 'function openExtensionSidePanel' not in content:
                    content += "\n" + sidepanel_wrapper

            # 2. Protect Chrome-only sidePanel properties from throwing errors in Firefox
            if 'chrome.sidePanel.setPanelBehavior' in content:
                content = content.replace(
                    'chrome.sidePanel.setPanelBehavior',
                    'if (typeof chrome !== "undefined" && chrome.sidePanel) chrome.sidePanel.setPanelBehavior'
                )
            
            # 3. Replace all remaining 'chrome.' prefixes with 'browser.', IGNORING 'chrome.sidePanel'
            content = re.sub(r'\bchrome\.(?!sidePanel)', 'browser.', content)

            # 4. Automate one-liner storage promise refactors (optional cleanup for clean syntax)
            content = re.sub(
                r'browser\.storage\.(sync|local)\.(get|set|remove)\(([^,]+),\s*result\s*=>\s*resolve\((.*?)\)\);?',
                r'browser.storage.\1.\2(\3).then(result => resolve(\4));',
                content
            )

            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Refactored JS: {file}")

if __name__ == '__main__':
    print("Starting cross-browser refactoring process...")
    download_polyfill()
    update_html_files()
    update_manifests()
    refactor_js_files()
    print("\n✅ Refactoring complete! Test your extension in both Chrome and Firefox.")