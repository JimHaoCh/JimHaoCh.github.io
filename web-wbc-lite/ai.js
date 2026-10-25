/* Web-WBC v0.2 — supervised lightweight k-NN for educational comparison.
   Training images are independent of questions and have class labels only during training.
   This is NOT the WBC-NCA checkpoint and is NOT clinically validated. */
(function (root) {
  'use strict';
  const KEYS = ['neutrophil','lymphocyte','monocyte','eosinophil','basophil'];
  const SIDE = 64;
  function featuresFromRGBA(data, w, h) {
    if (!data || data.length !== w*h*4) throw new Error('Invalid pixel buffer');
    const channels = 6, G = 4, N = G*G*channels;
    const sum = new Float64Array(N), sq = new Float64Array(N), counts = new Float64Array(G*G);
    const hist = new Float64Array(16); const total = w*h;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const i=(y*w+x)*4,r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
      const mx=Math.max(r,g,b),mn=Math.min(r,g,b),v=(r+g+b)/3,s=mx-mn;
      const purple=Math.max(0,(r+b)*.5-g),red=Math.max(0,r-(g+b)*.5);
      const blue=Math.max(0,b-(r+g)*.5),dark=1-mx;
      const vals=[v,s,purple,red,blue,dark];
      const gx=Math.min(G-1,Math.floor(x*G/w)),gy=Math.min(G-1,Math.floor(y*G/h)),cell=gy*G+gx;
      counts[cell]++;
      for(let k=0;k<channels;k++){const idx=cell*channels+k;sum[idx]+=vals[k];sq[idx]+=vals[k]*vals[k];}
      hist[Math.min(15,Math.floor(v*16))]++;
    }
    const out=[];
    for(let i=0;i<N;i++){const n=counts[Math.floor(i/channels)]||1,mean=sum[i]/n;out.push(mean,Math.sqrt(Math.max(0,sq[i]/n-mean*mean)));}
    for(const n of hist)out.push(n/total);
    return out;
  }
  function fromCanvas(img){
    const canvas=document.createElement('canvas');canvas.width=SIDE;canvas.height=SIDE;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,SIDE,SIDE);
    const sw=img.naturalWidth||img.width,sh=img.naturalHeight||img.height;
    if(!sw||!sh)throw new Error('Empty image');
    const ratio=Math.min(SIDE/sw,SIDE/sh),w=sw*ratio,h=sh*ratio;
    ctx.drawImage(img,(SIDE-w)/2,(SIDE-h)/2,w,h);
    return featuresFromRGBA(ctx.getImageData(0,0,SIDE,SIDE).data,SIDE,SIDE);
  }
  function fit(samples){
    const valid=samples.filter(s=>KEYS.includes(s.label)&&Array.isArray(s.features)&&s.features.every(Number.isFinite));
    if(valid.length<10)throw new Error('Insufficient training exemplars');
    const dims=valid[0].features.length;
    if(valid.some(s=>s.features.length!==dims))throw new Error('Feature shape mismatch');
    const mean=Array(dims).fill(0),sd=Array(dims).fill(0);
    for(const s of valid)for(let i=0;i<dims;i++)mean[i]+=s.features[i]/valid.length;
    for(const s of valid)for(let i=0;i<dims;i++)sd[i]+=(s.features[i]-mean[i])**2/valid.length;
    for(let i=0;i<dims;i++)sd[i]=Math.max(.012,Math.sqrt(sd[i]));
    const rows=valid.map(s=>({label:s.label,feature:s.features.map((v,i)=>(v-mean[i])/sd[i])}));
    const counts=Object.fromEntries(KEYS.map(k=>[k,valid.filter(s=>s.label===k).length]));
    if(Object.values(counts).some(c=>c<2))throw new Error('Not enough images for one or more WBC types');
    return {version:1,modelType:'kNN RGB-grid features',mean,sd,rows,counts};
  }
  function infer(model,vector){
    if(!model || !Array.isArray(vector) || vector.length!==model.mean.length)throw Error('No trained model / feature mismatch');
    const norm=vector.map((v,i)=>(v-model.mean[i])/model.sd[i]);
    const distances=model.rows.map(s=>{
      let d=0;for(let i=0;i<norm.length;i++)d+=(s.feature[i]-norm[i])**2;
      return {label:s.label,d:Math.sqrt(d/norm.length)};
    }).sort((a,b)=>a.d-b.d);
    const k=Math.min(7,distances.length),votes=Object.fromEntries(KEYS.map(q=>[q,0]));
    for(let i=0;i<k;i++)votes[distances[i].label]+=1/(.05+distances[i].d);
    const total=Object.values(votes).reduce((a,b)=>a+b,0);
    const normalized=Object.fromEntries(KEYS.map(label=>[label,votes[label]/total]));
    const sorted=KEYS.slice().sort((a,b)=>normalized[b]-normalized[a]);
    return {label:sorted[0],scores:normalized,nearestDistance:distances[0].d,
      topVoteShare:normalized[sorted[0]],neighbors:k,modelType:model.modelType};
  }
  root.WebWBCAI=Object.freeze({KEYS,featuresFromRGBA,fromCanvas,fit,infer});
})(typeof window!=='undefined'?window:globalThis);
