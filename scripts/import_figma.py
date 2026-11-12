# -*- coding: utf-8 -*-
"""Import a local Figma export without using the Figma API. Run explicitly, never on save."""
from pathlib import Path
import base64, collections, hashlib, json, re, shutil, sys
ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent / 'zhixian'
source = Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'source/figma-export-2026-11-12.json'
if not (REPO/'apps/mobile').exists():
    raise SystemExit('请将 App 仓库 zhixian 放在本项目同级目录，再重新导入 Figma。日常编辑不需要运行此脚本。')
raw=source.read_bytes()
d=json.loads(raw)
archive=ROOT/'source/figma-export-2026-11-12.json'
if source.resolve()!=archive.resolve(): archive.write_bytes(raw)
def asset(data):
    if not data.startswith('data:'):return data
    header,encoded=data.split(',',1); b=base64.b64decode(encoded)
    ext={'image/svg+xml':'svg','image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[header[5:].split(';')[0]]
    p='assets/figma/'+hashlib.sha256(b).hexdigest()[:20]+'.'+ext
    (ROOT/p).write_bytes(b);return p
for k,v in d['assets'].items(): d['assets'][k]=asset(v)
icons=[]
for p in sorted((REPO/'docs/design/visual-v2-1/icons').glob('*.svg')):
    shutil.copy2(p,ROOT/'assets/icons'/p.name)
    icons.append({'name':p.stem,'path':'assets/icons/'+p.name,'source':'docs/design/visual-v2-1/icons/'+p.name,'kind':'icon'})
app=[]
for p in sorted((REPO/'apps/mobile/assets/xianxian/actions').glob('*.png')):
    name='xianxian-'+p.name;shutil.copy2(p,ROOT/'assets/app'/name)
    app.append({'name':'闲闲 / '+p.stem,'path':'assets/app/'+name,'source':str(p.relative_to(REPO)),'kind':'character'})
for folder,name in [('images','app-icon-book-light.png'),('images','wutong-leaf-miniprogram.png'),('icons','wutong-tab-line.png')]:
    p=REPO/'apps/mobile/assets'/folder/name;shutil.copy2(p,ROOT/'assets/app'/name)
    app.append({'name':name,'path':'assets/app/'+name,'source':str(p.relative_to(REPO)),'kind':'image'})
allnodes=[];recovered=[]
alias={'学习':'study','闲闲':'xianxian','我的':'profile'}
def walk(n,anc=[]):
    allnodes.append(n)
    if n.get('asset'): n['asset']=asset(n['asset'])
    if n.get('name','').startswith('图标 / '):
        key=n['name'].split(' / ',1)[1];key=alias.get(key,key)
        if key in [i['name'] for i in icons]:
            # The source SVG is the same icon system used to construct this Figma file.
            n['iconAsset']='assets/icons/'+key+'.svg'
            n['iconSource']='app-svg'
            if any(x.get('type')=='VECTOR' and not x.get('asset') for x in descendants(n)):recovered.append(n['id'])
    for c in n.get('children',[]):walk(c,anc+[n])
def descendants(n):
    for c in n.get('children',[]):
        yield c;yield from descendants(c)
for p in d['pages']:walk(p)
route_ids={'/':'3:4','/study':'3:35','/profile':'3:120','/records':'3:240','/learn':'3:356','/wordbooks':'4:52','/wordbook/[kind]/[id]':'4:149','/vocabulary':'4:198','/articles':'4:259','/article/[id]':'4:304','/sentences':'4:355','/login':'4:4','/register':'4:26'}
route_files={'/':'(tabs)/index.tsx','/study':'(tabs)/study.tsx','/profile':'(tabs)/profile.tsx','/records':'(tabs)/records.tsx','/learn':'learn.tsx','/wordbooks':'wordbooks.tsx','/wordbook/[kind]/[id]':'wordbook/[kind]/[id].tsx','/vocabulary':'vocabulary.tsx','/articles':'articles.tsx','/article/[id]':'article/[id].tsx','/sentences':'sentences.tsx','/login':'login.tsx','/register':'register.tsx'}
frames=[]
for p in d['pages']:
    def scan(n,section=None):
        if n.get('type')=='SECTION':
            for c in n.get('children',[]):scan(c,n['name'])
        elif n.get('type') in ['FRAME','COMPONENT','COMPONENT_SET']:
            frames.append({'id':n['id'],'name':n['name'],'pageId':p['id'],'category':'component' if n['type'].startswith('COMPONENT') else 'proposal' if section else 'screen','section':section,'status':'待确认提案' if section else 'Figma 最新稿','route':next((k for k,v in route_ids.items() if v==n['id']),None)})
    for n in p['children']:scan(n)
fonts=collections.Counter()
for n in allnodes:
    if n.get('type')=='TEXT':
        key=(n.get('fontSize',14),n.get('fontWeight',400),n.get('lineHeight',{}).get('value','auto'))
        fonts[key]+=1
source_index=[]
for route,f in route_files.items():
    path='apps/mobile/src/app/'+f; b=(REPO/path).read_bytes()
    source_index.append({'route':route,'frameId':route_ids[route],'path':path,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)})
