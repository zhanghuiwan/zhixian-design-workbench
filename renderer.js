/* Coordinate-faithful Figma layers. No framework or network dependencies. */
(function () {
  const number = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const rgba = c => c ? `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${c.a ?? 1})` : 'transparent';
  const hex = c => '#' + ['r','g','b'].map(k => Math.round((c?.[k]||0)*255).toString(16).padStart(2,'0')).join('');
  function createRenderer(doc, edits = {}) {
    const nodes = new Map(), parents = new Map(), variables = new Map(doc.variables.map(v => [v.id,v]));
    function index(n, p) { nodes.set(n.id,n); if(p) parents.set(n.id,p); (n.children||[]).forEach(c=>index(c,n)); }
    doc.pages.forEach(p=>index(p));
    function effective(n) {
      // Explicit master edits flow into instances through Figma's preserved child IDs.
      let master = {}, key=n.id.includes(';') ? n.id.split(';').pop() : null;
      const inherited=(original,patch)=>Object.fromEntries(Object.entries(patch||{}).filter(([prop])=>JSON.stringify(n[prop])===JSON.stringify(original?.[prop])));
      if(key && edits.nodes?.[key]) master=inherited(nodes.get(key),edits.nodes[key]);
      if(n.type==='INSTANCE' && edits.nodes?.[n.mainComponentId]) {
        master=inherited(nodes.get(n.mainComponentId),edits.nodes[n.mainComponentId]);delete master.x;delete master.y;delete master.name;
      }
      return {...n,...master,...edits.nodes?.[n.id]};
    }
    function variable(id, seen = new Set()) {
      if(seen.has(id)) return null;seen.add(id);
      if(edits.variables?.[id]) return edits.variables[id];
      const v=variables.get(id); if(!v)return null;
      const mode=doc.activeModes?.[v.variableCollectionId]||v.defaultModeId||Object.keys(v.valuesByMode)[0];
      const value=v.valuesByMode[mode]??Object.values(v.valuesByMode)[0];
      return value?.type==='VARIABLE_ALIAS'?variable(value.id,seen):value;
    }
    function color(p) {
      const bound=variable(p?.boundVariables?.color?.id);
      const c=bound||p?.color;
      return c?rgba({...c,a:bound?.a??((c.a??1)*(p?.opacity??1))}):'transparent';
    }
    function firstPaint(n) {
      const q=[n];while(q.length){const x=effective(q.shift());const p=[...(x.strokes||[]),...(x.fills||[])].find(p=>p.type==='SOLID'&&p.visible!==false);if(p)return color(p);q.push(...x.children||[]);}return '#202320';
    }
    const fontWeight = n => n.fontWeight||n.fontName?.variationSettings?.wght||({Bold:700,Medium:500,Semibold:600}[n.fontName?.style])||400;
    function textStyle(el,n) {
      const first=n.segments?.[0]||{};
      el.style.fontFamily='"Workbench Noto", "Noto Sans SC", "PingFang SC", system-ui, sans-serif';
      el.style.fontSize=number(n.fontSize,first.fontSize||14)+'px';
      el.style.fontWeight=fontWeight(n);
      const lh=n.lineHeight||first.lineHeight;
      el.style.lineHeight=lh?.unit==='PIXELS'?lh.value+'px':lh?.unit==='PERCENT'?lh.value/100:1.45;
      const ls=n.letterSpacing||first.letterSpacing;
      el.style.letterSpacing=ls?.unit==='PERCENT'?ls.value/100+'em':number(ls?.value)+'px';
      el.style.textAlign=(n.textAlignHorizontal||'LEFT').toLowerCase();
      if(n.textDecoration==='UNDERLINE')el.style.textDecoration='underline';
      if(n.textDecoration==='STRIKETHROUGH')el.style.textDecoration='line-through';
      if(n.textCase==='UPPER')el.style.textTransform='uppercase';
      if(n.textCase==='LOWER')el.style.textTransform='lowercase';
      el.style.color=color((n.fills||[]).find(p=>p.type==='SOLID'&&p.visible!==false));
    }
    function render(raw, root = false, editable = true) {
      const n=effective(raw), el=document.createElement('div'); el.className='design-node';el.dataset.nodeId=n.id;
      el.dataset.nodeType=n.type||'PAGE';el.setAttribute('aria-label',n.name||n.id);
      Object.assign(el.style,{position:'absolute',boxSizing:'border-box',width:number(n.width)+'px',height:number(n.height)+'px',opacity:n.opacity??1,display:n.visible===false?'none':'block'});
      if(!root){
        const t=n.relativeTransform;
        if(t && n.rotation && !edits.nodes?.[n.id]?.x && !edits.nodes?.[n.id]?.y)el.style.transform=`matrix(${t[0][0]},${t[1][0]},${t[0][1]},${t[1][1]},${t[0][2]},${t[1][2]})`;
        else {el.style.left=number(n.x)+'px';el.style.top=number(n.y)+'px';if(n.rotation)el.style.transform=`rotate(${-n.rotation}deg)`;}
      }
      el.style.transformOrigin='0 0';
      el.style.borderRadius=n.type==='ELLIPSE'?'50%': [n.topLeftRadius??n.cornerRadius??0,n.topRightRadius??n.cornerRadius??0,n.bottomRightRadius??n.cornerRadius??0,n.bottomLeftRadius??n.cornerRadius??0].map(v=>number(v)+'px').join(' ');
      if(n.clipsContent)el.style.overflow='hidden';
      const shadows=[];
      for(const e of n.effects||[]){if(e.visible===false)continue;if(e.type==='DROP_SHADOW'||e.type==='INNER_SHADOW')shadows.push(`${e.type==='INNER_SHADOW'?'inset ':''}${e.offset?.x||0}px ${e.offset?.y||0}px ${e.radius||0}px ${e.spread||0}px ${rgba(e.color)}`);if(e.type==='GLASS'||e.type==='BACKGROUND_BLUR'){el.style.backdropFilter=`blur(${e.radius||12}px)`;el.style.webkitBackdropFilter=el.style.backdropFilter;}}
      if(shadows.length)el.style.boxShadow=shadows.join(',');
      const fills=(n.fills||[]).filter(p=>p.visible!==false);const solid=fills.find(p=>p.type==='SOLID');
      if(solid && n.type!=='TEXT' && n.type!=='VECTOR')el.style.background=color(solid);
      const stroke=(n.strokes||[]).find(p=>p.visible!==false&&p.type==='SOLID');
      if(stroke && n.type!=='VECTOR'){
        const sw=number(n.strokeWeight,1);const rule=`${sw}px ${n.dashPattern?.length?'dashed':'solid'} ${color(stroke)}`;
        // Outline keeps inner geometry intact; Figma uses border-box-sized strokes.
        if(n.strokeAlign==='OUTSIDE'){el.style.outline=rule;el.style.outlineOffset='0';}
        else if(n.strokeAlign==='CENTER'){el.style.outline=rule;el.style.outlineOffset=(-sw/2)+'px';}
        else {el.style.outline=rule;el.style.outlineOffset=(-sw)+'px';}
      }
      if(n.type==='TEXT') {
        textStyle(el,n);el.classList.add('design-text');el.style.whiteSpace=n.textAutoResize==='WIDTH_AND_HEIGHT'?'pre':'pre-wrap';el.style.overflowWrap=n.textAutoResize==='WIDTH_AND_HEIGHT'?'normal':'anywhere';
        if(n.textAlignVertical && n.textAlignVertical!=='TOP'){el.style.display='flex';el.style.flexDirection='column';el.style.justifyContent=n.textAlignVertical==='CENTER'?'center':'flex-end';}
        const content=document.createElement('span');content.className='text-content';
        const own=edits.nodes?.[n.id]||edits.nodes?.[n.id.split(';').pop()];
        if(n.segments?.length>1 && !own?.characters && !own?.fills && !own?.fontSize){for(const seg of n.segments){const s=document.createElement('span');s.textContent=seg.characters;textStyle(s,{...n,...seg});content.append(s);}}
        else content.textContent=n.characters||'';el.append(content);
      } else if(n.iconAsset) {
        const icon=document.createElement('div');icon.className='icon-shape';const path=n.iconAsset;
        Object.assign(icon.style,{width:'100%',height:'100%',backgroundColor:firstPaint(n),mask:`url("${path}") center / contain no-repeat`,webkitMask:`url("${path}") center / contain no-repeat`,pointerEvents:'none'});el.append(icon);
      } else {
        const image=fills.find(p=>p.type==='IMAGE');
        if(image && doc.assets[image.imageHash]){
          const img=document.createElement('img');img.alt=n.name;img.draggable=false;img.src=doc.assets[image.imageHash];
          Object.assign(img.style,{width:'100%',height:'100%',objectFit:image.scaleMode==='FIT'?'contain':image.scaleMode==='FILL'?'cover':'fill',opacity:image.opacity??1,pointerEvents:'none'});el.append(img);
        } else if(n.type==='VECTOR' && n.asset){const img=document.createElement('img');img.src=n.asset;img.alt=n.name;img.draggable=false;img.style.cssText='width:100%;height:100%;display:block;pointer-events:none';el.append(img);}
        else if(n.type==='VECTOR'&&!n.asset){el.dataset.unresolved='true';}
        else if(n.type==='ELLIPSE' && n.asset && !solid){const img=document.createElement('img');img.src=n.asset;img.alt=n.name;img.style.cssText='width:100%;height:100%;pointer-events:none';el.append(img);}
        else for(const c of n.children||[])el.append(render(c,false,editable));
      }
      if(editable)el.addEventListener('click',e=>{e.stopPropagation();el.dispatchEvent(new CustomEvent('select-layer',{detail:n.id,bubbles:true}));});
      return el;
    }
    return {nodes,parents,effective,variable,color,render,hex,rgba};
  }
  window.DesignRenderer={create:createRenderer,hex,rgba};
})();
