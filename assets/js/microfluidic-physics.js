/* Rectangle-channel teaching equations in SI units, no external dependencies. */
(function(root,factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.MicrofluidicPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function calculate(raw){
    const names=['widthUm','heightUm','lengthMm','flowUlMin','viscosityMpas','densityKgM3','diffusionUm2S'];
    const x={};
    for(const key of names){
      x[key]=Number(raw[key]);
      if(!Number.isFinite(x[key])||x[key]<=0) throw new RangeError(key+' must be positive and finite');
    }
    if(x.widthUm>1e6||x.heightUm>1e6||x.lengthMm>1e6||x.flowUlMin>1e9||
       x.viscosityMpas>1e8||x.densityKgM3>1e6||x.diffusionUm2S>1e12)
      throw new RangeError('Input outside supported teaching range');
    const w=Math.max(x.widthUm,x.heightUm)*1e-6;
    const h=Math.min(x.widthUm,x.heightUm)*1e-6;
    const L=x.lengthMm*1e-3, q=x.flowUlMin*1e-9/60, mu=x.viscosityMpas*1e-3;
    const rho=x.densityKgM3, area=w*h, speed=q/area, hydraulicDiameter=2*w*h/(w+h);
    let correction=1;
    for(let n=1;n<=101;n+=2){
      correction-=192*h/(Math.PI**5*w)*(Math.tanh(n*Math.PI*w/(2*h))/n**5);
    }
    if(correction<=0)throw new RangeError('Hydraulic geometry could not be calculated');
    const resistance=12*mu*L/(w*h**3*correction);
    const deltaPa=resistance*q;
    const residence=L/speed;
    const diffusionSeconds=(x.heightUm**2)/(2*x.diffusionUm2S);
    return {
      areaM2:area, flowM3S:q, meanVelocityMmS:speed*1e3, hydraulicDiameterUm:hydraulicDiameter*1e6,
      reynolds:rho*speed*hydraulicDiameter/mu, resistancePaSM3:resistance,
      pressureKPa:deltaPa/1e3, residenceS:residence,
      diffusionAcrossHeightS:diffusionSeconds,
      widthHeightRatio:w/h, correctionFactor:correction,
      assumptions:'Single-phase Newtonian fluid, straight and rigid rectangular channel, fully developed steady laminar flow; diffusion is h^2/(2D).'
    };
  }
  return Object.freeze({calculate});
});
