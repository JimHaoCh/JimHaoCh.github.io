/* Web-AST Lite — student-facing browser-only experimental disk-diffusion reader. */
"use strict";
const $=id=>document.getElementById(id);
const photo=$("image"),overlay=$("overlay"),photoCtx=photo.getContext("2d",{willReadFrequently:true}),ctx=overlay.getContext("2d");
const file=$("file"),detectButton=$("detect"),modeButtons=[...document.querySelectorAll("[data-mode]")];
let disks=[],selected=null,mode="select",loaded=false,sourceDemo=false,reference=[],nextID=1;
let dragging=null,worker=null,objectURL=null,imageInfo={width:880,height:620};
const palette={disk:"#3fe3aa",auto:"#ffba62",manual:"#6cb7ff",text:"#eaf8fa"};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const med=a=>a.length?[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)]:null;
function status(s){$("status").textContent=s;}
function setImageSize(w,h){photo.width=overlay.width=w;photo.height=overlay.height=h;imageInfo={width:w,height:h};}
function pixelScale() {
  const user=Number($("pxmm").value),diskMM=Number($("disk-mm").value);
  if($("pxmm").value.trim()!==""&&user>.1&&Number.isFinite(user))return user;
  if(!(diskMM>0))return null;
  const rs=disks.filter(d=>Number.isFinite(d.r)&&d.r>=3).map(d=>2*d.r);
  return rs.length?med(rs)/diskMM:null;
}
function showMetrics(){
  const count=disks.length,valid=disks.filter(d=>d.zoneR!=null).length,manual=disks.filter(d=>d.zoneStatus==="manual").length;
  const pxmm=pixelScale();
  const summary=$("summary");summary.replaceChildren();
  const values=[["紙錠候選",String(count)],["有效圈徑",String(valid)],["校正比例",pxmm?pxmm.toFixed(2)+" px/mm":"待校正"]];
  for(const [k,v] of values){
    const card=document.createElement("div");card.className="metric";
    const a=document.createElement("div");a.className="name";a.textContent=k;
    const b=document.createElement("div");b.className="value";b.textContent=v;
    card.append(a,b);summary.append(card);
  }
  const tbody=$("measurements");tbody.replaceChildren();
  if(!count){const row=tbody.insertRow();const cell=row.insertCell();cell.colSpan=3;cell.textContent="尚未找到紙錠，可在影像上手動新增。";}
  for(const d of disks){
    const row=tbody.insertRow();row.dataset.id=String(d.id);
    if(selected===d.id)row.className="active";
    const a=row.insertCell();a.textContent=d.label;
    const b=row.insertCell();b.textContent=d.zoneR!==null&&pxmm?(2*d.zoneR/pxmm).toFixed(1):"待確認";
    const c=row.insertCell();c.textContent=d.zoneR===null?"未判定":(d.zoneStatus==="manual"?"人工修正":"自動候選");
    row.addEventListener("click",()=>selectDisk(d.id));
  }
  $("csv").disabled=!count;$("png").disabled=!loaded;
  $("demo-answer").disabled=!sourceDemo;
  $("reset-detection").disabled=!loaded;
  $("clear-zone").disabled=!disks.some(d=>d.id===selected);
  showSelectedFields();
  const isEstimated=disks.some(d=>d.zoneStatus==="auto");
  $("status").dataset.uncertain=isEstimated?"true":"false";
}
function showSelectedFields(){
  const d=disks.find(x=>x.id===selected),pxmm=pixelScale();
  for(const id of ["disk-label","disk-px","zone-mm"])$(id).disabled=!d;
  if(!d){$("disk-label").value="";$("disk-px").value="";$("zone-mm").value="";return;}
  $("disk-label").value=d.label;
  $("disk-px").value=(d.r*2).toFixed(1);
  $("zone-mm").value=d.zoneR!==null&&pxmm?(2*d.zoneR/pxmm).toFixed(1):"";
}
function selectDisk(id){selected=id;draw();showMetrics();}
function draw(){
  ctx.clearRect(0,0,overlay.width,overlay.height);
  const scale=Math.max(1,overlay.width/900);
  for(const d of disks){
    const active=d.id===selected;
    ctx.lineWidth=active?3*scale:2*scale;
    ctx.strokeStyle=palette.disk;
    ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,2*Math.PI);ctx.stroke();
    if(d.zoneR!==null){
      ctx.strokeStyle=d.zoneStatus==="manual"?palette.manual:palette.auto;
      ctx.setLineDash(d.zoneStatus==="manual"?[]:[9*scale,5*scale]);
      ctx.beginPath();ctx.arc(d.x,d.y,d.zoneR,0,2*Math.PI);ctx.stroke();
      ctx.setLineDash([]);
    }
    if(active){
      ctx.strokeStyle="#fff";ctx.lineWidth=1.2*scale;
      ctx.beginPath();ctx.moveTo(d.x-7*scale,d.y);ctx.lineTo(d.x+7*scale,d.y);
      ctx.moveTo(d.x,d.y-7*scale);ctx.lineTo(d.x,d.y+7*scale);ctx.stroke();
    }
    ctx.font="bold "+Math.max(12,15*scale)+"px system-ui";
    const text=d.label;
    const textW=ctx.measureText(text).width;
    const tx=clamp(d.x-textW/2,1,overlay.width-textW-1);
    const ty=clamp(d.y-d.r-8*scale,17*scale,overlay.height-2);
    ctx.fillStyle="rgba(11,36,49,.80)";
    ctx.fillRect(tx-4*scale,ty-14*scale,textW+8*scale,18*scale);
    ctx.fillStyle=palette.text;ctx.fillText(text,tx,ty);
  }
}
function sync(){draw();showMetrics();}
function newDisk(x,y,r=null){
  const diameter=med(disks.map(d=>2*d.r))||Math.max(12,photo.width*.046);
  const radius=r||diameter/2;
  const id=nextID++;
  const d={id,label:"D"+String(id).padStart(2,"0"),x,y,r:radius,zoneR:null,zoneStatus:"unresolved",confidence:0,score:0};
  disks.push(d);selected=id;return d;
}
function updateActions(){modeButtons.forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle("selected",on);b.setAttribute("aria-pressed",String(on));});}
function point(event){
  const rect=overlay.getBoundingClientRect();
  return {x:clamp((event.clientX-rect.left)*overlay.width/rect.width,0,overlay.width),
          y:clamp((event.clientY-rect.top)*overlay.height/rect.height,0,overlay.height)};
}
function nearest(p){
  let best=null,distance=Infinity;
  for(const d of disks){
    const dist=Math.hypot(p.x-d.x,p.y-d.y);
    const reach=Math.max(d.zoneR||0,d.r)+Math.max(19,photo.width*.015);
    if(dist<=reach&&dist<distance){best=d;distance=dist;}
  }
  return best;
}
overlay.addEventListener("pointerdown",event=>{
  if(!loaded)return;
  const p=point(event),d=nearest(p);
  if(mode==="add"){newDisk(p.x,p.y);sync();return;}
  if(mode==="delete"){if(d){disks=disks.filter(x=>x.id!==d.id);if(selected===d.id)selected=null;sync();}return;}
  if(!d){selected=null;sync();return;}
  selected=d.id;
  const dist=Math.hypot(p.x-d.x,p.y-d.y);
  dragging={id:d.id,kind:d.zoneR!==null&&Math.abs(dist-d.zoneR)<Math.max(16,photo.width*.014)?"radius":"center",start:p,origX:d.x,origY:d.y};
  overlay.setPointerCapture(event.pointerId);sync();
});
overlay.addEventListener("pointermove",event=>{
  if(!dragging)return;
  const d=disks.find(x=>x.id===dragging.id);if(!d)return;
  const p=point(event);
  if(dragging.kind==="radius"){d.zoneR=clamp(Math.hypot(p.x-d.x,p.y-d.y),d.r,Math.min(photo.width,photo.height)*.47);d.zoneStatus="manual";}
  else{d.x=clamp(dragging.origX+p.x-dragging.start.x,0,photo.width);d.y=clamp(dragging.origY+p.y-dragging.start.y,0,photo.height);d.zoneStatus="manual";}
  draw();showSelectedFields();
});
overlay.addEventListener("pointerup",()=>{if(dragging){dragging=null;sync();}});
overlay.addEventListener("pointercancel",()=>{dragging=null;sync();});
modeButtons.forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;updateActions();}));
$("threshold").addEventListener("input",()=>$("threshold-num").textContent=$("threshold").value);
$("disk-mm").addEventListener("input",sync);
$("pxmm").addEventListener("input",sync);
$("disk-label").addEventListener("change",()=>{const d=disks.find(x=>x.id===selected);if(d){d.label=$("disk-label").value.trim()||"D"+d.id;sync();}});
$("disk-px").addEventListener("change",()=>{
  const d=disks.find(x=>x.id===selected),v=Number($("disk-px").value);
  if(d&&v>=4&&v<=160){d.r=v/2;d.zoneStatus="manual";sync();}
});
$("zone-mm").addEventListener("change",()=>{
  const d=disks.find(x=>x.id===selected),v=Number($("zone-mm").value),scale=pixelScale();
  if(d&&scale&&Number.isFinite(v)&&v>=0&&v<=90){
    d.zoneR=clamp(v*scale/2,d.r,Math.max(photo.width,photo.height)*.6);
    d.zoneStatus="manual";sync();
  }
});
$("clear-zone").addEventListener("click",()=>{const d=disks.find(x=>x.id===selected);if(d){d.zoneR=null;d.zoneStatus="unresolved";sync();}});
async function loadFile(chosen) {
  if(!chosen)return;
  const allowed=chosen.type.startsWith("image/");
  if(!allowed){status("請選擇 JPG、PNG、WebP 或瀏覽器可解析的 HEIC 圖片。");return;}
  if(chosen.size>35*1024*1024){status("圖片超過 35 MB；請先縮小解析度。");return;}
  const url=URL.createObjectURL(chosen);
  try{
    const pic=new Image();pic.decoding="async";pic.src=url;await pic.decode();
    const factor=Math.min(1,1050/Math.max(pic.naturalWidth,pic.naturalHeight));
    const w=Math.max(80,Math.round(pic.naturalWidth*factor)),h=Math.max(80,Math.round(pic.naturalHeight*factor));
    if(w*h>1400000)throw Error("圖片解析度超出分析限制。");
    setImageSize(w,h);
    photoCtx.clearRect(0,0,w,h);photoCtx.drawImage(pic,0,0,w,h);
    loaded=true;sourceDemo=false;reference=[];disks=[];selected=null;nextID=1;
    $("reference").hidden=true;
    detectButton.disabled=false;sync();
    status("已載入 "+w+" × "+h+" 影像。自動量測後請逐個檢查抑菌圈邊界。");
  }catch(e){status("無法讀取影像："+(e.message||e)+"。若為 HEIC，請轉換成 JPG。");}
  finally{URL.revokeObjectURL(url);}
}
file.addEventListener("change",()=>loadFile(file.files?.[0]));
function syntheticPlate(){
  const w=900,h=680,cx=450,cy=340,plateR=305,paperR=20;
  const centers=[[330,225,77],[565,205,95],[680,375,56],[480,478,109],[255,421,66]];
  const data=photoCtx.createImageData(w,h);
  function noise(i){let v=(i*1664525+1013904223)>>>0;v^=v>>>11;v=Math.imul(v,2654435761)>>>0;return (v%31)-15;}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=4*(y*w+x),dist=Math.hypot(x-cx,y-cy);
    let rr=18,gg=35,bb=42;
    if(dist<plateR){
      const n=noise(y*w+x),edge=clamp((plateR-dist)/17,0,1);
      let zone=null,paper=false;
      for(const [dx,dy,zoneR] of centers){
        const d=Math.hypot(x-dx,y-dy);
        if(d<paperR)paper=true;
        if(d<zoneR)zone=zoneR;
      }
      const lawn=[160,132,93],clear=[216,193,152],white=[246,244,237];
      const base=paper?white:(zone?clear:lawn);
      const tint=paper?n*.16:n*.65;
      rr=clamp(base[0]+tint,0,255)*edge+55*(1-edge);
      gg=clamp(base[1]+tint,0,255)*edge+49*(1-edge);
      bb=clamp(base[2]+tint,0,255)*edge+39*(1-edge);
      if(dist>plateR-8){rr=198;gg=186;bb=164;}
    }
    data.data[p]=rr;data.data[p+1]=gg;data.data[p+2]=bb;data.data[p+3]=255;
  }
  photoCtx.putImageData(data,0,0);
  return centers.map(([x,y,r],i)=>({id:i+1,x,y,diameterMm:r*2/(paperR*2/6)}));
}
$("demo").addEventListener("click",()=>{
  setImageSize(900,680);
  reference=syntheticPlate();sourceDemo=true;loaded=true;disks=[];selected=null;nextID=1;
  $("pxmm").value="";$("disk-mm").value="6";$("reference").hidden=true;
  detectButton.disabled=false;sync();
  status("已建立合成平板（5 枚紙錠）。按「自動量測」測試辨識，再與示範參考值比較。");
});
function analyze(){
  if(!loaded)return;
  detectButton.disabled=true;status("正在偵測紙錠與徑向灰階邊界（本機運算）…");
  const img=photoCtx.getImageData(0,0,photo.width,photo.height);
  if(worker)worker.terminate();worker=new Worker("./worker.js");
  const timer=setTimeout(()=>{worker?.terminate();worker=null;detectButton.disabled=false;status("分析逾時：請改用較清晰的照片，或手動標記。");},35000);
  worker.onmessage=({data})=>{
    clearTimeout(timer);detectButton.disabled=false;
    if(data.type==="error"){status("自動辨識失敗："+data.message);return;}
    disks=data.result.disks.map(d=>({...d,id:nextID++}));
    selected=disks[0]?.id||null;mode="select";updateActions();sync();
    const resolved=disks.filter(d=>d.zoneR!==null).length;
    status("找到 "+disks.length+" 個紙錠候選物件；"+resolved+" 個具有可量測的抑菌圈候選邊界。請逐一確認。");
  };
  worker.onerror=err=>{clearTimeout(timer);detectButton.disabled=false;status("影像分析模組載入失敗："+(err.message||"未知錯誤"));}
  worker.postMessage({type:"analyze",buffer:img.data.buffer,width:photo.width,height:photo.height,
    settings:{threshold:Number($("threshold").value)}},[img.data.buffer]);
}
detectButton.addEventListener("click",analyze);
$("reset-detection").addEventListener("click",analyze);
function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);}
$("csv").addEventListener("click",()=>{
  const pxmm=pixelScale(),heads=["disk","zone_diameter_mm","disk_diameter_px","zone_diameter_px","status","confidence","center_x_px","center_y_px","scale_px_per_mm"];
  function escapeCSV(v){const s=String(v??"");return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  const rows=[heads.join(",")];
  for(const d of disks){
    const zone=d.zoneR!=null&&pxmm?(2*d.zoneR/pxmm).toFixed(2):"";
    rows.push([d.label,zone,(2*d.r).toFixed(2),d.zoneR===null?"":(2*d.zoneR).toFixed(2),d.zoneStatus,
      d.confidence||"",d.x.toFixed(2),d.y.toFixed(2),pxmm?pxmm.toFixed(4):""].map(escapeCSV).join(","));
  }
  saveBlob(new Blob(["\ufeff"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"}),"web-ast-zone-measurements.csv");
});
$("png").addEventListener("click",()=>{
  const canvas=document.createElement("canvas");canvas.width=photo.width;canvas.height=photo.height;
  const out=canvas.getContext("2d");out.drawImage(photo,0,0);out.drawImage(overlay,0,0);
  canvas.toBlob(blob=>{if(blob)saveBlob(blob,"web-ast-annotated-plate.png");},"image/png");
});
$("demo-answer").addEventListener("click",()=>{
  if(!sourceDemo)return;
  const answer=$("reference"),pxmm=40/6;
  answer.hidden=false;
  answer.textContent="合成資料參考圈徑（基於產生影像時的幾何參數）："+
    reference.map((r,i)=>"D"+String(i+1).padStart(2,"0")+" "+r.diameterMm.toFixed(1)+" mm").join("；")+
    "。各紙錠的自動編號可能不同，請依位置對照。此資料僅用於測試演算法。";
});
const initial=photoCtx.createLinearGradient(0,0,880,620);
initial.addColorStop(0,"#1b4653");initial.addColorStop(1,"#112633");
photoCtx.fillStyle=initial;photoCtx.fillRect(0,0,880,620);
photoCtx.fillStyle="#cfe2e8";photoCtx.textAlign="center";photoCtx.font="23px system-ui";
photoCtx.fillText("Web-AST Lite — Disk Diffusion",440,285);
photoCtx.font="15px system-ui";photoCtx.fillText("Upload a plate photo or open the synthetic teaching demo",440,316);
photoCtx.textAlign="start";
