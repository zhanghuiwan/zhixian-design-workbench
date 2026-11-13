"""Append review frames without changing the original Figma pages or variables.

Run once per regeneration; deterministic review IDs keep browser edits stable.
The generated nodes are editable in the ordinary workbench renderer.
"""
from pathlib import Path
import copy
import json

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'design.json'
doc = json.loads(path.read_text())
doc['pages'] = [p for p in doc['pages'] if not p['id'].startswith('review:')]
doc['workbench']['frames'] = [f for f in doc['workbench']['frames'] if f['category'] != 'review']

def flat(n):
    return [n] + [v for c in n.get('children', []) for v in flat(c)]

source = {n['id']: n for p in doc['pages'] for n in flat(p)}
variables = {v['name']: v for v in doc['variables']}

def paint(name, dark=False):
    v = variables[('深色/' if dark else '') + name]
    color = copy.deepcopy(next(iter(v['valuesByMode'].values())))
    return {'type': 'SOLID', 'visible': True, 'opacity': 1,
            'color': color, 'boundVariables': {'color': {'type': 'VARIABLE_ALIAS', 'id': v['id']}}}

def position(n, **values):
    n.update(values)
    n['relativeTransform'] = [[1, 0, n.get('x', 0)], [0, 1, n.get('y', 0)]]
    return n

