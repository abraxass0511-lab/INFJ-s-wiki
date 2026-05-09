"""Fix atob() UTF-8 decoding issue in worker.js
The problem: atob() returns Latin-1, which corrupts Korean characters.
Fix: Use atob() → Uint8Array → TextDecoder('utf-8')
"""
with open('worker.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: updateCategories - atob decoding
old_atob_cat = "categories = JSON.parse(atob(res.content.replace(/\\n/g, '')));"
new_atob_cat = """const raw = atob(res.content.replace(/\\n/g, ''));
      const bytes = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
      categories = JSON.parse(new TextDecoder('utf-8').decode(bytes));"""

if old_atob_cat in content:
    content = content.replace(old_atob_cat, new_atob_cat)
    print("OK - Fixed updateCategories atob decoding")
else:
    print("WARNING - updateCategories atob pattern not found")

# Fix 2: Check for other atob() calls that might also have this issue
# saveNotifyInfo 
old_atob_notify = "notifyData = JSON.parse(atob(res.content.replace(/\\n/g, '')));"
new_atob_notify = """const rawN = atob(res.content.replace(/\\n/g, ''));
      const bytesN = new Uint8Array([...rawN].map(c => c.charCodeAt(0)));
      notifyData = JSON.parse(new TextDecoder('utf-8').decode(bytesN));"""

if old_atob_notify in content:
    content = content.replace(old_atob_notify, new_atob_notify)
    print("OK - Fixed saveNotifyInfo atob decoding")
else:
    print("WARNING - saveNotifyInfo atob pattern not found")

# Fix 3: getGitHubFiles - if any
# Check for other atob patterns
import re
atob_patterns = re.findall(r'JSON\.parse\(atob\(.*?\)\)', content)
print(f"\nRemaining atob patterns: {len(atob_patterns)}")
for p in atob_patterns:
    print(f"  {p[:80]}")

with open('worker.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ UTF-8 디코딩 수정 완료!")
