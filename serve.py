# -*- coding: utf-8 -*-
"""Loopback-only design workbench. Static preview and explicitly requested local saves."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import argparse, datetime, hashlib, json, os, tempfile, webbrowser
ROOT=Path(__file__).resolve().parent
MAX_BYTES=40*1024*1024

def write_atomic(path, content):
    with tempfile.NamedTemporaryFile('w',dir=path.parent,delete=False,encoding='utf-8') as f:
        f.write(content); temp=Path(f.name)
    temp.replace(path)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        if urlparse(self.path).path=='/api/health':
            self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"local":true,"saving":true}');return
        if '/.history/' in self.path or self.path.startswith('/.history/'):
            self.send_error(404);return
        return super().do_GET()
    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()
    def do_POST(self):
        if self.path!='/api/design':self.send_error(404);return
        # Browsers may only save from this server, never from an unrelated site.
        allowed={'127.0.0.1','localhost'}
        host=self.headers.get('Host','').split(':')[0]
        origin=self.headers.get('Origin')
        if host not in allowed or (origin and origin!=f'http://{self.headers.get("Host")}'):
            self.send_error(403,'Only same-origin local saves are allowed');return
        if not self.headers.get('Content-Type','').startswith('application/json'):
            self.send_error(415);return
        try:
            length=int(self.headers.get('Content-Length',0))
            if not 0<length<=MAX_BYTES:raise ValueError('Design file exceeds limit')
            d=json.loads(self.rfile.read(length))
            if not isinstance(d.get('pages'),list) or not isinstance(d.get('variables'),list) or not isinstance(d.get('workbench',{}).get('frames'),list):raise ValueError('Invalid design document')
            if not d['pages'] or len(d['pages'])>100:raise ValueError('Invalid page count')
            target=ROOT/'design.json'; previous=target.read_bytes()
            history=ROOT/'.history';history.mkdir(exist_ok=True)
            digest=hashlib.sha256(previous).hexdigest()[:12]
            backup=history/f'design-{digest}.json'
            if not backup.exists():backup.write_bytes(previous)
            changes={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'primarySource':'Figma export 2026-11-12','appChanged':False,'edits':d['workbench'].get('edits',{}),'previousSha256':hashlib.sha256(previous).hexdigest()}
            write_atomic(target,json.dumps(d,ensure_ascii=False,indent=2)+'\n')
            write_atomic(ROOT/'design-data.js','window.ZHIXIAN_DESIGN = '+json.dumps(d,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n')
            write_atomic(ROOT/'changes.json',json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
            self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"saved":true}')
        except (ValueError,KeyError,TypeError) as e:self.send_error(400,str(e))
        except OSError:self.send_error(500,'Unable to write design files')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=4178);p.add_argument('--open',action='store_true');a=p.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler)
    url=f'http://127.0.0.1:{a.port}'
    print('知闲设计工作台: '+url,flush=True)
    if a.open:webbrowser.open(url)
    try:server.serve_forever()
    except KeyboardInterrupt:server.server_close()
