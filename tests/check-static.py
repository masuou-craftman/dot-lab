"""Static site smoke checks. No network, browser, or third-party packages."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re, subprocess, tempfile
root=Path(__file__).resolve().parents[1]/'dist'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.script=False;self.scripts=[];self.current=[]
 def handle_starttag(self,t,a):
  attrs=dict(a)
  if t=='script':self.script=True;self.current=[]
  for key in ('src','href'):
   if key in attrs:self.links.append(attrs[key])
 def handle_endtag(self,t):
  if t=='script' and self.script:self.scripts.append(''.join(self.current));self.script=False
 def handle_data(self,d):
  if self.script:self.current.append(d)
count=0
for p in root.rglob('*.html'):
 assert not p.name.startswith('_qa'),f'Temporary QA page present: {p}'
 page=Page();page.feed(p.read_text())
 for link in page.links:
  u=urlsplit(link)
  if u.scheme or u.netloc or not u.path:continue
  target=(p.parent/unquote(u.path)).resolve()
  assert target.is_relative_to(root),f'Outside static root: {p.name}: {link}'
  assert target.exists(),f'Broken local link: {p.name}: {link}'
 for js in page.scripts:
  if not js.strip():continue
  with tempfile.NamedTemporaryFile(suffix='.js',mode='w') as f:
   f.write(js);f.flush();subprocess.run(['node','--check',f.name],check=True,capture_output=True)
  count+=1
for p in root.rglob('*.js'):subprocess.run(['node','--check',str(p)],check=True)
print(f'PASS local static link targets; {count} inline scripts and external JS syntax; no QA fixture leakage')
