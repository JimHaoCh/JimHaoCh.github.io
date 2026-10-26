/* Original, client-side Trypan Blue teaching analysis. No third-party code or network. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const u={};["upload","demo","detect","resetROI","minR","maxR","contrast","blue","contrastVal","blueVal","viewer","status","demoNote","undo","clearMarks","liveCount","deadCount","reviewCount","viability","reviewMessage","png","csv","calibrated","area","depth","dilution","liveML","totalML"].forEach(id=>u[id]=$(id));
const cv=u.viewer,ctx=cv.getContext("2d"),src=document.createElement("canvas"),sc=src.getContext("2d",{willReadFrequently:true});
let loaded=false,marks=[],roi=null,manualROI=false,mode="roi",start=null,end=null,hist=[];
const color={live:"#1b996e",dead:"#d85158",review:"#d79b2b"};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const region=()=>roi||{x0:0,y0:0,x1:src.width,y1:src.height};
const inROI=(x,y,r=region())=>x>=r.x0&&x<=r.x1&&y>=r.y0&&y<=r.y1;
function say(zh,en){u.status.textContent=zh;const t=document.createElement("span");t.className="en";t.textContent=en;u.status.appendChild(t);}
function push(){hist.push(marks.map(m=>({...m})));if(hist.length>15)hist.shift();u.undo.disabled=false;}
function draw(){
 ctx.clearRect(0,0,cv.width,cv.height);
 if(!loaded){ctx.fillStyle="#edf3f9";ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle="#688299";ctx.font="20px system-ui";ctx.textAlign="center";ctx.fillText("Upload microscopy image / 上傳顯微鏡照片",cv.width/2,cv.height/2);return;}
 ctx.drawImage(src,0,0);
 if(roi){ctx.fillStyle="#183a6533";ctx.beginPath();ctx.rect(0,0,cv.width,cv.height);ctx.rect(roi.x0,roi.y0,roi.x1-roi.x0,roi.y1-roi.y0);ctx.fill("evenodd");ctx.strokeStyle="#2b61ab";ctx.lineWidth=2;ctx.setLineDash([10,6]);ctx.strokeRect(roi.x0,roi.y0,roi.x1-roi.x0,roi.y1-roi.y0);ctx.setLineDash([]);}
 if(start&&end){ctx.strokeStyle="#eaa545";ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.strokeRect(Math.min(start.x,end.x),Math.min(start.y,end.y),Math.abs(end.x-start.x),Math.abs(end.y-start.y));ctx.setLineDash([]);}
 ctx.textAlign="center";ctx.textBaseline="middle";
 for(const m of marks){const c=color[m.kind];ctx.strokeStyle=c;ctx.lineWidth=Math.max(2,cv.width/440);ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=c;const bx=m.x+m.r*.8,by=m.y-m.r*.8;ctx.beginPath();ctx.arc(bx,by,Math.max(6,m.r*.38),0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 10px system-ui";ctx.fillText(m.kind==="live"?"L":m.kind==="dead"?"D":"?",bx,by);}
}
function stats(){
 const n={live:0,dead:0,review:0};for(const m of marks)if(inROI(m.x,m.y))n[m.kind]++;
 const verified=n.live+n.dead;
 u.liveCount.textContent=n.live;u.deadCount.textContent=n.dead;u.reviewCount.textContent=n.review;
 u.viability.textContent=verified?(100*n.live/verified).toFixed(1)+"%":"—";
 u.reviewMessage.firstChild.textContent=n.review?"有 "+n.review+" 顆候選細胞待確認，存活率為暫定數值。":"已無待確認標記，仍請人工檢查每個候選細胞。";
 const a=Number(u.area.value),d=Number(u.depth.value),f=Number(u.dilution.value);
 const ok=loaded&&manualROI&&u.calibrated.checked&&n.review===0&&verified>0&&a>0&&d>0&&f>0&&[a,d,f].every(Number.isFinite);
 const fmt=x=>x.toLocaleString("en-US",{maximumFractionDigits:2});
 u.liveML.textContent=ok?fmt(n.live*f*1000/(a*d)):"—";
 u.totalML.textContent=ok?fmt(verified*f*1000/(a*d)):"—";
 u.detect.disabled=u.resetROI.disabled=u.png.disabled=u.csv.disabled=u.clearMarks.disabled=!loaded;
}
const refresh=()=>{draw();stats();};
function load(image,name,demo=false){
 src.width=image.width;src.height=image.height;sc.drawImage(image,0,0);
 cv.width=src.width;cv.height=src.height;loaded=true;marks=[];roi=null;manualROI=false;hist=[];u.undo.disabled=true;u.calibrated.checked=false;
 u.demoNote.textContent=demo?"合成教學真值：48 活細胞、12 死細胞。此值用於比較辨識結果。 / Synthetic reference: 48 live, 12 dead.":"";
 say("已載入 "+name+"。可選擇 ROI 或直接分析全圖。","Image loaded. Draw an ROI or analyze the entire image.");refresh();
}
function seeded(seed){let z=seed|0;return()=>{z^=z<<13;z^=z>>>17;z^=z<<5;return(z>>>0)/4294967296;};}
function demo(){
 const c=document.createElement("canvas");c.width=960;c.height=640;const g=c.getContext("2d"),rand=seeded(20261026);
 g.fillStyle="#f2f4f2";g.fillRect(0,0,960,640);g.strokeStyle="#e5e8e7";g.lineWidth=2;
 for(let x=96;x<960;x+=96){g.beginPath();g.moveTo(x,0);g.lineTo(x,640);g.stroke();}
 for(let y=106;y<640;y+=106){g.beginPath();g.moveTo(0,y);g.lineTo(960,y);g.stroke();}
 const kinds=Array.from({length:60},(_,i)=>i<12?"dead":"live");
 for(let i=59;i>0;i--){const j=Math.floor(rand()*(i+1));[kinds[i],kinds[j]]=[kinds[j],kinds[i]];}
 for(let y=0;y<6;y++)for(let x=0;x<10;x++){
  const k=kinds[y*10+x],cx=47+x*96+(rand()-.5)*20,cy=52+y*106+(rand()-.5)*20,r=12+rand()*3;
  g.fillStyle=k==="dead"?"#4779a1":"#e2e7e6";g.strokeStyle=k==="dead"?"#304d82":"#667982";g.lineWidth=3.4;
  g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.fill();g.stroke();
  if(k==="dead"){g.fillStyle="#567cb4";g.beginPath();g.arc(cx-2,cy-2,r*.35,0,Math.PI*2);g.fill();}
  else{g.strokeStyle="#a2b4b8";g.lineWidth=1;g.beginPath();g.arc(cx,cy,r*.58,0,Math.PI*2);g.stroke();}
 }
 load(c,"synthetic-demo",true);
}
function detect(){
 const W=src.width,H=src.height,r=region(),rgb=sc.getImageData(0,0,W,H).data,n=W*H;
 const rmin=Number(u.minR.value),rmax=Number(u.maxR.value),thr=Number(u.contrast.value),blue=Number(u.blue.value);
 if(!(rmin>=2&&rmax>rmin&&rmax<=180)){say("最小／最大半徑設定無效。","Set valid cell radius limits.");return;}
 const gray=new Uint8Array(n),sum=new Float64Array((W+1)*(H+1));
 for(let y=0;y<H;y++){let rs=0;for(let x=0;x<W;x++){const p=y*W+x,i=p*4;gray[p]=Math.round(.299*rgb[i]+.587*rgb[i+1]+.114*rgb[i+2]);rs+=gray[p];sum[(y+1)*(W+1)+x+1]=sum[y*(W+1)+x+1]+rs;}}
 const xmin=Math.max(0,Math.floor(r.x0)),xmax=Math.min(W,Math.ceil(r.x1)),ymin=Math.max(0,Math.floor(r.y0)),ymax=Math.min(H,Math.ceil(r.y1));
 let mask=new Uint8Array(n);const pad=11;
 for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
  const l=Math.max(0,x-pad),rr=Math.min(W,x+pad+1),t=Math.max(0,y-pad),b=Math.min(H,y+pad+1);
  const avg=(sum[b*(W+1)+rr]-sum[t*(W+1)+rr]-sum[b*(W+1)+l]+sum[t*(W+1)+l])/((rr-l)*(b-t));
  if(avg-gray[y*W+x]>thr)mask[y*W+x]=1;
 }
 const expanded=new Uint8Array(n);
 for(let y=ymin+1;y<ymax-1;y++)for(let x=xmin+1;x<xmax-1;x++){
  const p=y*W+x;if(mask[p]||mask[p-1]||mask[p+1]||mask[p-W]||mask[p+W]||mask[p-W-1]||mask[p-W+1]||mask[p+W-1]||mask[p+W+1])expanded[p]=1;
 }
 mask=new Uint8Array(n);
 for(let y=ymin+2;y<ymax-2;y++)for(let x=xmin+2;x<xmax-2;x++){
  const p=y*W+x;if(expanded[p]&&expanded[p-1]&&expanded[p+1]&&expanded[p-W]&&expanded[p+W]&&expanded[p-W-1]&&expanded[p-W+1]&&expanded[p+W-1]&&expanded[p+W+1])mask[p]=1;
 }
 const seen=new Uint8Array(n),queue=new Int32Array(n),candidates=[];
 for(let y=ymin+2;y<ymax-2;y++)for(let x=xmin+2;x<xmax-2;x++){
  const initial=y*W+x;if(!mask[initial]||seen[initial])continue;
  let tail=1,head=0,minx=x,maxx=x,miny=y,maxy=y,sx=0,sy=0;queue[0]=initial;seen[initial]=1;
  while(head<tail){const p=queue[head++],px=p%W,py=(p/W)|0;sx+=px;sy+=py;minx=Math.min(px,minx);maxx=Math.max(px,maxx);miny=Math.min(py,miny);maxy=Math.max(py,maxy);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=px+dx,yy=py+dy;if(xx<xmin||xx>=xmax||yy<ymin||yy>=ymax)continue;const q=yy*W+xx;if(mask[q]&&!seen[q]){seen[q]=1;queue[tail++]=q;}}
  }
  const ww=maxx-minx+1,hh=maxy-miny+1,ratio=Math.min(ww,hh)/Math.max(ww,hh),rad=(ww+hh)/4,fill=tail/(Math.PI*rad*rad);
  if(rad<rmin||rad>rmax||ratio<.65||fill<.08||fill>1.45||tail<Math.max(12,rmin*2))continue;
  if(minx<=xmin+2||miny<=ymin+2||maxx>=xmax-3||maxy>=ymax-3)continue;
  const cx=sx/tail,cy=sy/tail,core=Math.max(2,rad*.52),core2=core*core;let chroma=0,lum=0,num=0;
  for(let dy=-Math.ceil(core);dy<=Math.ceil(core);dy++)for(let dx=-Math.ceil(core);dx<=Math.ceil(core);dx++){
   if(dx*dx+dy*dy>core2)continue;const xx=Math.round(cx+dx),yy=Math.round(cy+dy);if(xx<0||yy<0||xx>=W||yy>=H)continue;
   const p=yy*W+xx,i=p*4;chroma+=rgb[i+2]-rgb[i];lum+=gray[p];num++;
  }
  const bs=num?chroma/num:0,light=num?lum/num:255;
  const kind=Math.abs(bs-blue)<=7||(light<112&&bs<blue)?"review":bs>blue?"dead":"live";
  candidates.push({x:cx,y:cy,r:rad,kind,source:"auto",blueScore:+bs.toFixed(1)});
 }
 candidates.sort((a,b)=>b.r-a.r);const filtered=[];
 for(const m of candidates)if(!filtered.some(q=>Math.hypot(q.x-m.x,q.y-m.y)<Math.min(q.r,m.r)*.7))filtered.push(m);
 push();marks=filtered;refresh();
 say("找到 "+marks.length+" 個候選物件；請逐顆人工校對。","Found "+marks.length+" candidates. Manually verify and correct all detections.");
}
function xy(e){const b=cv.getBoundingClientRect();return{x:clamp((e.clientX-b.left)*cv.width/b.width,0,cv.width),y:clamp((e.clientY-b.top)*cv.height/b.height,0,cv.height)};}
function nearest(p){let j=-1,best=Infinity;marks.forEach((m,i)=>{const d=Math.hypot(p.x-m.x,p.y-m.y);if(d<Math.max(11,m.r*1.25)&&d<best){best=d;j=i;}});return j;}
cv.addEventListener("pointerdown",e=>{
 if(!loaded)return;e.preventDefault();const p=xy(e);
 if(mode==="roi"){start=p;end=p;cv.setPointerCapture(e.pointerId);draw();return;}
 if(!inROI(p.x,p.y))return;
 const i=nearest(p);if(mode==="erase"){if(i>=0){push();marks.splice(i,1);refresh();}return;}
 push();if(i>=0){marks[i].kind=mode;marks[i].source="manual";}
 else marks.push({x:p.x,y:p.y,r:(Number(u.minR.value)+Number(u.maxR.value))/2,kind:mode,source:"manual",blueScore:null});
 refresh();
});
cv.addEventListener("pointermove",e=>{if(start){end=xy(e);draw();}});
cv.addEventListener("pointerup",e=>{
 if(!start)return;const p=xy(e),a=start;start=null;end=null;
 if(Math.abs(p.x-a.x)>20&&Math.abs(p.y-a.y)>20){
  roi={x0:Math.min(p.x,a.x),x1:Math.max(p.x,a.x),y0:Math.min(p.y,a.y),y1:Math.max(p.y,a.y)};
  manualROI=true;u.calibrated.checked=false;push();marks=marks.filter(m=>inROI(m.x,m.y));
  say("ROI 已更新，請重新辨識並確認面積。","ROI updated; rerun detection and confirm calibrated area.");
 }refresh();
});
cv.addEventListener("pointercancel",()=>{start=null;end=null;draw();});
function saveBlob(blob,name){if(!blob)return;const link=document.createElement("a"),url=URL.createObjectURL(blob);link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);}
u.png.addEventListener("click",()=>{if(loaded)cv.toBlob(b=>saveBlob(b,"trypan-blue-annotated.png"),"image/png");});
u.csv.addEventListener("click",()=>{
 if(!loaded)return;const rows=[["index","x_px","y_px","radius_px","classification","source","B_minus_R","inside_ROI"].join(",")];
 marks.forEach((m,i)=>rows.push([i+1,m.x.toFixed(1),m.y.toFixed(1),m.r.toFixed(1),m.kind,m.source,m.blueScore??"",inROI(m.x,m.y)].join(",")));
 rows.push("");rows.push("viability_percent,"+u.viability.textContent.replace("%",""));rows.push("calibrated_area_confirmed,"+String(manualROI&&u.calibrated.checked));
 saveBlob(new Blob(["\ufeff"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"}),"trypan-blue-cells.csv");
});
u.undo.addEventListener("click",()=>{if(!hist.length)return;marks=hist.pop();u.undo.disabled=!hist.length;refresh();say("已復原標記編輯。","Previous marker edit undone.");});
u.clearMarks.addEventListener("click",()=>{push();marks=[];refresh();say("標記已清除。","Markers cleared.");});
u.resetROI.addEventListener("click",()=>{roi=null;manualROI=false;u.calibrated.checked=false;refresh();say("恢復全圖分析範圍。","Full-image ROI restored.");});
u.detect.addEventListener("click",()=>{try{detect();}catch(err){console.error(err);say("分析發生錯誤，請調整影像或參數。","Detection error; adjust the image or settings.");}});
u.demo.addEventListener("click",demo);
u.upload.addEventListener("change",e=>{
 const file=e.target.files&&e.target.files[0];if(!file)return;
 if(!file.type.startsWith("image/")||file.size>35*1024*1024){say("請選擇小於 35 MB 的圖片。","Choose an image under 35 MB.");return;}
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{const ratio=Math.min(1,1000/Math.max(img.naturalWidth,img.naturalHeight));
  const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.naturalWidth*ratio));c.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);load(c,file.name);URL.revokeObjectURL(url);};
 img.onerror=()=>{URL.revokeObjectURL(url);say("圖片解碼失敗，請改用 JPG 或 PNG。","Image decoding failed; try JPG or PNG.");};img.src=url;
});
document.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>{
 mode=btn.dataset.mode;document.querySelectorAll("[data-mode]").forEach(b=>{const chosen=b===btn;b.classList.toggle("active",chosen);b.setAttribute("aria-pressed",String(chosen));});
}));
for(const id of ["contrast","blue"])u[id].addEventListener("input",()=>{u[id+"Val"].textContent=u[id].value;});
for(const id of ["calibrated","area","depth","dilution"])u[id].addEventListener(id==="calibrated"?"change":"input",stats);
draw();stats();
})();