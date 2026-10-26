const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const sections=json('_data/microbiology_sections.json');
const added=json('_data/microbiology_resources.json');
const prior=json('_data/professional_resources.json');
const tools=json('_data/online_tools.json');

test('five expected clinical microbiology categories exist',()=>{
 assert.deepEqual(sections.map(x=>x.id),['identification','culture','ast','microscopy','genomics']);
 for(const item of sections)assert.ok(item.name_zh&&item.name_en&&item.intro_zh&&item.intro_en);
});
test('seven priority items and twelve secondary items are retained',()=>{
 assert.equal(added.filter(x=>x.priority==='secondary').length,12);
 assert.equal(added.filter(x=>!x.priority).length,7);
 for(const slug of ['microid-lab-guide','ontario-virtual-lab','bacdive-api-test-finder','mediadive','mycology-online','eucast-mic-distributions','whonet']){
  assert.ok(added.some(x=>x.slug===slug),slug);
 }
});
test('all resources have unique slug, valid category and supported data model',()=>{
 assert.equal(new Set(added.map(x=>x.slug)).size,added.length);
 for(const x of added){
  assert.ok(sections.some(s=>s.id===x.group),x.slug+' group');
  assert.ok(['web','guide','database','source','desktop'].includes(x.mode),x.slug+' mode');
  for(const k of ['name','provider','kind_zh','kind_en','description_zh','description_en','note_zh','note_en','url']) assert.ok(x[k],x.slug+' '+k);
 }
});
test('every new public URL is HTTPS and source and research links are valid',()=>{
 for(const x of added)for(const key of ['url','source','research']){
  if(!x[key])continue;
  const uri=new URL(x[key]);
  assert.equal(uri.protocol,'https:',x.slug+' '+key);
  assert.ok(uri.hostname.includes('.'),x.slug+' '+key);
 }
});
test('existing lab-developed CFU, AST and Gram Stain tools remain available',()=>{
 const diag=tools.filter(x=>x.function_group==='diagnostics');
 for(const slug of ['web-cfu-lite','web-ast','web-gram-stain','web-gel-external','web-lfa-external']) assert.ok(diag.some(x=>x.slug===slug),slug);
 const page=read('resources/diagnostics.html');
 assert.ok(page.includes('site.data.online_tools'));
 assert.ok(page.includes('resource-tool-card.html'));
});
test('existing clinical references each belong to one method section',()=>{
 const records=prior.filter(x=>x.function_group==='diagnostics');
 assert.equal(records.length,4);
 for(const r of records)assert.ok(sections.some(s=>s.id===r.micro_group),r.slug+' not assigned');
});
test('diagnostics page renders new and old references and follows central navigation',()=>{
 const page=read('resources/diagnostics.html');
 assert.ok(page.includes('site.data.microbiology_sections'));
 assert.ok(page.includes('site.data.microbiology_resources'));
 assert.ok(page.includes('where: "group", section.id'));
 assert.ok(page.includes('resource-professional-card.html'));
 assert.ok(page.includes('microbiology-resource-card.html'));
 assert.ok(page.includes('microbiology-jump-nav'));
});
test('resources home count includes new microbiology resources',()=>{
 const page=read('courses.html');
 assert.ok(page.includes('site.data.microbiology_resources.size'));
 assert.ok(read('online-tools.css').includes('@media(max-width:760px){.microbiology-resource-grid{grid-template-columns:1fr'));
});
test('WHONET and other resources are not misrepresented as open source or clinical diagnoses',()=>{
 const whonet=added.find(x=>x.slug==='whonet');
 assert.equal(whonet.mode,'desktop');
 assert.ok(whonet.note_zh.includes('不等於開源'));
 const mic=added.find(x=>x.slug==='eucast-mic-distributions');
 assert.ok(mic.note_zh.includes('不代表抗藥率'));
 const page=read('resources/diagnostics.html');
 assert.ok(page.includes('EUCAST MIC 分布不能當作各地抗藥率'));
});
