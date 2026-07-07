import os
import re

# Set this to your JS directory
SRC_DIR = "src/js"

# 1. Matches setTimeout inline arrow functions
# Example: setTimeout(() => boton.innerHTML = '...', 2000);
pattern_timeout = re.compile(r"setTimeout\(\s*\(\)\s*=>\s*([a-zA-Z0-9_$.\[\]]+)\.innerHTML\s*=\s*(.+?)\s*,\s*([0-9]+)\s*\);", re.DOTALL)

# 2. Matches remaining complex assignments (ternaries, string concatenation)
# Matches everything up to the first semicolon. Since we only have a few left 
# and none of them contain semicolons inside their strings, this is perfectly safe.
pattern_assignment = re.compile(r"([a-zA-Z0-9_$.\[\]]+)\.innerHTML\s*=\s*([^;]+);", re.DOTALL)

# 3. Matches READ operations (innerHTML NOT followed by an equals sign)
# Example: const x = btn.innerHTML; -> const x = UcursedntUtils.DOM.getHTML(btn);
pattern_read = re.compile(r"([a-zA-Z0-9_$.\[\]]+)\.innerHTML(?!\s*\+?=)")

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changes = 0

    # 1. Replace setTimeout inline arrow functions
    content, count = pattern_timeout.subn(r"setTimeout(() => UcursedntUtils.DOM.safeSetHTML(\1, \2), \3);", content)
    changes += count

    # 2. Replace remaining assignments (ternaries, string concatenation)
    content, count = pattern_assignment.subn(r"UcursedntUtils.DOM.safeSetHTML(\1, \2);", content)
    changes += count

    # 3. Replace read operations
    content, count = pattern_read.subn(r"UcursedntUtils.DOM.getHTML(\1)", content)
    changes += count

    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed {changes} edge case(s) in {os.path.basename(filepath)}")
    
    return changes

def main():
    print(f"🧹 Sweeping up remaining innerHTML edge cases in {SRC_DIR}...\n")
    total_changes = 0
    
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith('.js'):
                total_changes += process_file(os.path.join(root, file))
                
    print(f"\n🎉 Edge case sweep complete! Replaced {total_changes} total instances.")
    print("⚠️  Run your build script one last time. You should hit 0 warnings!")

if __name__ == "__main__":
    main()