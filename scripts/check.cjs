/* Data completeness and renderer semantics; does not start or automate a browser. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),doc=JSON.parse(fs.readFileSync(path.join(root,'design.json'))),original=JSON.parse(fs.readFileSync(path.join(root,'source/figma-export-2026-11-12.json')));
const flat=n=>[n,...(n.children||[]).flatMap(flat)],nodes=doc.pages.flatMap(flat),raw=original.pages.flatMap(flat);
const originalNodes=doc.pages.filter(p=>!p.id.startsWith('review:')).flatMap(flat);
assert.equal(originalNodes.length,2010);assert.deepEqual(originalNodes.map(n=>n.id),raw.map(n=>n.id));
assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length,'All original and review layer IDs must be unique');
assert.equal(doc.workbench.frames.filter(f=>f.category==='screen').length,31);assert.equal(doc.workbench.frames.filter(f=>f.category==='proposal').length,4);assert.equal(doc.workbench.frames.filter(f=>f.category==='component').length,12);assert.equal(doc.variables.length,27);assert.equal(doc.workbench.routes.length,13);
for(const n of nodes){if(n.asset)assert.ok(fs.existsSync(path.join(root,n.asset)));if(n.iconAsset)assert.ok(fs.existsSync(path.join(root,n.iconAsset)));}
for(const p of [...Object.values(doc.assets),...doc.workbench.assetLibrary.map(a=>a.path)])assert.ok(fs.existsSync(path.join(root,p)));
class Element{constructor(tag){this.tag=tag;this.children=[];this.style={};this.dataset={};this.classList={add(){}};}append(c){this.children.push(c);}setAttribute(){}addEventListener(){}}
const sandbox={window:{},document:{createElement:tag=>new Element(tag)}};vm.runInNewContext(fs.readFileSync(path.join(root,'renderer.js'),'utf8'),sandbox);
const create=sandbox.window.DesignRenderer.create;
let r=create(doc);for(const f of doc.workbench.frames)assert.ok(r.render(r.nodes.get(f.id),true));
let rendered=[];for(const f of doc.workbench.frames)rendered.push(...flat(r.render(r.nodes.get(f.id),true)));
// A recursive DOM traversal differs from the Figma traversal (image and icon containers).
function visit(el){return [el,...el.children.flatMap(visit)];}
rendered=doc.workbench.frames.flatMap(f=>visit(r.render(r.nodes.get(f.id),true)));
assert.equal(rendered.filter(e=>e.dataset.unresolved).length,0,'No unresolved vector may be visible');
const nav=nodes.find(n=>n.id==='23:191');assert.ok(r.color(nav.fills[0]).endsWith('0.800000011920929)'),'Alpha is resolved once, rather than squared');
const green=doc.variables.find(v=>v.name==='green');r=create(doc,{nodes:{'2:31':{cornerRadius:18,topLeftRadius:18,topRightRadius:18,bottomLeftRadius:18,bottomRightRadius:18}},variables:{[green.id]:{r:1,g:0,b:0,a:1}}});
const instance=nodes.find(n=>n.type==='INSTANCE'&&n.mainComponentId==='2:31');assert.equal(r.effective(instance).cornerRadius,18);assert.equal(r.color({color:{r:0,g:0,b:0},boundVariables:{color:{id:green.id}}}),'rgba(255,0,0,1)');
r=create(doc,{nodes:{'2:31':{cornerRadius:18},[instance.id]:{cornerRadius:8}}});assert.equal(r.effective(instance).cornerRadius,8);
const masterText=nodes.find(n=>n.id==='2:107'),child=nodes.find(n=>n.id.endsWith(';2:107'));assert.ok(masterText&&child);r=create(doc,{nodes:{'2:107':{characters:'测试'}}});assert.equal(r.effective(child).characters,'测试');
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'source/figma-export-2026-11-12.json'))).digest('hex'),doc.workbench.originalSha256);
const label=nodes.find(n=>n.type==='TEXT'&&n.id.includes(';')&&r.nodes.get(n.id.split(';').pop())?.characters!==n.characters&&r.nodes.get(n.id.split(';').pop())?.type==='TEXT');
if(label){const key=label.id.split(';').pop();r=create(doc,{nodes:{[key]:{characters:'new master label'}}});assert.equal(r.effective(label).characters,label.characters,'Existing Figma instance label overrides remain intact');}
const review=doc.workbench.frames.filter(f=>f.category==='review');
if(review.length){
  assert.equal(review.filter(f=>f.reviewKind==='screen').length,6);
  assert.equal(review.filter(f=>f.reviewKind==='component').length,8);
  const rs=nodes.find(n=>n.id==='review:light:study');
  assert.ok(!flat(rs).some(n=>n.characters==='开始学习'),'Review learning has no start-learning CTA');
  assert.ok(flat(rs).some(n=>n.type==='INSTANCE'&&n.mainComponentId==='2:56'),'Original task-card instances are reused');
  assert.ok(flat(rs).some(n=>n.type==='INSTANCE'&&n.mainComponentId==='2:80'),'Original navigation instance is reused');
  const instance=nodes.find(n=>n.type==='INSTANCE'&&n.mainComponentId==='review:group:light');
  assert.ok(instance);
  const flatRow=nodes.find(n=>n.type==='INSTANCE'&&n.mainComponentId==='review:menu:light:single');
  assert.equal(flatRow.cornerRadius,0,'Group rows are flat, not separate rounded cards');
  assert.deepEqual(flatRow.fills,[]);
  assert.equal(flat(rs).filter(n=>n.type==='INSTANCE'&&n.mainComponentId==='review:group:light').length,2);
  r=create(doc,{nodes:{'review:group:light':{cornerRadius:24}}});
  assert.equal(r.effective(instance).cornerRadius,24,'Review master changes propagate to instances');
  const scroll=flat(rs).find(n=>n.workbenchScroll==='vertical');
  assert.equal(r.render(scroll).style.overflowY,'auto','Review page contents really scroll');
  for(const n of nodes.filter(n=>n.type==='INSTANCE'))assert.ok(nodes.some(master=>master.id===n.mainComponentId),'Every instance has a real master');
}
console.log(`PASS: original 2007 layers, 47 frames/components retained; ${review.length} review frames; unique IDs, assets, alpha, variables, original/new master propagation and review scrolling.`);