def radius(n, value=20):
    for k in ['cornerRadius', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']:
        n[k] = value

def clone(raw, prefix):
    n = copy.deepcopy(raw)
    for c in flat(n):
        old = c['id']
        c['sourceNodeId'] = c.get('sourceNodeId', old)
        # Keep original component child suffixes for master-edit propagation.
        c['id'] = prefix + ':' + old
    return n

def find(n, name):
    return next(c for c in flat(n) if c['name'] == name)

def card(n, dark=False, height=None):
    old_height = n['height']
    if height:
        for c in n.get('children', []):
            position(c, y=c.get('y', 0) + (height - old_height) / 2)
        n['height'] = height
    n['fills'] = [paint('surfaceMuted', dark)]
    n['boundVariables']['fills'] = [n['fills'][0]['boundVariables']['color']]
    n['strokes'] = []
    n['effects'] = []
    n['clipsContent'] = True
    radius(n)
    return n

review_page = {'id': 'review:round-menus', 'name': '审查方案 · 原配色圆角菜单', 'type': 'PAGE', 'children': []}
doc['pages'].append(review_page)

def register(n, kind, dark, source_id=None, route=None):
    review_page['children'].append(n)
    section = ('页面' if kind == 'screen' else '新增组件') + (' · 深色' if dark else ' · 浅色')
    doc['workbench']['frames'].append({'id': n['id'], 'name': n['name'], 'pageId': review_page['id'],
        'category': 'review', 'reviewKind': kind, 'section': section, 'status': '原设计基础上的审查提案 · 待评审',
        'sourceFrameId': source_id, 'route': route})

masters = {}
for dark in [False, True]:
    theme = 'dark' if dark else 'light'
    # Original menu-row children, icon resources, typography and colors are retained.
    for key, original, height in [('single', '3:81', 52), ('detail', '3:90', 60)]:
        n = clone(source[original], 'review:master:' + theme + ':' + key)
        n['id'] = 'review:menu:' + theme + ':' + key
        n['type'] = 'COMPONENT'
        n['name'] = '菜单 / 圆角' + ('单行' if key == 'single' else '双行') + (' / 深色' if dark else '')
        n['sourceComponentId'] = '2:49'
        position(n, x=0, y=0)
        if dark:
            # Obtain the corresponding original dark row rather than inventing colors.
            drow = source['3:593' if key == 'single' else '3:602']
            for target, original_node in zip(flat(n), flat(drow)):
                for prop in ['fills', 'strokes', 'boundVariables']:
                    if prop in original_node:
                        target[prop] = copy.deepcopy(original_node[prop])
        card(n, dark, height)
        n['description'] = '由原列表条目 2:49 派生。原图标、字阶与颜色；仅新增 surfaceMuted 圆角菜单底板。'
        masters[(theme, key)] = n
        register(n, 'component', dark, '2:49')
    # Reuse the original appearance module and its existing settings controls.
    n = clone(source['3:663' if dark else '3:151'], 'review:master:' + theme + ':appearance')
    n['id'] = 'review:appearance:' + theme
    n['type'] = 'COMPONENT'
    n['name'] = '设置 / 圆角菜单组' + (' / 深色' if dark else '')
    position(n, x=0, y=0, height=300)
    n['fills'] = []
    n['boundVariables']['fills'] = []
    n['children'] = [c for c in n['children'] if c['name'] != '分隔线']
    position(find(n, '外观与陪伴'), x=0, y=0)
    position(find(n, '主题'), x=20, y=35)
    for label, y, h in [('显示闲闲', 83, 56), ('减少动态效果', 151, 64), ('减少透明效果', 227, 56)]:
        row = find(n, label)
        old_h = row['height']
        position(row, x=0, y=y, width=312)
        for c in row.get('children', []):
            position(c, x=c.get('x', 0) + 20)
        card(row, dark, h)
    masters[(theme, 'appearance')] = n
    register(n, 'component', dark, '3:663' if dark else '3:151')

def instance(master, original, prefix):
    n = clone(master, prefix)
    n['type'] = 'INSTANCE'
    n['mainComponentId'] = master['id']
    n['sourceNodeId'] = original['sourceNodeId']
    n['sourceComponentId'] = master.get('sourceComponentId', master['sourceNodeId'])
    n['name'] = original['name']
    position(n, x=original.get('x', 0), y=original.get('y', 0))
    # IDs map each instance child to the new master child, including nested children.
    for c, m in zip(flat(n)[1:], flat(master)[1:]):
        c['id'] = prefix + ';' + m['id']
    source_texts = [v for v in flat(original) if v['type'] == 'TEXT']
    target_texts = [v for v in flat(n) if v['type'] == 'TEXT']
    for target, old in zip(target_texts, source_texts):
        for prop in ['name', 'characters', 'width', 'fills', 'segments']:
            if prop in old:
                target[prop] = copy.deepcopy(old[prop])
    # Keep the actual original function icon, including its color and source path.
    old_icon = next((c for c in original.get('children', []) if c['name'].startswith('图标 /')), None)
    if old_icon:
        new_icon = copy.deepcopy(old_icon)
        template_icon = n['children'][0]
        position(new_icon, x=template_icon['x'], y=template_icon['y'], width=20, height=20)
        # Icon content varies by instance, so it keeps its own source IDs.
        new_icon = clone(new_icon, prefix + ':icon')
        n['children'][0] = new_icon
    return n

for dark in [False, True]:
    theme = 'dark' if dark else 'light'
    source_ids = ['3:516', '3:547', '3:632'] if dark else ['3:4', '3:35', '3:120']
    for index, (key, original_id) in enumerate(zip(['home', 'study', 'profile'], source_ids)):
        n = clone(source[original_id], 'review:' + theme + ':' + key)
        n['id'] = 'review:' + theme + ':' + key
        n['name'] = ['01 · 闲闲', '02 · 学习', '03 · 我的'][index] + (' / 深色' if dark else '')
        position(n, x=index * 410, y=0 if not dark else 880)
        n['reviewSource'] = original_id
        if key in ['study', 'profile']:
            scroll = find(n, '可滚动内容')
            scroll['workbenchScroll'] = 'vertical'
            scroll['height'] = 640 if key == 'study' else 726
            content = find(scroll, '页面内容')
            if key == 'study':
                book = find(content, '当前词书')
                book['children'] = [c for c in book['children'] if c['name'] != '开始学习']
                book['height'] = 246
                position(find(book, '分隔线'), y=167)
                position(find(book, '学习数据'), y=185)
                placement = {'词汇学习':262, '学习词书':297, '生词本':361, '阅读与收藏':445, '文章阅读':480, '收藏句子':544}
                new_children = []
                for child in content['children']:
                    if child['name'] in placement:
                        position(child, y=placement[child['name']])
                    if child['name'] in ['学习词书', '生词本', '文章阅读', '收藏句子']:
                        master = masters[(theme, 'detail' if child['name']=='生词本' else 'single')]
                        child = instance(master, child, 'review:' + theme + ':study:' + child['name'])
                    new_children.append(child)
                content['children'] = new_children
                content['height'] = 610
            else:
                children = []
                for child in content['children']:
                    if child['name'] == '外观与陪伴':
                        child = instance(masters[(theme, 'appearance')], child, 'review:' + theme + ':profile:appearance')
                    elif child['name'] in ['学习偏好', '闲闲模型', '登录邮箱']:
                        child = instance(masters[(theme, 'detail')], child, 'review:' + theme + ':profile:' + child['name'])
                    if child['name'] in ['学习与助手', '学习偏好', '闲闲模型', '账号', '登录邮箱', '退出登录']:
                        position(child, y=child['y'] + 34)
                    children.append(child)
                content['children'] = children
                content['height'] += 66  # Scrollable tail space, clear of fixed navigation.
        register(n, 'screen', dark, original_id, ['/', '/study', '/profile'][index])

doc['workbench']['review'] = {
    'version': 1, 'date': '2026-11-13', 'timezone': 'Asia/Shanghai', 'status': '待评审 · 未应用到 App',
    'brief': '原配色与原设计；复用原组件，新增 B 方向启发的圆角菜单；保留原新学/复习悬浮卡与导航，移除开始学习。',
    'sourceFrames': ['3:4','3:35','3:120','3:516','3:547','3:632'],
    'newComponentIds': [m['id'] for m in masters.values()],
    'palette': 'Existing variables only; no color additions or changes.'
}
path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
print('Added 6 review screens and 6 reusable components; original pages and variables retained.')
