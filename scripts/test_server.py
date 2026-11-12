# -*- coding: utf-8 -*-
"""Exercise save behavior in an isolated temporary directory, never the real design."""
from pathlib import Path
import importlib.util, json, tempfile, threading, urllib.request, urllib.error
spec=importlib.util.spec_from_file_location('workbench_server',Path(__file__).resolve().parents[1]/'serve.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as temp:
    m.ROOT=Path(temp)
    d={'pages':[{'id':'test'}],'variables':[],'workbench':{'frames':[],'edits':{'nodes':{},'variables':{}}}}
    (m.ROOT/'design.json').write_text(json.dumps(d))
    server=m.ThreadingHTTPServer(('127.0.0.1',0),m.Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
    base='http://127.0.0.1:'+str(server.server_address[1])
    def send(data,origin):
        req=urllib.request.Request(base+'/api/design',data=json.dumps(data).encode(),headers={'Content-Type':'application/json','Origin':origin})
        try:
            with urllib.request.urlopen(req) as r:return r.status
        except urllib.error.HTTPError as e:return e.code
    assert send(d,base)==200
    assert (m.ROOT/'design-data.js').read_text().startswith('window.ZHIXIAN_DESIGN = ')
    assert len(list((m.ROOT/'.history').glob('*.json')))==1
    assert send(d,'https://unrelated.example')==403
    assert send({'pages':[]},base)==400
    assert json.loads((m.ROOT/'design.json').read_text())==d
    server.shutdown();server.server_close()
print('PASS: local save, backup, bundle, change record, cross-origin and invalid-document rejection in a temporary directory.')
