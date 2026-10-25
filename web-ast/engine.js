/* Web-AST Lite v0.1 — original browser-side teaching image analysis.
 * No clinical AST claims. Detects bright disk-like blobs and radial zone candidates.
 */
(function (root) {
"use strict";
const clamp = (x,lo,hi) => Math.max(lo,Math.min(hi,x));
function integral(data,w,h) {
  const stride=w+1, s=new Float64Array((w+1)*(h+1));
  for(let y=1;y<=h;y++){
    let sum=0;
    for(let x=1;x<=w;x++){sum+=data[(y-1)*w+x-1];s[y*stride+x]=s[(y-1)*stride+x]+sum;}
  }
  return s;
}
function boxAverage(s,w,h,x,y,r) {
  const x0=Math.max(0,x-r),y0=Math.max(0,y-r);
  const x1=Math.min(w,x+r+1),y1=Math.min(h,y+r+1),stride=w+1;
  return (s[y1*stride+x1]-s[y0*stride+x1]-s[y1*stride+x0]+s[y0*stride+x0])/((x1-x0)*(y1-y0));
}
function components(mask,w,h) {
  const visited=new Uint8Array(w*h), queue=new Int32Array(w*h), out=[];
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const k=y*w+x;if(!mask[k]||visited[k])continue;
    visited[k]=1;queue[0]=k;let head=0,tail=1,sumX=0,sumY=0;
    let left=x,right=x,top=y,bottom=y;
    while(head<tail){
      const a=queue[head++],ax=a%w,ay=(a/w)|0;
      sumX+=ax;sumY+=ay;left=Math.min(left,ax);right=Math.max(right,ax);top=Math.min(top,ay);bottom=Math.max(bottom,ay);
      const around=[a-1,a+1,a-w,a+w];
      for(const b of around){
        if(b<0||b>=visited.length||visited[b]||!mask[b])continue;
        const bx=b%w,by=(b/w)|0;
        if(Math.abs(bx-ax)+Math.abs(by-ay)!==1)continue;
        visited[b]=1;queue[tail++]=b;
      }
    }
    if(tail>=25&&tail<=16000)out.push({area:tail,x:sumX/tail,y:sumY/tail,
      left,right,top,bottom,width:right-left+1,height:bottom-top+1});
  }
  return out;
}
function median(a){if(!a.length)return NaN;const b=[...a].sort((x,y)=>x-y);const h=b.length>>1;return b.length%2?b[h]:(b[h-1]+b[h])/2;}
function sampleGray(gray,w,h,x,y) {
  const xx=Math.round(x), yy=Math.round(y);
  return xx<0||yy<0||xx>=w||yy>=h?null:gray[yy*w+xx];
}
function zoneCandidate(d,all,gray,w,h) {
  const minR=Math.max(Math.round(d.r*1.2),7);
  const maxR=Math.floor(Math.min(d.r*6.5,0.31*Math.min(w,h),
                d.x-3,d.y-3,w-d.x-4,h-d.y-4));
  if(maxR<=Math.max(minR+16,d.r*2.4))return {zoneR:null,confidence:0,zoneStatus:"unresolved"};
  const profile=[];
  for(let r=minR;r<=maxR;r++){
    const values=[];
    for(let a=0;a<72;a++){
      const theta=a*2*Math.PI/72,xx=d.x+r*Math.cos(theta),yy=d.y+r*Math.sin(theta);
      // Do not sample another disk's paper: the center is irrelevant to the annulus.
      if(all.some(other=>other!==d&&Math.hypot(xx-other.x,yy-other.y)<other.r*1.3))continue;
      const pixel=sampleGray(gray,w,h,xx,yy);if(pixel!==null)values.push(pixel);
    }
    profile.push(values.length>=36?median(values):NaN);
  }
  const smoothed=profile.map((_,j)=>{
    const values=profile.slice(Math.max(0,j-3),Math.min(profile.length,j+4)).filter(Number.isFinite);
    return values.length?values.reduce((a,b)=>a+b,0)/values.length:NaN;
  });
  const inner=smoothed.filter((v,i)=>Number.isFinite(v)&&minR+i>=1.45*d.r&&minR+i<=2.25*d.r);
  const outer=smoothed.slice(Math.floor(smoothed.length*.78)).filter(Number.isFinite);
  if(!inner.length||!outer.length)return {zoneR:null,confidence:0,zoneStatus:"unresolved"};
  const contrast=median(inner)-median(outer);
  if(contrast<9)return {zoneR:null,confidence:0,zoneStatus:"unresolved"};
  let bestIndex=-1,bestSlope=-Infinity;
  for(let j=5;j<smoothed.length-5;j++){
    const r=minR+j;
    if(r<Math.max(d.r*1.75,13))continue;
    const a=smoothed[j-4],b=smoothed[j+4];
    if(!Number.isFinite(a)||!Number.isFinite(b))continue;
    const slope=a-b;
    if(slope>bestSlope){bestSlope=slope;bestIndex=j;}
  }
  if(bestIndex<0||bestSlope<Math.max(3.2,contrast*.12))return {zoneR:null,confidence:0,zoneStatus:"unresolved"};
  const radius=minR+bestIndex;
  if(radius<d.r*1.6)return {zoneR:null,confidence:0,zoneStatus:"unresolved"};
  const confidence=clamp((contrast-8)/60*.45+(bestSlope-3)/28*.55,0,1);
  return {zoneR:Math.round(radius*10)/10,confidence:+confidence.toFixed(2),zoneStatus:"auto"};
}
function analyze(rgba,w,h,settings={}) {
  if(!rgba||rgba.length!==w*h*4||w<80||h<80)throw new Error("無效的影像解析度或像素資料。");
  const threshold=clamp(Number(settings.threshold)||29,8,75);
  const n=w*h,gray=new Uint8Array(n),mask=new Uint8Array(n),chroma=new Uint8Array(n);
  for(let i=0,p=0;i<n;i++,p+=4){
    const r=rgba[p],g=rgba[p+1],b=rgba[p+2];
    gray[i]=(r*77+g*150+b*29)>>>8;
    chroma[i]=Math.max(r,g,b)-Math.min(r,g,b);
  }
  const sat=integral(gray,w,h),radius=Math.round(clamp(Math.min(w,h)*.115,35,98));
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x,lum=gray[i],avg=boxAverage(sat,w,h,x,y,radius);
    // A conservative white-paper threshold avoids confusing a large bright halo with a disk.
    // Dim/colored disks must be placed or corrected manually in this teaching prototype.
    if(lum>=215&&chroma[i]<=110&&lum-avg>=threshold)mask[i]=1;
  }
  // Fill text and pinholes on paper disks without letting bright zones fill the scene.
  const dilated=new Uint8Array(n),closed=new Uint8Array(n);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x;if(mask[i]||mask[i-1]||mask[i+1]||mask[i-w]||mask[i+w])dilated[i]=1;
  }
  for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){
    const i=y*w+x;
    if(dilated[i]&&dilated[i-1]&&dilated[i+1]&&dilated[i-w]&&dilated[i+w])closed[i]=1;
  }
  const comps=components(closed,w,h),candidates=[];
  for(const c of comps){
    const aspect=c.width/c.height;
    const r=Math.sqrt(c.area/Math.PI);
    const fill=c.area/(c.width*c.height);
    if(r<5||r>Math.min(w,h)*.09||aspect<.55||aspect>1.8||fill<.38||fill>1.1)continue;
    if(c.left<8||c.top<8||c.right>w-9||c.bottom>h-9)continue;
    candidates.push({x:+c.x.toFixed(1),y:+c.y.toFixed(1),r:+r.toFixed(1),
      score:+Math.min(1,fill/.75).toFixed(2)});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const unique=[];
  for(const c of candidates){
    if(unique.some(q=>Math.hypot(q.x-c.x,q.y-c.y)<Math.max(q.r,c.r)*1.3))continue;
    unique.push(c);
    if(unique.length>=24)break;
  }
  const disks=unique.map((d,i)=>({
    id:i+1,label:"D"+String(i+1).padStart(2,"0"),...d,
    ...zoneCandidate(d,unique,gray,w,h)
  }));
  return {disks,source:"bright-disk-radial-profile",inputWidth:w,inputHeight:h,threshold,
    note:"Auto-detected bright circular candidates and radial contrast boundaries. Require manual confirmation."};
}
root.WebASTEngine={analyze,median};
})(self);