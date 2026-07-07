import os
import re

# Set this to your JS directory
SRC_DIR = "src/js"

# 1. Matches multi-line template literals: element.innerHTML = `...`;
# Uses re.DOTALL to allow dots to match newlines inside the backticks.
pattern_template = re.compile(r"([a-zA-Z0-9_$.\[\]]+)\.innerHTML\s*=\s*(`.*?`);", re.DOTALL)

# 2. Matches standard string assignments: element.innerHTML = '...' or "..."
pattern_quotes = re.compile(r"([a-zA-Z0-9_$.\[\]]+)\.innerHTML\s*=\s*('(?:\\'|[^'])*'|\"(?:\\\"|[^\"])*\");")

# 3. Matches variables/ternaries (assuming no semicolons before the end): element.innerHTML = someVar;
pattern_vars = re.compile(r"([a-zA-Z0-9_$.\[\]]+)\.innerHTML\s*=\s*([^;`'\"]+);")

# 4. Matches += appends: element.innerHTML += `...`;
pattern_append = re.compile(r"([a-zA-Z0-9_$.\[\]]+)\.innerHTML\s*\+=\s*(.+?);", re.DOTALL)


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes = 0

    # Replace template literal assignments
    content, count = pattern_template.subn(r"UcursedntUtils.DOM.safeSetHTML(\1, \2);", content)
    changes += count

    # Replace standard string assignments
    content, count = pattern_quotes.subn(r"UcursedntUtils.DOM.safeSetHTML(\1, \2);", content)
    changes += count

    # Replace variable/ternary assignments
    content, count = pattern_vars.subn(r"UcursedntUtils.DOM.safeSetHTML(\1, \2);", content)
    changes += count

    # Replace += appends
    content, count = pattern_append.subn(r"UcursedntUtils.DOM.safeAppendHTML(\1, \2);", content)
    changes += count

    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed {changes} instances in {os.path.basename(filepath)}")
    
    return changes

def main():
    print(f"🚀 Starting innerHTML refactoring in {SRC_DIR}...\n")
    total_changes = 0
    
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith('.js'):
                total_changes += process_file(os.path.join(root, file))
                
    print(f"\n🎉 Refactoring complete! Replaced {total_changes} total instances.")
    print("⚠️  Please run 'git diff' to ensure the regex didn't mangle any complex logic.")

if __name__ == "__main__":
    main()