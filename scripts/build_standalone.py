# -*- coding: utf-8 -*-
"""Build a portable HTML copy from the canonical on-disk design. No browser required."""
from pathlib import Path
import base64, copy, json, mimetypes
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'design.json').read_text())
def embed(path):
    if not path or path.startswith('data:'):return path
    p=ROOT/path
    mime=mimetypes.guess_type(path)[0] or 'application/octet-stream'
    return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
cache={}
def data(path):
    if path not in cache:cache[path]=embed(path)
    return cache[path]
def walk(n):
    for k in ['asset','iconAsset']:
        if n.get(k):n[k]=data(n[k])
    for c in n.get('children',[]):walk(c)
for p in d['pages']:walk(p)
for n in d['workbench'].get('edits',{}).get('nodes',{}).values():walk(n)
for k,v in d['assets'].items():d['assets'][k]=data(v)
for a in d['workbench']['assetLibrary']:a['path']=data(a['path'])
icons={p.stem:data(str(p.relative_to(ROOT))) for p in (ROOT/'assets/icons').glob('*.svg')}
css=(ROOT/'workbench.css').read_text().replace('assets/fonts/NotoSansSC-VF.ttf',data('assets/fonts/NotoSansSC-VF.ttf'))
html=(ROOT/'index.html').read_text().replace('<link rel="stylesheet" href="workbench.css">','<style>'+css+'</style>')
html=html.replace('href="assets/app/app-icon-book-light.png"','href="'+data('assets/app/app-icon-book-light.png')+'"').replace('src="assets/app/app-icon-book-light.png"','src="'+data('assets/app/app-icon-book-light.png')+'"')
def script(s):return '<script>'+s.replace('</script','<\\/script')+'</script>'
html=html.replace('<script src="design-data.js"></script>',script('window.ZHIXIAN_DESIGN='+json.dumps(d,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';window.ZHIXIAN_INLINE_ICONS='+json.dumps(icons)+';'))
for name in ['renderer','app']:html=html.replace(f'<script src="{name}.js"></script>',script((ROOT/(name+'.js')).read_text()))
# Offline viewing and JSON exports work. Saving remains a local-server action.
(ROOT/'zhixian-workbench.html').write_text(html)
print('Built zhixian-workbench.html: '+str(len(html.encode()))+' bytes')
