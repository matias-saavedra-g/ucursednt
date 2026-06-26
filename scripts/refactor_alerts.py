import os
import re

# Define paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
JS_DIR = os.path.join(BASE_DIR, 'src', 'js')

wrapper_func = """
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
"""

def refactor_alerts():
    for root, _, files in os.walk(JS_DIR):
        for file in files:
            if not file.endswith('.js') or file == 'browser-polyfill.min.js':
                continue
            
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if an alert exists and hasn't been refactored yet
            if re.search(r'\b(?:window\.)?alert\s*\(', content) and 'window.showExtensionAlert' not in content:
                
                # 1. Replace all native alerts with the custom wrapper
                new_content = re.sub(r'\b(?:window\.)?alert\s*\(', 'window.showExtensionAlert(', content)
                
                # 2. Inject the wrapper function safely at the top of the file
                new_content = wrapper_func.strip() + "\n\n" + new_content
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                    
                print(f"✅ Refactored alerts in: {file}")

if __name__ == '__main__':
    print("🚀 Starting alert refactoring...")
    refactor_alerts()
    print("Done!")