theme=(REPO/'apps/mobile/src/constants/theme.ts').read_text()
appColors={}
for mode in ['light','dark']:
    block=theme.split('export const '+mode+'Colors')[1].split('};')[0]
    appColors[mode]=dict(re.findall(r"(\w+):\s*'([^']+)'",block))
d['workbench']={'version':1,'date':'2026-11-12','primarySource':'Figma 本地只读导出','figmaFileKey':'WqjKYuFL5iIkLeA0Upez0m','originalSha256':hashlib.sha256(raw).hexdigest(),'frames':frames,'assetLibrary':icons+app,'recoveredIconContainers':recovered,'routes':source_index,'appColors':appColors,'typography':[{'fontSize':k[0],'fontWeight':k[1],'lineHeight':k[2],'count':v} for k,v in sorted(fonts.items(),key=lambda x:-x[1])],'differences':[{'name':'底部导航','figma':'332 × 52，圆角 12，玻璃填充、高光描边、投影；保留 GLASS 原始参数。','app':'当前源码为通栏 64 + 安全区高度，白 / 炭灰实色，顶部细分隔线。','status':'按本轮要求，工作台采用 Figma；尚未回写 App。','source':'apps/mobile/src/app/(tabs)/_layout.tsx'},{'name':'导航颜色','figma':'包含 nav、nav_2、highlight 及独立深色变量；nav_2 为约 80% 透明浅绿白。','app':'nav 为浅色 #FFFFFF / 深色 #222222。','status':'保留 Figma 变量原名和透明度，不能用 App 值覆盖。','source':'apps/mobile/src/constants/theme.ts'},{'name':'话题填入','figma':'包含默认、点按、聚焦、短屏 4 个额外画框。','app':'已有点对白填入草稿功能；Figma 中额外入口线索仍属于提案。','status':'提案独立展示，未标记为已应用。','source':'docs/design/topic-affordance-2026-11-07/README.md'}],'limitations':['Figma GLASS 折射 / 色散没有 CSS 等价物；网页用半透明、模糊、描边和投影近似，并保留原始参数及原稿 SVG。','原稿使用 Noto Sans SC；已随工作台提供本地字库。浏览器与 Android 字体栅格化仍需平台核对。','图层坐标保留 Figma 实际值；改变文案或尺寸后需调整关联图层，不自动模拟完整 Figma 自动布局引擎。','网页编辑和原稿保留的组件关系用于设计交接，不自动生成完整 React Native 业务代码。']}
d['source']['fileKey']='WqjKYuFL5iIkLeA0Upez0m'; d['source']['fileKeyProvenance']='本地 Figma 打开文件 URL；导出插件的原始 fileKey 为 null，原文件保持不变'
(ROOT/'design.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(ROOT/'design-data.js').write_text('window.ZHIXIAN_DESIGN = '+json.dumps(d,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+';\n')
print(json.dumps({'frames':len(frames),'components':sum(x['category']=='component' for x in frames),'proposals':sum(x['category']=='proposal' for x in frames),'nodes':len(allnodes)-3,'recoveredIconContainers':len(recovered),'assets':len(list((ROOT/'assets/figma').iterdir()))},ensure_ascii=False))
