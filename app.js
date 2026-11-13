/* The canonical project lives in design.json; edits are small, reversible patches. */
(() => {
  'use strict';
  let doc=window.ZHIXIAN_DESIGN;
  const localServer=location.protocol!=='file:'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=(name)=>{const path=window.ZHIXIAN_INLINE_ICONS?.[name]||`assets/icons/${name}.svg`;return `<span class="ui-icon" style="background:currentColor;mask:url('${path}') center/contain no-repeat;-webkit-mask:url('${path}') center/contain no-repeat" aria-hidden="true"></span>`;};
  let KEY='zhixian-workbench-v1:'+doc.workbench.originalSha256;
  let edits={nodes:{},variables:{}}, undo=[],redo=[],view='pages',selected=null,focusFrame=null,pageFilter=null,search='',zoom=.65,theme='all',renderer;
  try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.nodes)edits=saved;}catch{}
  const sourceEdits=doc.workbench.edits||{nodes:{},variables:{}};
  const baseEdits=structuredClone(sourceEdits);
  const refreshRenderer=()=>{renderer=DesignRenderer.create(doc,{nodes:{...sourceEdits.nodes,...edits.nodes},variables:{...sourceEdits.variables,...edits.variables}});};
  refreshRenderer();
  const frames=()=>doc.workbench.frames;
  const node=id=>renderer.nodes.get(id);
  const effective=id=>renderer.effective(node(id));
  const leafNodes=n=>[n,...(n.children||[]).flatMap(leafNodes)];
  const count=()=>({screens:frames().filter(x=>x.category==='screen').length,proposals:frames().filter(x=>x.category==='proposal').length,components:frames().filter(x=>x.category==='component').length});
  const byId=id=>frames().find(f=>f.id===id);
  const frameFor=id=>{let n=node(id);while(n&&!byId(n.id))n=renderer.parents.get(n.id);return n?.id;};
  let toastTimer;
  function toast(msg){$('#toast').textContent=msg;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
  function saveDraft(){try{localStorage.setItem(KEY,JSON.stringify(edits));$('#save-status').textContent='草稿已存此浏览器';}catch{$('#save-status').textContent='草稿未保存，请导出';}$('#undo').disabled=!undo.length;$('#redo').disabled=!redo.length;}
  function change(kind,id,patch){
    undo.push(JSON.stringify(edits));if(undo.length>60)undo.shift();redo=[];
    if(kind==='variables')edits.variables[id]=patch;
    else edits.nodes[id]={...sourceEdits.nodes?.[id],...edits.nodes[id],...patch};
    refreshRenderer();saveDraft();renderCanvas();renderInspector();
  }
  function history(direction){const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;if(!from.length)return;to.push(JSON.stringify(edits));edits=JSON.parse(from.pop());refreshRenderer();saveDraft();renderCanvas();renderInspector();}
  function matchingFrames(){
    return frames().filter(inView)
      .filter(f=>!pageFilter||f.pageId===pageFilter)
      .filter(f=>theme==='all'||(theme==='proposal'?f.category==='proposal':theme==='dark'?f.name.includes('深色'):!f.name.includes('深色')&&f.category!=='proposal'))
      .filter(f=>!search||leafNodes(node(f.id)).some(n=>(n.name+' '+(n.characters||'')).toLowerCase().includes(search.toLowerCase())));
  }
  function inView(f){return view==='review'?f.category==='review':view==='components'?f.category==='component':f.category!=='component'&&f.category!=='review';}
  function renderNavigation(){
    const c=count();$('#inventory-count').textContent=`${c.screens+c.proposals} 画框 · ${c.components} 组件 · ${doc.variables.length} 变量`;
    const names={pages:['albums-outline','页面',c.screens+c.proposals],components:['wordbooks','组件',c.components],tokens:['filter','颜色与排版',doc.variables.length],assets:['attachment','图标与图像',doc.workbench.assetLibrary.length],handoff:['text','开发交接',''],review:['check-circle','审查方案',frames().filter(f=>f.category==='review').length]};
    names.pages[0]='list';
    $$('[data-view]').forEach(a=>{const [i,n,c]=names[a.dataset.view];a.innerHTML=icon(i)+`<span>${n}</span><small>${c}</small>`;a.classList.toggle('active',a.dataset.view===view);if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('#directory-title').textContent=view==='review'?'审查页面与组件':view==='components'?'组件目录':'页面目录';
    const dir=$('#directory');dir.replaceChildren();
    for(const p of doc.pages){const entries=frames().filter(f=>f.pageId===p.id&&inView(f)).filter(f=>!search||leafNodes(node(f.id)).some(n=>(n.name+' '+(n.characters||'')).toLowerCase().includes(search.toLowerCase())));if(!entries.length)continue;
      if(view==='review'){
        for(const section of ['页面 · 浅色','页面 · 深色','新增组件 · 浅色','新增组件 · 深色']){
          const group=entries.filter(f=>f.section===section);if(!group.length)continue;
          const details=document.createElement('details');details.open=true;
          const summary=document.createElement('summary');summary.textContent=section+' · '+group.length;details.append(summary);
          for(const f of group){const b=document.createElement('button');b.className=f.id===focusFrame?'active':'';b.innerHTML='<span class="node-dot"></span>'+esc(f.name);b.onclick=()=>{location.hash='screen/'+encodeURIComponent(f.id);$('#sidebar').classList.remove('open');};details.append(b);}dir.append(details);
        }continue;
      }
      const details=document.createElement('details');details.open=true;const s=document.createElement('summary');s.textContent=p.name+' · '+entries.length;details.append(s);
      for(const f of entries){const b=document.createElement('button');b.className=(f.id===focusFrame?'active ':'')+(f.category==='proposal'?'proposal':'');b.innerHTML='<span class="node-dot"></span>'+esc(f.name.replace(/^\d+ · /,''));b.addEventListener('click',()=>{location.hash='screen/'+encodeURIComponent(f.id);$('#sidebar').classList.remove('open');});details.append(b);}dir.append(details);
    }
  }
  function showView(next, frame){view=next;focusFrame=frame||null;selected=frame||null;pageFilter=null;search='';$('#search').value='';renderNavigation();renderCanvas();renderInspector();}
  function route(){const parts=location.hash.slice(1).split('/');if(parts[0]==='screen'&&byId(decodeURIComponent(parts[1]||''))){const f=byId(decodeURIComponent(parts[1]));showView(f.category==='review'?'review':f.category==='component'?'components':'pages',f.id);}else showView(['pages','components','tokens','assets','handoff','review'].includes(parts[0])?parts[0]:'pages');}
  function board(f,single=false){
    const n=effective(f.id),scale=single?zoom:Math.min(zoom,view==='components'?1:.8);
    const article=document.createElement('article');article.className='board-item';article.style.width=(n.width*scale)+'px';article.dataset.frameId=f.id;
    const title=document.createElement('div');title.className='board-caption';const b=document.createElement('button');b.textContent=n.name;b.title='打开画框';b.addEventListener('click',()=>location.hash='screen/'+encodeURIComponent(f.id));title.append(b);article.append(title);
    const shell=document.createElement('div');shell.className='frame-shell';shell.style.width=n.width*scale+'px';shell.style.height=n.height*scale+'px';
    const scaled=document.createElement('div');scaled.className='frame-scale';scaled.style.transform=`scale(${scale})`;scaled.style.width=n.width+'px';scaled.style.height=n.height+'px';scaled.append(renderer.render(node(f.id),true));shell.append(scaled);article.append(shell);
    const meta=document.createElement('div');meta.className='screen-meta-line';meta.innerHTML=`<span>${Math.round(n.width)} × ${Math.round(n.height)} <span aria-hidden="true">·</span> ${esc(f.id)}</span>`;
    const open=document.createElement('button');open.textContent=single?'复制画框说明':'打开';open.addEventListener('click',()=>single?copySpec(f.id):location.hash='screen/'+encodeURIComponent(f.id));meta.append(open);article.append(meta);
    if(f.category==='proposal'||f.category==='review'){const tag=document.createElement('small');tag.className=f.category==='review'?'review-tag':'proposal-tag';tag.textContent=f.category==='review'?(f.reviewKind==='component'?'新增可复用组件':'原设计基础上的审查页'):'待确认提案';tag.style.marginTop='8px';article.append(tag);}return article;
  }
  function renderCanvas(){
    const canvas=$('#canvas');canvas.replaceChildren();canvas.classList.toggle('doc-canvas',['tokens','assets','handoff'].includes(view));
    const titles={pages:'全部页面',components:'组件库',tokens:'颜色与排版',assets:'图标与图像',handoff:'开发交接',review:'审查方案 · 原配色分组菜单'};
    $('#view-title').textContent=focusFrame?effective(focusFrame).name:titles[view];$('#breadcrumbs').textContent='知闲 Android / '+(focusFrame?doc.pages.find(p=>p.id===byId(focusFrame).pageId).name:'设计资源 / '+titles[view]);
    $('#overview').hidden=!focusFrame;$('#theme-filter-label').hidden=!!focusFrame||!['pages','review'].includes(view);$('#zoom-label').hidden=!['pages','components','review'].includes(view);
    if(view==='tokens'){renderTokens(canvas);return;}if(view==='assets'){renderAssets(canvas);return;}if(view==='handoff'){renderHandoff(canvas);return;}
    if(focusFrame){const wrap=document.createElement('div');wrap.className='single-board';wrap.append(board(byId(focusFrame),true));canvas.append(wrap);markSelection();return;}
    if(view==='review'){renderReview(canvas);return;}
    const matching=matchingFrames();
    for(const p of doc.pages){const fs=matching.filter(f=>f.pageId===p.id);if(!fs.length)continue;
      for(const isProposal of [false,true]){
        const group=fs.filter(f=>(f.category==='proposal')===isProposal);if(!group.length)continue;
        const h=document.createElement('div');h.className='collection-header';const title=document.createElement('h2');title.textContent=isProposal?'话题填入 · 设计提案':p.name;const num=document.createElement('span');num.textContent=group.length+' '+(view==='components'?'个组件':'个画框');title.append(num);h.append(title);
        const a=document.createElement('a');a.href=`https://www.figma.com/design/${doc.workbench.figmaFileKey}?node-id=${p.id.replace(':','-')}`;a.target='_blank';a.rel='noopener';a.textContent='查看 Figma 原稿 ↗';h.append(a);canvas.append(h);
        const grid=document.createElement('div');grid.className='board-grid';group.forEach(f=>grid.append(board(f)));canvas.append(grid);
      }
    }
    if(!matching.length){canvas.innerHTML='<div class="empty-results"><h2>没有匹配的画框</h2><p>试试其他名称，或清除主题筛选。</p></div>';}
    markSelection();
  }
  function renderReview(canvas){
    const intro=document.createElement('div');intro.className='review-intro';
    intro.innerHTML='<strong>原设计 + 分组菜单</strong><p>沿用原配色与现有组件。同类条目共用圆角容器，组内分隔；保留新学 / 复习和导航，移除“开始学习”。</p><a href="explorations/">查看上一轮三个视觉方向 ↗</a>';
    canvas.append(intro);
    const matching=matchingFrames();
    for(const section of ['页面 · 浅色','页面 · 深色','新增组件 · 浅色','新增组件 · 深色']){
      const group=matching.filter(f=>f.section===section);if(!group.length)continue;
      const h=document.createElement('div');h.className='collection-header';const title=document.createElement('h2');title.textContent=section;
      const total=document.createElement('span');total.textContent=group.length+(section.startsWith('页面')?' 个页面':' 个组件');title.append(total);h.append(title);canvas.append(h);
      const grid=document.createElement('div');grid.className='board-grid';group.forEach(f=>grid.append(board(f)));canvas.append(grid);
    }
    if(!matching.length){const empty=document.createElement('p');empty.className='text-note';empty.textContent='没有匹配的审查页面或组件。';canvas.append(empty);}
    markSelection();
  }
  function markSelection(){$$('.design-node.selected').forEach(el=>el.classList.remove('selected'));if(selected)$$('.design-node').filter(el=>el.dataset.nodeId===selected).forEach(el=>el.classList.add('selected'));}
  function headerSection(title,html){return `<section class="inspector-section"><h3>${title}</h3>${html}</section>`;}
  function field(label,key,value,type='number',attrs=''){return `<label class="field">${label}<input type="${type}" data-prop="${key}" value="${esc(value)}" ${attrs}></label>`;}
  function select(id){selected=id;markSelection();renderInspector();}
  function renderInspector(){
    const p=$('#properties');p.replaceChildren();const n=selected&&node(selected)?effective(selected):null;
    if(!n){const c=count();p.innerHTML=`<div class="inspector-empty">${icon('filter')}<h2>从设计到 App</h2><p class="text-note" style="margin-top:12px">选择画框或图层，查看和修改设计属性。</p><div class="stat-grid"><div><strong>${c.screens+c.proposals}</strong><span>页面与状态</span></div><div><strong>${c.components}</strong><span>主组件</span></div><div><strong>${doc.variables.length}</strong><span>颜色变量</span></div><div><strong>2007</strong><span>原稿图层</span></div></div></div>`+headerSection('本轮来源',`<p>Figma · 2026-11-12</p><p>当前 App 源码用于页面映射、补齐图标与素材。画布以 Figma 为准。</p><p>4 个提案画框单独标记，尚未应用到 App。</p>`)+headerSection('保存方式','<p>修改自动保存在此浏览器。本地点击“保存到项目”；线上先“导出修改文件”，在本地仓库导入并提交。</p>')+headerSection('渲染边界','<p>玻璃折射采用 CSS 近似。字体、系统安全区和动态行为仍需 App 核对。</p><a class="subtle-link" href="#handoff">查看来源与差异</a>');renderLayers();return;}
    const f=byId(frameFor(n.id));const parent=renderer.parents.get(n.id);
    p.innerHTML=`<div class="inspector-section"><div class="inspector-name">${esc(n.name)}</div><div class="inspector-meta"><span>${esc(n.type)}</span><code>${esc(n.id)}</code></div>${f?.category==='review'?'<span class="review-tag" style="margin-top:10px">审查提案 · 待评审</span>':f?.category==='proposal'?'<span class="proposal-tag" style="margin-top:10px">待确认提案</span>':''}</div>`;
    p.insertAdjacentHTML('beforeend',headerSection('图层',`<div class="form-grid">${field('名称','name',n.name,'text','class="name-input"')}<label class="field">可见<input type="checkbox" data-prop="visible" ${n.visible!==false?'checked':''}></label></div>`));
    if(n.type==='TEXT')p.insertAdjacentHTML('beforeend',headerSection('文字',`<div class="form-grid"><label class="field full">内容<textarea data-prop="characters">${esc(n.characters)}</textarea></label>${field('字号','fontSize',n.fontSize||n.segments?.[0]?.fontSize||14,'number','min="1" max="300" step="1"')}${field('字重','fontWeight',n.fontWeight||400,'number','min="100" max="900" step="100"')}${field('行高 px','lineHeight',n.lineHeight?.value||20,'number','min="1" max="500"')}</div>`));
    p.insertAdjacentHTML('beforeend',headerSection('布局',`<div class="form-grid">${field('X','x',Number(n.x||0).toFixed(1))}${field('Y','y',Number(n.y||0).toFixed(1))}${field('宽 W','width',Number(n.width).toFixed(1),'number','min="1" max="10000"')}${field('高 H','height',Number(n.height).toFixed(1),'number','min="1" max="10000"')}${field('圆角','cornerRadius',n.cornerRadius||0,'number','min="0"')}${field('不透明度 %','opacity',Math.round((n.opacity??1)*100),'number','min="0" max="100"')}</div>`));
    const paint=(n.fills||[]).find(f=>f.type==='SOLID'&&f.visible!==false);
    if(paint){const bound=paint.boundVariables?.color?.id;const c=renderer.variable(bound)||paint.color;
      p.insertAdjacentHTML('beforeend',headerSection(n.type==='TEXT'?'文字颜色':'填充',`<div class="color-control"><input id="fill-color" type="color" value="${DesignRenderer.hex(c)}" aria-label="图层颜色"><input id="fill-hex" type="text" value="${DesignRenderer.hex(c)}" aria-label="图层颜色十六进制"></div><label class="field" style="margin-top:10px">填充透明度 %<input id="fill-alpha" type="number" min="0" max="100" value="${Math.round((c.a??paint.opacity??1)*100)}"></label>${bound?`<p>绑定变量：<code>${esc(doc.variables.find(v=>v.id===bound)?.name||bound)}</code></p><p class="hint">单层改色会解除该填充绑定；全局改色请在“颜色与排版”中修改变量。</p>`:''}`));
    }
    if(n.iconAsset||n.fills?.some(p=>p.type==='IMAGE'))p.insertAdjacentHTML('beforeend',headerSection('图像与图标',`<p>${n.iconAsset?'App 同源 SVG 图标':'Figma 导出原始图像'}</p><code>${esc(n.iconAsset||doc.assets[n.fills.find(p=>p.type==='IMAGE').imageHash])}</code><button id="replace-image" class="button">从素材库替换</button>`));
    if(n.sourceNodeId)p.insertAdjacentHTML('beforeend',headerSection('复用来源',`<p>沿用原设计的图层、组件或素材。</p><code>${esc(n.sourceNodeId)}</code>${(byId(f?.sourceFrameId)||frameFor(n.sourceNodeId))?`<a class="subtle-link" style="display:block;margin-top:8px" href="#screen/${encodeURIComponent(byId(f?.sourceFrameId)?f.sourceFrameId:frameFor(n.sourceNodeId))}">查看原设计</a>`:''}`));
    if(n.type==='COMPONENT'||n.id.includes(';'))p.insertAdjacentHTML('beforeend',headerSection('组件关系',`<p>${n.type==='COMPONENT'?'修改此主组件的显式属性会同步到引用它的实例；文字内容通过原始子图层 ID 同步。':'保留了主组件子图层 ID。实例的单独修改优先于主组件修改。'}</p>`));
    if(n.type==='INSTANCE')p.insertAdjacentHTML('beforeend',headerSection('组件实例',`<code>${esc(n.mainComponentId)}</code>${byId(n.mainComponentId)?`<button id="open-master" class="button">查看主组件</button>`:''}`));
    if(n.effects?.length)p.insertAdjacentHTML('beforeend',headerSection('效果',`<p>${n.effects.filter(e=>e.visible!==false).map(e=>e.type==='GLASS'?'玻璃 · CSS 模糊近似':e.type).join(' / ')}</p><details><summary class="hint">原始效果参数</summary><pre>${esc(JSON.stringify(n.effects,null,2))}</pre></details>`));
    p.insertAdjacentHTML('beforeend',headerSection('开发引用',`<p>${f?.route?'路由：'+esc(f.route):esc(f?.status||'Figma 图层')}</p><code>design.json → ${esc(n.id)}</code>${parent?`<button id="parent-layer" class="button">选择父级 · ${esc(parent.name)}</button>`:''}<button id="copy-layer" class="button">复制图层 JSON</button><button id="copy-css" class="button">复制图层 CSS</button>${f?.category==='review'?'':`<a class="subtle-link" style="display:block;margin-top:12px" href="https://www.figma.com/design/${doc.workbench.figmaFileKey}?node-id=${n.id.replace(':','-')}" target="_blank" rel="noopener">在 Figma 中查看 ↗</a>`}`));
    p.insertAdjacentHTML('beforeend','<button id="apply-properties" class="button" style="width:100%">应用属性修改</button>');
    const patchFromInput=input=>{
      const key=input.dataset.prop;let value=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;
      if(input.type==='number'&&(!input.checkValidity()||!Number.isFinite(value))){toast('请输入有效范围内的数值');input.value=n[key]??0;return;}
      let patch={[key]:value};if(key==='opacity')patch.opacity=value/100;
      if(key==='lineHeight')patch.lineHeight={unit:'PIXELS',value};
      if(key==='cornerRadius')for(const k of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'])patch[k]=value;
      return patch;
    };
    const applyInput=input=>{const patch=patchFromInput(input);if(patch)change('nodes',n.id,patch);};
    p.querySelectorAll('[data-prop]').forEach(input=>{input.dataset.initial=input.type==='checkbox'?String(input.checked):input.value;input.addEventListener('change',()=>applyInput(input));});
    $('#apply-properties').onclick=()=>{const patch={};for(const input of p.querySelectorAll('[data-prop]')){const value=input.type==='checkbox'?String(input.checked):input.value;if(value!==input.dataset.initial){const next=patchFromInput(input);if(!next)return;Object.assign(patch,next);}}if(Object.keys(patch).length)change('nodes',n.id,patch);else toast('当前属性已应用');};
    const fillUpdate=(value,alpha)=>{if(!/^#[0-9a-f]{6}$/i.test(value)){toast('请使用 #RRGGBB 颜色');return;}const rgb=parseHex(value);const fills=structuredClone(n.fills);const i=fills.findIndex(p=>p.type==='SOLID'&&p.visible!==false);fills[i]={...fills[i],color:rgb,opacity:Math.max(0,Math.min(1,alpha)),boundVariables:{}};change('nodes',n.id,{fills,boundVariables:{...n.boundVariables,fills:[]}});};
    if($('#fill-color')){$('#fill-color').onchange=e=>fillUpdate(e.target.value,Number($('#fill-alpha').value)/100);$('#fill-hex').onchange=e=>fillUpdate(e.target.value,Number($('#fill-alpha').value)/100);$('#fill-alpha').onchange=e=>fillUpdate($('#fill-hex').value,Number(e.target.value)/100);}
    if($('#parent-layer'))$('#parent-layer').onclick=()=>select(parent.id);
    if($('#copy-layer'))$('#copy-layer').onclick=()=>copy(JSON.stringify(n,null,2));
    if($('#copy-css'))$('#copy-css').onclick=()=>{const el=$$('.design-node').find(el=>el.dataset.nodeId===n.id);copy(el?el.style.cssText.split(';').filter(Boolean).join(';\n')+';':'/* 请先打开画框 */');};
    if($('#open-master'))$('#open-master').onclick=()=>location.hash='screen/'+encodeURIComponent(n.mainComponentId);
    if($('#replace-image'))$('#replace-image').onclick=()=>{window.replaceTarget=n.id;location.hash='assets';toast('选择一个素材，右侧点击“替换选中图层”');};
    renderLayers();
  }
  function renderLayers(){
    const target=$('#layers');target.replaceChildren();const root=focusFrame||selected&&frameFor(selected);if(!root){target.innerHTML='<p class="text-note">打开画框后可查看完整图层树。</p>';return;}
    const ul=document.createElement('ul');ul.className='layer-tree';
    function add(n,list,depth){const li=document.createElement('li');const b=document.createElement('button');b.innerHTML=`<span class="layer-type">${n.type==='TEXT'?'T':n.type==='INSTANCE'?'◇':n.type==='VECTOR'?'⌁':'▧'}</span>${esc(renderer.effective(n).name)}`;b.classList.toggle('active',selected===n.id);b.onclick=e=>{e.preventDefault();select(n.id);};
      if(n.children?.length){const d=document.createElement('details');d.open=depth<2||selected===n.id;const sum=document.createElement('summary');sum.append(b);d.append(sum);const sub=document.createElement('ul');n.children.forEach(c=>add(c,sub,depth+1));d.append(sub);li.append(d);}else li.append(b);list.append(li);}
    add(node(root),ul,0);target.append(ul);
  }
  function parseHex(value){return {r:parseInt(value.slice(1,3),16)/255,g:parseInt(value.slice(3,5),16)/255,b:parseInt(value.slice(5,7),16)/255};}
  function renderTokens(canvas){
    const note=document.createElement('p');note.className='text-note';note.textContent='颜色直接来自 Figma 变量。修改变量后，绑定它的页面和组件会同步更新；浅色与深色保留各自的原始变量。';canvas.append(note);
    for(const dark of [false,true]){
      const h=document.createElement('div');h.className='collection-header';h.innerHTML=`<h2>${dark?'深色':'浅色与通用'}变量</h2>`;canvas.append(h);const grid=document.createElement('div');grid.className='token-grid';
      for(const v of doc.variables.filter(v=>v.name.startsWith('深色/')===dark)){
        const c=renderer.variable(v.id);if(!c||!('r' in c))continue;
        const item=document.createElement('article');item.className='token-card';item.dataset.variableId=v.id;
        item.innerHTML=`<div class="swatch"><div style="background:${DesignRenderer.rgba(c)}"></div></div><div class="token-info"><strong>${esc(v.name)}</strong><code>${DesignRenderer.hex(c).toUpperCase()} · ${Math.round((c.a??1)*100)}%</code><div class="token-editor"><input type="color" value="${DesignRenderer.hex(c)}" aria-label="${esc(v.name)}颜色"><input type="text" value="${DesignRenderer.hex(c).toUpperCase()}" aria-label="${esc(v.name)}十六进制"><input type="number" min="0" max="100" value="${Math.round((c.a??1)*100)}" aria-label="${esc(v.name)}透明度百分比"></div></div>`;
        const inputs=item.querySelectorAll('input');const commit=i=>{const hex=i===0?inputs[0].value:inputs[1].value;if(!/^#[0-9a-f]{6}$/i.test(hex)){toast('请使用 #RRGGBB 颜色');return;}if(!inputs[2].checkValidity()){toast('透明度须为 0–100');return;}change('variables',v.id,{...parseHex(hex),a:Number(inputs[2].value)/100});};inputs.forEach((input,i)=>input.addEventListener('change',()=>commit(i)));const apply=document.createElement('button');apply.className='plain-button';apply.textContent='应用';apply.setAttribute('aria-label','应用 '+v.name+' 变量');apply.onclick=()=>commit(inputs[0].value!==DesignRenderer.hex(c)&&inputs[1].value.toLowerCase()===DesignRenderer.hex(c)?0:1);item.querySelector('.token-info').append(apply);grid.append(item);
      }canvas.append(grid);
    }
    const typo=document.createElement('section');typo.className='document';typo.innerHTML='<h2>原稿文字规格</h2><p>原稿使用 Noto Sans SC。此工作台提供同名字体；以下规格由全部文字图层统计。</p><div class="table-wrap"><table class="typography-table"><thead><tr><th>字号</th><th>字重</th><th>行高</th><th>使用图层</th></tr></thead><tbody>'+doc.workbench.typography.map(t=>`<tr><td>${t.fontSize} px</td><td>${t.fontWeight}</td><td>${t.lineHeight}</td><td>${t.count}</td></tr>`).join('')+'</tbody></table></div>';canvas.append(typo);
  }
  function renderAssets(canvas){
    const note=document.createElement('p');note.className='text-note';note.textContent='使用 App 的真实 SVG 图标、闲闲透明图片及桌面图标。点击素材查看来源、替换选中图层或下载原件。';canvas.append(note);
    for(const kind of ['character','image','icon']){
      const h=document.createElement('div');h.className='collection-header';h.innerHTML=`<h2>${{character:'闲闲 · 姿态',image:'导航与品牌图像',icon:'功能图标 · App 同源 SVG'}[kind]}</h2>`;canvas.append(h);const grid=document.createElement('div');grid.className='asset-grid';
      for(const a of doc.workbench.assetLibrary.filter(a=>a.kind===kind&&(!search||a.name.toLowerCase().includes(search.toLowerCase())))){
        const b=document.createElement('button');b.className='asset-card '+(kind==='character'?'character':'');b.innerHTML=`<img src="${esc(a.path)}" alt="${esc(a.name)}" loading="lazy"><span>${esc(a.name)}</span>`;b.onclick=()=>assetInspector(a);grid.append(b);
      }canvas.append(grid);
    }
    const h=document.createElement('div');h.className='collection-header';h.innerHTML='<h2>Figma 原始导出素材<span>包含原稿矢量与玻璃参考</span></h2>';canvas.append(h);
    const grid=document.createElement('div');grid.className='asset-grid';for(const path of [...new Set([...Object.values(doc.assets||{}),...[...renderer.nodes.values()].map(n=>n.asset).filter(Boolean)])]){const b=document.createElement('button');b.className='asset-card';b.innerHTML=`<img src="${esc(path)}" alt="Figma 导出素材" loading="lazy"><span>${esc(path.split('/').pop())}</span>`;b.onclick=()=>assetInspector({name:'Figma 原始素材',path,source:'source/figma-export-2026-11-12.json',kind:'export'});grid.append(b);}canvas.append(grid);
  }
  function assetInspector(a){
    $('#properties-tab').click();$('#properties').innerHTML=`<div class="inspector-section"><h2>${esc(a.name)}</h2><img class="asset-detail" src="${esc(a.path)}" alt="${esc(a.name)}"><p class="text-note">${esc(a.kind==='character'?'透明静态 PNG；不是骨骼或逐帧动画。':'保留源文件，不使用字符替代图标。')}</p><a class="button" href="${esc(a.path)}" download>下载素材</a></div>`+headerSection('来源',`<code>${esc(a.source)}</code><p>工作台路径</p><code>${esc(a.path)}</code>`)+(window.replaceTarget?headerSection('替换图层',`<p>${esc(node(window.replaceTarget)?.name||window.replaceTarget)}</p><button id="apply-asset" class="button primary">替换选中图层</button>`):'');
    if($('#apply-asset'))$('#apply-asset').onclick=()=>{const id=window.replaceTarget;const patch=a.kind==='icon'?{iconAsset:a.path}:{iconAsset:null,fills:[{type:'IMAGE',scaleMode:'FIT',imageHash:'workbench:'+a.path,visible:true,opacity:1}]};if(a.kind!=='icon')doc.assets['workbench:'+a.path]=a.path;change('nodes',id,patch);window.replaceTarget=null;location.hash='screen/'+encodeURIComponent(frameFor(id));toast('素材已替换，可在画框中调整位置和尺寸');};
  }
  function renderHandoff(canvas){
    const c=count(),el=document.createElement('article');el.className='document';el.innerHTML=`<h2>这份工作台是下一次开发的入口</h2><p>本轮以 2026-11-12 本地 Figma 导出为主，结合 App 当前源码、主题和原有素材。所有设计数据与源码均可在项目内直接读取，不需要持续调用 Figma MCP。</p><div class="source-counter"><div><strong>${c.screens}</strong><span>原有页面 / 状态</span></div><div><strong>${c.proposals}</strong><span>提案画框</span></div><div><strong>${c.components}</strong><span>主组件</span></div><div><strong>${doc.variables.length}</strong><span>颜色变量</span></div></div><h2>保存与修改</h2><p>选择图层后，可修改文字、位置、尺寸、颜色、透明度、圆角与图片；主组件的显式属性可同步到对应实例。变更先自动保存为浏览器草稿，“保存到项目”会更新 <code>design.json</code> 和 <code>design-data.js</code>。</p><p>下次开发先读取 <code>README.md</code>、<code>design.json</code> 与 <code>changes.json</code>。<code>source/figma-export-2026-11-12.json</code> 是不变的原始快照。不能把浏览器独有的未保存草稿当作项目最新规范。</p><h2>页面与 App 路由</h2><div class="table-wrap"><table><thead><tr><th>画框</th><th>路由</th><th>App 源码</th></tr></thead><tbody>${doc.workbench.routes.map(r=>`<tr><td><a href="#screen/${encodeURIComponent(r.frameId)}">${esc(node(r.frameId)?.name)}</a><br><code>${esc(r.frameId)}</code></td><td><code>${esc(r.route)}</code></td><td><code>${esc(r.path)}</code></td></tr>`).join('')}</tbody></table></div><h2>Figma 与 App 的已知差异</h2>${doc.workbench.differences.map(d=>`<section class="difference"><h3>${esc(d.name)}</h3><p><strong>Figma：</strong>${esc(d.figma)}</p><p><strong>App：</strong>${esc(d.app)}</p><p>${esc(d.status)}</p><code>${esc(d.source)}</code></section>`).join('')}<h2>当前 App 颜色参考</h2><p>以下为本轮读取的 App 源码值。工作台画布仍以 Figma 变量为准。</p><div class="table-wrap"><table><thead><tr><th>语义</th><th>App 浅色</th><th>App 深色</th></tr></thead><tbody>${Object.keys(doc.workbench.appColors.light).map(k=>`<tr><td>${esc(k)}</td><td><code>${esc(doc.workbench.appColors.light[k])}</code></td><td><code>${esc(doc.workbench.appColors.dark[k])}</code></td></tr>`).join('')}</tbody></table></div><h2>已补齐与待核对</h2><p>原始导出报告共 90 条提示，其中 51 个矢量导出失败，位于 ${doc.workbench.recoveredIconContainers.length} 个图标容器；现已使用 App 同源 SVG 补齐。原稿每个图层、组件引用和原始参数均保留。</p><ul>${doc.workbench.limitations.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><details><summary>查看原始导出提示（${doc.warnings.length}）</summary><ul>${doc.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></details><h2>来源完整性</h2><p>适用平台：Android 设计参考。数据为设计示例，不连接业务账号。页面迁移已获用户授权；尚未应用回 App。</p><code>Figma 文件：${doc.workbench.figmaFileKey}<br>原始 JSON SHA-256：${doc.workbench.originalSha256}<br>日期：2026-11-12 · Asia/Shanghai</code>`;canvas.append(el);
  }
  async function copy(value){try{await navigator.clipboard.writeText(value);toast('已复制');}catch{download('zhixian-layer.txt',value,'text/plain');toast('已下载为文本');}}
  function specText(id){const n=effective(id),f=byId(id);return `# ${n.name}\n\nFigma 节点：${n.id}\n平台：Android\n状态：${f?.status||'工作台修改'}\n画框：${n.width} × ${n.height}\nApp 路由：${f?.route||'代表性状态或组件'}\n\n以 design.json 中的原始图层及 workbench.edits 合并结果为准。绑定变量从 variables 解析，不将全部颜色写成局部常量。图标使用 assets/icons，角色使用 assets/app。\n\n`+JSON.stringify(n,null,2);}
  function copySpec(id){copy(specText(id));}
  function compiled(){const d=structuredClone(doc);d.workbench.edits={nodes:{...sourceEdits.nodes,...edits.nodes},variables:{...sourceEdits.variables,...edits.variables}};d.workbench.editedAt=new Date().toISOString();return d;}
  function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  function tokenCSS(){return ':root {\n'+doc.variables.map(v=>`  --${v.name.replace('深色/','dark-')}: ${DesignRenderer.rgba(renderer.variable(v.id))};`).join('\n')+'\n}\n';}
  function handoffText(){const d=compiled();return `# 知闲 App 设计工作台\n\n更新：${d.workbench.editedAt}\n\n以 design.json 为设计数据源，将 workbench.edits.nodes 合并到对应 ID 的图层；workbench.edits.variables 覆盖同 ID 变量。显式主组件修改按 mainComponentId 与实例子图层后缀传播，实例单独修改优先。\n\n页面以 Figma 为主；4 个 proposal 是待确认提案。React Native App 尚未应用这些修改。\n\n## 页面映射\n\n${d.workbench.routes.map(r=>`- ${r.route} → ${r.frameId} → ${r.path}`).join('\n')}\n\n## 渲染限制\n\n${d.workbench.limitations.map(x=>'- '+x).join('\n')}\n\n## 本轮修改\n\n\`\`\`json\n${JSON.stringify(d.workbench.edits,null,2)}\n\`\`\`\n`;}
  async function selfContained(){
    if(location.protocol==='file:'){const dom=document.documentElement.cloneNode(true);const state=[...dom.querySelectorAll('script')].find(s=>s.textContent.startsWith('window.ZHIXIAN_DESIGN='));if(state){state.textContent='window.ZHIXIAN_DESIGN='+JSON.stringify(compiled()).replace(/</g,'\\u003c')+';window.ZHIXIAN_INLINE_ICONS='+JSON.stringify(window.ZHIXIAN_INLINE_ICONS||{})+';';dom.querySelector('#export-dialog').removeAttribute('open');download('zhixian-design-workbench.html','<!doctype html>\n'+dom.outerHTML,'text/html');toast('已下载包含修改的独立 HTML');return;}}
    const b=$('#export-html');b.disabled=true;b.textContent='正在打包素材…';
    try{
      const d=compiled(),paths=new Set();for(const n of renderer.nodes.values()){if(n.asset)paths.add(n.asset);if(n.iconAsset)paths.add(n.iconAsset);}Object.values(d.assets).forEach(p=>paths.add(p));d.workbench.assetLibrary.forEach(a=>paths.add(a.path));Object.values(d.workbench.edits?.nodes||{}).forEach(n=>{if(n.iconAsset)paths.add(n.iconAsset);if(n.asset)paths.add(n.asset);});
      const embedded={};await Promise.all([...paths].map(async path=>{if(path.startsWith('data:')){embedded[path]=path;return;}const r=await fetch(path);if(!r.ok)throw new Error('素材读取失败：'+path);const blob=await r.blob();embedded[path]=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);});}));
      function replace(n){if(n.asset)n.asset=embedded[n.asset]||n.asset;if(n.iconAsset)n.iconAsset=embedded[n.iconAsset]||n.iconAsset;(n.children||[]).forEach(replace);}d.pages.forEach(replace);Object.values(d.workbench.edits?.nodes||{}).forEach(replace);for(const k in d.assets)d.assets[k]=embedded[d.assets[k]]||d.assets[k];d.workbench.assetLibrary.forEach(a=>a.path=embedded[a.path]||a.path);
      let css=await (await fetch('workbench.css')).text();const font=await fetch('assets/fonts/NotoSansSC-VF.ttf');if(font.ok){const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);font.blob().then(blob=>reader.readAsDataURL(blob));});css=css.replace('assets/fonts/NotoSansSC-VF.ttf',data);}
      // Inline UI icon paths as well, so the application shell works offline.
      const uiIcons={};for(const name of ['list','wordbooks','filter','attachment','text','search','back','forward','more','check-circle']){const path='assets/icons/'+name+'.svg';uiIcons[path]=embedded[path]||await (async()=>{const r=await fetch(path);return 'data:image/svg+xml;base64,'+btoa(await r.text());})();}
      let app=await (await fetch('app.js')).text();const inlineIcons=Object.fromEntries(Object.entries(uiIcons).map(([path,data])=>[path.split('/').pop().replace('.svg',''),data]));app='window.ZHIXIAN_INLINE_ICONS='+JSON.stringify(inlineIcons)+';\n'+app;
      const rr=await(await fetch('renderer.js')).text();const dom=document.documentElement.cloneNode(true);dom.querySelectorAll('script,link[rel=stylesheet]').forEach(n=>n.remove());dom.querySelector('#export-dialog').removeAttribute('open');const style=document.createElement('style');style.textContent=css;dom.querySelector('head').append(style);
      dom.querySelectorAll('img').forEach(img=>{const raw=img.getAttribute('src');if(embedded[raw])img.setAttribute('src',embedded[raw]);});
      const rawData=JSON.stringify(d).replace(/</g,'\\u003c');const html='<!doctype html>\n'+dom.outerHTML.replace('</body>',()=>`<script>window.ZHIXIAN_DESIGN=${rawData};<\/script><script>${rr.replace(/<\/script/gi,'<\\/script')}<\/script><script>${app.replace(/<\/script/gi,'<\\/script')}<\/script></body>`);
      download('zhixian-design-workbench.html',html,'text/html');toast('已下载独立 HTML，包含设计与素材');
    }catch(e){toast('打包失败：'+e.message+'。请通过本地启动器打开后重试。');}finally{b.disabled=false;b.textContent='下载独立 HTML';}
  }
  async function saveProject(){if(!localServer){download('zhixian-design.json',JSON.stringify(compiled(),null,2),'application/json');toast('已导出修改。请在本地仓库导入、保存并提交推送。');return;}const button=$('#save');button.disabled=true;try{const response=await fetch('/api/design',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(compiled())});if(!response.ok)throw new Error(await response.text());const result=await response.json();$('#save-status').textContent='已保存到项目';toast('已更新 design.json 与开发交接记录');}catch(e){$('#save-status').textContent='项目未保存';toast('保存失败。请用本地启动器打开，或导出完整 JSON。');}finally{button.disabled=false;}}
  $('#menu-toggle').innerHTML=icon('list');$('#search-icon').innerHTML=icon('search');$('#undo').innerHTML=icon('back');$('#redo').innerHTML=icon('forward');
  $('#undo').onclick=()=>history('undo');$('#redo').onclick=()=>history('redo');$('#save').onclick=saveProject;
  $('#export').onclick=()=>$('#export-dialog').showModal();$('#export-json').onclick=()=>download('zhixian-design.json',JSON.stringify(compiled(),null,2),'application/json');$('#export-css').onclick=()=>download('zhixian-tokens.css',tokenCSS(),'text/css');$('#export-spec').onclick=()=>download('ZHIXIAN-DESIGN.md',handoffText(),'text/markdown');$('#export-html').onclick=selfContained;
  $('#overview').onclick=()=>location.hash=view;$('#show-all').onclick=()=>{focusFrame=null;pageFilter=null;search='';$('#search').value='';theme='all';$('#theme-filter').value='all';location.hash=view;renderNavigation();renderCanvas();};
  $('#zoom').onchange=e=>{zoom=Number(e.target.value);renderCanvas();};$('#theme-filter').onchange=e=>{theme=e.target.value;renderCanvas();};
  $('#search').oninput=e=>{search=e.target.value;focusFrame=null;renderNavigation();renderCanvas();};
  $('#menu-toggle').onclick=()=>{if(innerWidth<=850)$('#sidebar').classList.toggle('open');else document.body.classList.toggle('sidebar-collapsed');};
  $('#properties-tab').onclick=()=>{$('#properties').hidden=false;$('#layers').hidden=true;$('#properties-tab').classList.add('active');$('#layers-tab').classList.remove('active');$('#properties-tab').setAttribute('aria-pressed','true');$('#layers-tab').setAttribute('aria-pressed','false');};
  $('#layers-tab').onclick=()=>{$('#properties').hidden=true;$('#layers').hidden=false;$('#layers-tab').classList.add('active');$('#properties-tab').classList.remove('active');$('#layers-tab').setAttribute('aria-pressed','true');$('#properties-tab').setAttribute('aria-pressed','false');};
  $('#canvas').addEventListener('select-layer',e=>select(e.detail));
  $('#import').onclick=()=>$('#import-file').click();$('#import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const incoming=JSON.parse(await file.text());if(!Array.isArray(incoming.pages)||!Array.isArray(incoming.variables)||!incoming.workbench?.frames)throw new Error('请选择从此工作台导出的完整设计 JSON；新的 Figma 导出请用 import_figma.py 处理');doc=incoming;window.ZHIXIAN_DESIGN=doc;KEY='zhixian-workbench-v1:'+doc.workbench.originalSha256;Object.keys(sourceEdits.nodes).forEach(k=>delete sourceEdits.nodes[k]);Object.assign(sourceEdits.nodes,doc.workbench.edits?.nodes||{});Object.keys(sourceEdits.variables).forEach(k=>delete sourceEdits.variables[k]);Object.assign(sourceEdits.variables,doc.workbench.edits?.variables||{});edits={nodes:{},variables:{}};undo=[];redo=[];refreshRenderer();saveDraft();showView('pages');toast('设计已导入，请保存到项目');}catch(err){toast(err.message);}e.target.value='';};
  document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();history(e.shiftKey?'redo':'undo');}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveProject();}});
  if(!localServer){$('#save').textContent='导出修改文件';$('#save').title='线上修改保存在此浏览器；下载后在本地仓库导入并提交';document.querySelector('#export-dialog .hint').textContent='线上草稿仅保存在当前浏览器。下载设计 JSON 后，在本地仓库导入、保存并提交推送。';}
  window.addEventListener('hashchange',route);route();$('#save-status').textContent=Object.keys(edits.nodes).length||Object.keys(edits.variables).length?'已恢复浏览器草稿':'已载入项目文件';$('#undo').disabled=!undo.length;
  window.Workbench={get document(){return compiled();},get renderer(){return renderer;},get edits(){return edits;},change,select,renderCanvas,tokenCSS};
})();
