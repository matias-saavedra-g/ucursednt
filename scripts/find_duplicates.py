import os
import re
from collections import defaultdict

# Define paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
JS_DIR = os.path.join(BASE_DIR, 'src', 'js')

def find_repeated_functions():
    # Regex to catch "function myFunc(" or "async function myFunc("
    func_pattern = re.compile(r'(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(')
    
    function_map = defaultdict(list)
    
    for root, _, files in os.walk(JS_DIR):
        for file in files:
            if not file.endswith('.js') or file in ['browser-polyfill.min.js', 'utilities.js']:
                continue
                
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Find all function names in the file
            matches = func_pattern.findall(content)
            for func_name in set(matches): # Use set to avoid counting the same function twice in one file
                function_map[func_name].append(file)

    print("🔍 Scanning for duplicated functions across multiple files...\n")
    
    found_duplicates = False
    for func_name, files in sorted(function_map.items()):
        if len(files) > 1:
            found_duplicates = True
            print(f"⚠️ Function '{func_name}' found in {len(files)} files:")
            for f in files:
                print(f"   - {f}")
            print("-" * 40)
            
    if not found_duplicates:
        print("✅ No duplicated functions found!")

if __name__ == '__main__':
    find_repeated_functions()