# -*- coding: utf-8 -*-
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'design.json').read_text())
(ROOT/'design-data.js').write_text('window.ZHIXIAN_DESIGN = '+json.dumps(d,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n')
print('Updated design-data.js from design.json')
