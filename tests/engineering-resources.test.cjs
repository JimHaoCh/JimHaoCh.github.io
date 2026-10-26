const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const physics=require('../assets/js/microfluidic-physics.js');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const data=file=>JSON.parse(read('_data/'+file));
const base={widthUm:200,heightUm:50,lengthMm:20,flowUlMin:5,viscosityMpas:1,densityKgM3:997,diffusionUm2S:500};
const near=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),actual+' vs '+expected);
test('reference geometry produces known velocity, diameter, Re and residence',()=>{
 const r=physics.calculate(base);
 near(r.meanVelocityMmS,8.333333333333334);
 near(r.hydraulicDiameterUm,80);
 near(r.reynolds,0.6646666666666666);
 near(r.residenceS,2.4);
 near(r.diffusionAcrossHeightS,2.5);
 assert.ok(r.pressureKPa>0);
});
test('square channel agrees with canonical analytic flow resistance',()=>{
 const r=physics.calculate({...base,widthUm:100,heightUm:100,lengthMm:1,flowUlMin:1});
 const analytic=28.454*0.001*0.001/(0.0001**4);
 assert.ok(Math.abs(r.resistancePaSM3/analytic-1)<0.0004);
});
test('swapping width and height preserves hydraulic pressure result',()=>{
 const a=physics.calculate(base);
 const b=physics.calculate({...base,widthUm:base.heightUm,heightUm:base.widthUm});
 near(a.pressureKPa,b.pressureKPa);
 near(a.hydraulicDiameterUm,b.hydraulicDiameterUm);
 near(a.reynolds,b.reynolds);
});
test('pressure scales with length, viscosity and flow independently',()=>{
 const a=physics.calculate(base);
 near(physics.calculate({...base,flowUlMin:10}).pressureKPa,2*a.pressureKPa);
 near(physics.calculate({...base,lengthMm:40}).pressureKPa,2*a.pressureKPa);
 near(physics.calculate({...base,viscosityMpas:2}).pressureKPa,2*a.pressureKPa);
});
test('diffusion characteristic time follows height squared and inverse D',()=>{
 const a=physics.calculate(base);
 near(physics.calculate({...base,diffusionUm2S:1000}).diffusionAcrossHeightS,a.diffusionAcrossHeightS/2);
 near(physics.calculate({...base,heightUm:100}).diffusionAcrossHeightS,4*a.diffusionAcrossHeightS);
});
test('invalid, zero, missing and nonfinite inputs rejected',()=>{
 for(const key of Object.keys(base)){
   for(const invalid of [0,-1,Number.NaN,Number.POSITIVE_INFINITY,'']) {
     assert.throws(()=>physics.calculate({...base,[key]:invalid}),RangeError,key+'='+String(invalid));
   }
 }
});
test('seven engineering teaching references are logically grouped and all URLs HTTPS',()=>{
 const sections=data('engineering_sections.json');
 const items=data('engineering_resources.json');
 assert.deepEqual(sections.map(s=>s.id),['mechanical','microfabrication','manufacturing','simulation','automation']);
 assert.equal(items.length,17);
 assert.equal(new Set(items.map(i=>i.slug)).size,items.length);
 for(const item of items){
  assert.ok(sections.some(s=>s.id===item.group),'Invalid group '+item.slug);
  assert.ok(['https:'].includes(new URL(item.url).protocol),'Insecure URL');
  assert.ok(item.name&&item.provider&&item.description_zh&&item.description_en&&item.mode_zh&&item.license&&item.notice_zh);
 }
});
test('existing CAD, third-party education software, lab NE501 and calculator are linked',()=>{
 const eng=read('resources/engineering.html');
 const hub=read('courses.html');
 const calc=read('resources/microfluidic-calculator.html');
 assert.ok(eng.includes('site.data.engineering_resources'));
 assert.ok(eng.includes('site.data.online_tools'));
 assert.ok(eng.includes('site.data.external_software'));
 assert.ok(eng.includes('site.data.lab_software'));
 assert.ok(eng.includes('/resources/microfluidic-calculator.html'));
 assert.ok(hub.includes('site.data.engineering_resources.size'));
 assert.ok(calc.includes('microfluidic-physics.js'));
 assert.ok(calc.includes('microfluidic-calculator.js'));
});
