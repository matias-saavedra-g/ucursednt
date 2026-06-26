import os
import re

# Define paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
JS_DIR = os.path.join(BASE_DIR, 'src', 'js')

# Map old function names to the new UcursedntUtils namespaces
MAPPINGS = {
    'getStorageItem': 'UcursedntUtils.Storage.get',
    'setStorageItem': 'UcursedntUtils.Storage.set',
    'getAllChromeStorageItems': 'UcursedntUtils.Storage.getAll',
    'removeChromeStorageItem': 'UcursedntUtils.Storage.remove',
    'clearChromeStorage': 'UcursedntUtils.Storage.clear',
    'copyToClipboard': 'UcursedntUtils.DOM.copyToClipboard',
    'isExtensionContextValid': 'UcursedntUtils.Browser.isExtensionContextValid',
    'openExtensionSidePanel': 'UcursedntUtils.Browser.openSidePanel',
    'isForumPage': 'UcursedntUtils.Ucursos.isForumPage',
    'getCourseName': 'UcursedntUtils.Ucursos.getCourseName',
    'getTasksUrl': 'UcursedntUtils.Ucursos.getTasksUrl',
    'toJSON': 'UcursedntUtils.Ucursos.toJSON',
    'startOfWeek': 'UcursedntUtils.Date.startOfWeek'
}

def remove_function_definition(content, func_name):
    """
    Finds function declarations and uses bracket-counting to safely 
    remove the entire block, avoiding regex nested-bracket limitations.
    """
    # Patterns to catch standard and variable-assigned functions
    patterns = [
        re.compile(r'(?:async\s+)?function\s+' + func_name + r'\s*\([^)]*\)\s*\{'),
        re.compile(r'(?:const|let|var)\s+' + func_name + r'\s*=\s*(?:async\s*)?(?:function)?\s*\([^)]*\)\s*(?:=>)?\s*\{')
    ]
    
    for pattern in patterns:
        while True:
            match = pattern.search(content)
            if not match:
                break
                
            start_idx = match.start()
            brace_idx = match.end() - 1 # The matched string ends with the opening '{'
            
            brace_count = 0
            end_idx = -1
            
            # Parse forward to find the matching closing bracket
            for i in range(brace_idx, len(content)):
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                    
                if brace_count == 0:
                    end_idx = i + 1
                    break
                    
            if end_idx != -1:
                # Remove the entire function block
                content = content[:start_idx] + content[end_idx:]
            else:
                print(f"  [!] Failed to find matching bracket for {func_name}. Skipping deletion.")
                break
                
    return content

def replace_function_calls(content, func_name, new_call):
    """
    Replaces function calls. Uses a negative lookbehind (?<!\.) to ensure 
    we don't accidentally replace already-namespaced functions (e.g. Obj.funcName)
    """
    pattern = re.compile(r'(?<!\.)\b' + func_name + r'\s*\(')
    return pattern.sub(new_call + '(', content)


def process_files():
    print("🚀 Starting codebase refactoring...")
    
    files_modified = 0
    
    for root, _, files in os.walk(JS_DIR):
        for file in files:
            # Skip non-JS files and the utilities/polyfills themselves
            if not file.endswith('.js') or file in ['browser-polyfill.min.js', 'utilities.js']:
                continue
                
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            
            # Apply modifications for each mapped function
            for old_func, new_namespace in MAPPINGS.items():
                if old_func in content:
                    # 1. Delete the function definition if it exists in this file
                    content = remove_function_definition(content, old_func)
                    # 2. Swap all call sites to the new namespace
                    content = replace_function_calls(content, old_func, new_namespace)
            
            # Write changes if the file was altered
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                files_modified += 1
                print(f"  ✅ Refactored: {file}")
                
    print(f"\n🎉 Done! Safely modified {files_modified} files.")
    print("Remember to inject 'js/utilities.js' into your manifest.json content_scripts array!")

if __name__ == '__main__':
    process_files()