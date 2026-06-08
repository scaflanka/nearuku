import sys

path = r'd:\360app\app\screens\MapScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Step 1: Sorting (Line 6564, index 6563)
# We expect exactly this string: '                {selectedCircleMembers.map((member) => {\n'
# But let's be more flexible and just look for the pattern around those lines.
if 'selectedCircleMembers.map' in lines[6563]:
    lines[6563] = """                {[...selectedCircleMembers]
                  .sort((a, b) => {
                    const idA = resolveMemberId(a);
                    const idB = resolveMemberId(b);
                    if (idA === currentUserId) return -1;
                    if (idB === currentUserId) return 1;
                    return 0;
                  })
                  .map((member) => {\n"""

# Step 2: Redundant Section (Lines 6782 to 6934)
# Index 6781 to 6933.
# We'll just set those lines to empty strings.
if '{/* Places Header & Link */}' in lines[6781]:
    for i in range(6781, 6934):
        lines[i] = ""

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Replacement complete.")
