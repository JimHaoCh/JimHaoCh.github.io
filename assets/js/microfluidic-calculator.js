(() => {
  'use strict';
  const form=document.getElementById('microfluidic-form');
  if(!form || !window.MicrofluidicPhysics) return;
  const resultBox=document.getElementById('microfluidic-results');
  const status=document.getElementById('microfluidic-advisory');
  const error=document.getElementById('microfluidic-error');
  const defaults={widthUm:'200',heightUm:'50',lengthMm:'20',flowUlMin:'5',viscosityMpas:'1',densityKgM3:'997',diffusionUm2S:'500'};
  const fmt=(v,digits=4)=>!Number.isFinite(v)?'—':Number(v).toLocaleString('en-US',{maximumSignificantDigits:digits});
  function resultCard(zh,en,value,unit){
    const item=document.createElement('div');item.className='engineering-calc-result';
    const label=document.createElement('p');label.textContent=zh;
    const enSpan=document.createElement('span');enSpan.lang='en';enSpan.textContent=en;label.append(enSpan);
    const output=document.createElement('strong');output.textContent=fmt(value)+' '+unit;
    item.append(label,output);return item;
  }
  function calculate(){
    error.hidden=true;
    try{
      const values={};
      for(const name of Object.keys(defaults)){
        const input=form.elements.namedItem(name);
        if(!input || input.value.trim()===''||!input.checkValidity())throw new RangeError(name+' is missing or invalid');
        values[name]=Number(input.value);
      }
      const r=window.MicrofluidicPhysics.calculate(values);
      resultBox.replaceChildren(
        resultCard('平均流速','Mean velocity',r.meanVelocityMmS,'mm/s'),
        resultCard('雷諾數','Reynolds number',r.reynolds,''),
        resultCard('水力直徑','Hydraulic diameter',r.hydraulicDiameterUm,'µm'),
        resultCard('壓降','Pressure drop',r.pressureKPa,'kPa'),
        resultCard('水力流阻','Hydraulic resistance',r.resistancePaSM3,'Pa·s/m³'),
        resultCard('流道停留時間','Residence time',r.residenceS,'s'),
        resultCard('高度方向擴散尺度時間','Diffusion scale time',r.diffusionAcrossHeightS,'s')
      );
      const alerts=[];
      if(r.reynolds>10)alerts.push('Re 較高，入口發展長度與額外慣性效應可能不能忽略。');
      if(r.pressureKPa>100)alerts.push('預估壓降超過 100 kPa；這不是設備耐壓檢查，實際使用前請依管路與接頭額定規格核對。');
      if(r.diffusionAcrossHeightS>r.residenceS)alerts.push('擴散特徵時間長於停留時間：單靠橫向分子擴散可能不足。');
      status.textContent=alerts.length?alerts.join(' '):'數值使用矩形層流近似；請勿將擴散尺度時間當成完整混合時間。';
    }catch(e){
      resultBox.replaceChildren();
      const p=document.createElement('p');p.textContent='參數有誤，暫不顯示計算結果。';resultBox.append(p);
      error.textContent='請輸入合理且大於零的數值，檢查所有欄位。 '+String(e.message);
      error.hidden=false;status.textContent='';
    }
  }
  form.addEventListener('submit',e=>{e.preventDefault();calculate();});
  form.addEventListener('input',calculate);
  document.getElementById('microfluidic-reset').addEventListener('click',()=>{
    for(const [name,value] of Object.entries(defaults))form.elements.namedItem(name).value=value;
    calculate();
  });
  calculate();
})();
