# -*- coding: utf-8 -*-
"""Prepare only public static assets. All paths remain relative for GitHub Pages."""
from pathlib import Path
import json, shutil, subprocess
ROOT=Path(__file__).resolve().parents[1]
subprocess.run(['python3',str(ROOT/'scripts/sync_bundle.py')],check=True)
dist=ROOT/'dist';dist.mkdir(exist_ok=True)
for name in ['index.html','workbench.css','app.js','renderer.js','design.json','design-data.js','changes.json','README.md','AGENTS.md','CHANGELOG.md','APP_SYNC.md']:
    shutil.copy2(ROOT/name,dist/name)
shutil.copytree(ROOT/'assets',dist/'assets',dirs_exist_ok=True)
(dist/'.nojekyll').write_text('')
print('Prepared GitHub Pages site in dist/')
