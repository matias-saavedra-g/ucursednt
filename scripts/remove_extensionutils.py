import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
JS_DIR = os.path.join(BASE_DIR, 'src', 'js')

def scrub_extensionutils_assignments(content):
    """
    Surgically removes statements containing 'window.extensionUtils'
    by counting braces to safely delete entire fallback object literals.
    """
    while 'window.extensionUtils' in content:
        idx = content.find('window.extensionUtils')
        
        # 1. Find the start of the statement (const, let, var, or console.log)
        start_idx = -1
        for kw in ['const ', 'let ', 'var ', 'console.log']:
            temp = content.rfind(kw, 0, idx)
            if temp != -1:
                fragment = content[temp:idx]
                # Ensure we didn't cross boundaries into previous statements
                if ';' not in fragment and '{' not in fragment and '}' not in fragment:
                    start_idx = temp
                    
        if start_idx == -1:
            # Fallback to the start of the line
            start_idx = content.rfind('\n', 0, idx) + 1
            
        # 2. Find the end of the statement by parsing forward and balancing braces
        brace_count = 0
        in_str = False
        str_char = ''
        i = idx
        
        while i < len(content):
            c = content[i]
            if in_str:
                if c == str_char and content[i-1] != '\\':
                    in_str = False
            else:
                if c in ['"', "'", '`']:
                    in_str = True
                    str_char = c
                elif c == '{':
                    brace_count += 1
                elif c == '}':
                    brace_count -= 1
                elif c == ';' and brace_count <= 0:
                    i += 1 # Include the semicolon
                    break
            i += 1
            
        end_idx = i
        
        # 3. Delete the block
        content = content[:start_idx] + content[end_idx:]
        
    return content

def replace_function_calls(content):
    """Replaces all standalone function calls with the new utility namespaces"""
    replacements = {
        r'\bsafeChromeStorageGet\b': 'UcursedntUtils.Storage.get',
        r'\bsafeChromeStorageSet\b': 'UcursedntUtils.Storage.set',
        r'\bisExtensionContextValid\b': 'UcursedntUtils.Browser.isExtensionContextValid',
        r'\bcontextCheck\b': 'UcursedntUtils.Browser.isExtensionContextValid',
        r'\bsafeSendRuntimeMessage\b': 'UcursedntUtils.Browser.safeSendRuntimeMessage'
    }
    
    for old_func, new_func in replacements.items():
        content = re.sub(old_func, new_func, content)
        
    # Also clean up any lingering comments about extensionUtils
    content = re.sub(r'//.*extensionUtils.*?\n', '', content, flags=re.IGNORECASE)
    return content

def process_files():
    print("🚀 Removing old extensionUtils and refactoring function calls...")
    files_modified = 0
    
    for root, _, files in os.walk(JS_DIR):
        for file in files:
            if not file.endswith('.js') or file in ['browser-polyfill.min.js', 'utilities.js']:
                continue
                
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            
            # 1. Strip out the old destructuring/fallback assignments
            content = scrub_extensionutils_assignments(content)
            
            # 2. Swap the function names
            content = replace_function_calls(content)
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                files_modified += 1
                print(f"  ✅ Cleaned up: {file}")
                
    print(f"\n🎉 Refactoring complete. Modified {files_modified} files.")

if __name__ == '__main__':
    process_files()