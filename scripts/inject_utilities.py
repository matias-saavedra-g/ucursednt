import os
import json

# Define paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
SRC_DIR = os.path.join(BASE_DIR, 'src')

def inject_utilities_to_manifests():
    manifests = ['manifest_chrome.json', 'manifest_firefox.json']
    
    for m_name in manifests:
        filepath = os.path.join(SRC_DIR, m_name)
        
        if not os.path.exists(filepath):
            print(f"⚠️ Could not find {m_name}")
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        modified = False
        
        # 1. Inject into background scripts (for background access to utils)
        if 'background' in data and 'scripts' in data['background']:
            scripts = data['background']['scripts']
            if 'js/utilities.js' not in scripts:
                # Insert after polyfill if it exists, otherwise at the start
                if 'js/browser-polyfill.min.js' in scripts:
                    scripts.insert(scripts.index('js/browser-polyfill.min.js') + 1, 'js/utilities.js')
                else:
                    scripts.insert(0, 'js/utilities.js')
                modified = True

        # 2. Inject into every content script block
        if 'content_scripts' in data:
            for block in data['content_scripts']:
                if 'js' in block:
                    scripts = block['js']
                    if 'js/utilities.js' not in scripts:
                        # Insert after polyfill if it exists, otherwise at the start
                        if 'js/browser-polyfill.min.js' in scripts:
                            scripts.insert(scripts.index('js/browser-polyfill.min.js') + 1, 'js/utilities.js')
                        else:
                            scripts.insert(0, 'js/utilities.js')
                        modified = True
                        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"✅ Successfully injected utilities.js into {m_name}")
        else:
            print(f"⚡ utilities.js is already properly injected in {m_name}")

if __name__ == '__main__':
    print("🚀 Injecting utilities.js into manifests...")
    inject_utilities_to_manifests()
    print("Done! Please reload your extension in the browser.")