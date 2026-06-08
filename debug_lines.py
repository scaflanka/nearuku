import sys
with open(r'd:\360app\app\screens\MapScreen.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    target_lines = [6563, 6564, 6565, 6782, 6783]
    for i in target_lines:
        if i <= len(lines):
            print(f"Line {i}: {repr(lines[i-1])}")
