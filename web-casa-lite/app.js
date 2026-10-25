/* Web-CASA Lite · experimental local microscopy analysis */
const $ = id => document.getElementById(id);
const fileInput = $("file"), video = $("source"), frameCanvas = $("frameCanvas");
const resultCanvas = $("resultsCanvas"), resultCtx = resultCanvas.getContext("2d");
const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
const analyzeBtn = $("analyze"), demoBtn = $("demo"), csvBtn = $("csv");
let objectURL = null, running = false, worker = null, lastResult = null;
const MAX_VIDEO_SECONDS = 3, ANALYSIS_WIDTH = 320;
function status(text) { $("status").textContent = text; }
function progress(pct) { $("progress").hidden = false; $("progress").value = Math.max(0, Math.min(100, pct)); }
function busy(value) { running = value; analyzeBtn.disabled = value || !fileInput.files?.length; demoBtn.disabled = value; }
function metric(label, val) {
  const box=document.createElement("div");box.className="metric";
  const name=document.createElement("div");name.className="name";name.textContent=label;
  const value=document.createElement("div");value.className="value";value.textContent=val;
  box.append(name,value);return box;
}
function showMetrics(result,isDemo) {
  const c=$("metrics");c.replaceChildren();const count=result.counts||{};
  const format=n=>n==null?"—":n.toFixed(1)+"%";
  [
    ["有效軌跡（候選）",String(result.trackCount)],
    ["Total motility · estimated",result.hasScale?format(result.motility):"需校正"],
    ["Progressive · estimated",result.hasScale?format(result.progressive):"需校正"],
    ["PR / NP / low-motion",result.hasScale?(count.PR+" / "+count.NP+" / "+count.IM_candidate):"未分類"],
    ["輸入影格",String(result.frameCount)],["分析單位",result.unit]
  ].forEach(([k,v])=>c.append(metric(k,v)));
  const note=document.createElement("div");note.className="placeholder";
  note.textContent=(isDemo?"合成資料示範；":"")+"僅為候選頭部與軌跡自動估計；未經鞭毛、雜質或校正誤差驗證。";
  c.append(note);
}
function drawResult(result) {
  const W=result.width,H=result.height;resultCanvas.width=W;resultCanvas.height=H;
  resultCtx.drawImage(frameCanvas,0,0,W,H);
  const palette=["#2cc7c4","#eeae43","#fa85ab","#90bcfc","#9ce375","#be99ff","#edcf7d"];
  resultCtx.lineCap="round";resultCtx.lineJoin="round";
  for(const tr of result.tracks){
    if(tr.points.length<2)continue;
    const color=palette[tr.id%palette.length];
    resultCtx.strokeStyle=color;resultCtx.lineWidth=1.8;resultCtx.beginPath();
    tr.points.forEach(([x,y],i)=>i?resultCtx.lineTo(x,y):resultCtx.moveTo(x,y));
    resultCtx.stroke();
    const [x,y]=tr.points[tr.points.length-1];resultCtx.fillStyle=color;
    resultCtx.beginPath();resultCtx.arc(x,y,3,0,Math.PI*2);resultCtx.fill();
    resultCtx.font="bold 9px system-ui";resultCtx.fillText(String(tr.id),x+4,y-4);
  }
}
function grayFromCanvas(w,h){
  const rgba=frameCtx.getImageData(0,0,w,h).data,gray=new Uint8Array(w*h);
  for(let p=0,i=0;p<gray.length;p++,i+=4)gray[p]=(rgba[i]*77+rgba[i+1]*150+rgba[i+2]*29)>>>8;
  return gray;
}
function getParams(){
  const v=Number($("scale").value);
  return {scale:$("scale").value!==""&&v>0?v:null,jump:Number($("jump").value),contrast:Number($("contrast").value)};
}
function waitForEvent(target,name,timeoutMs=9000){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{cleanup();reject(new Error("影片解碼逾時："+name));},timeoutMs);
    function cleanup(){clearTimeout(timer);target.removeEventListener(name,done);target.removeEventListener("error",failed);}
    function done(){cleanup();resolve();}
    function failed(){cleanup();reject(new Error("影片無法解碼，請改用 MP4/H.264。"));}
    target.addEventListener(name,done,{once:true});target.addEventListener("error",failed,{once:true});
  });
}
async function seekTo(time){
  if(Math.abs(video.currentTime-time)<.00001&&video.readyState>=2)return;
  const promise=waitForEvent(video,"seeked",12000);video.currentTime=time;await promise;
}
async function captureUploadedVideo(){
  if(!Number.isFinite(video.duration)||video.duration<.5)throw new Error("請選擇至少 0.5 秒的可解析影片。");
  const w=ANALYSIS_WIDTH,h=Math.max(80,Math.round(video.videoHeight/video.videoWidth*w));
  if(!Number.isFinite(h)||h>450)throw new Error("影片尺寸異常。");
  frameCanvas.width=w;frameCanvas.height=h;video.pause();
  const seconds=Math.min(MAX_VIDEO_SECONDS,video.duration-.05),fps=Number($("fps").value);
  const count=Math.max(2,Math.floor(seconds*fps)),packed=new Uint8Array(count*w*h),times=[];
  for(let i=0;i<count;i++){
    const target=.025+i*(seconds-.05)/Math.max(1,count-1);
    await seekTo(Math.min(target,video.duration-.025));
    frameCtx.drawImage(video,0,0,w,h);
    packed.set(grayFromCanvas(w,h),i*w*h);
    times.push(Number(video.currentTime));
    if(i%3===0||i===count-1){
      status("解碼影片影格 "+(i+1)+" / "+count);
      progress(5+Math.round((i+1)/count*55));
      await new Promise(r=>setTimeout(r,0));
    }
  }
  for(let i=1;i<times.length;i++)if(times[i]<=times[i-1])
    throw new Error("影片無法提供遞增影格時間戳，請轉換 MP4/H.264 或調低取樣率。");
  return {buffer:packed.buffer,frames:count,width:w,height:h,times,isDemo:false};
}
function captureDemo(){
  const w=320,h=240,fps=20,count=40,packed=new Uint8Array(w*h*count),times=[];
  frameCanvas.width=w;frameCanvas.height=h;
  const stationary=[[54,65],[247,59],[211,190],[66,180],[286,148]];
  for(let k=0;k<count;k++){
    const frame=new Uint8Array(w*h);frame.fill(218);
    const spot=(x,y,rx,ry,tone)=>{
      for(let iy=Math.max(0,Math.floor(y-ry));iy<Math.min(h,Math.ceil(y+ry+1));iy++)
        for(let ix=Math.max(0,Math.floor(x-rx));ix<Math.min(w,Math.ceil(x+rx+1));ix++)
          if(((ix-x)/rx)**2+((iy-y)/ry)**2<=1)frame[iy*w+ix]=tone;
    };
    stationary.forEach(([x,y])=>spot(x,y,4,3,42));
    spot(30+3*k,34+.3*k,5,3,20);
    spot(165+Math.cos(k*.27)*27,65+1.3*k,4,3,34);
    spot(70+1.8*k,138+Math.sin(k*.38)*5,4,3,43);
    spot(275-2*k,192-.8*k,5,3,29);
    for(let j=0;j<13;j++)spot((j*71+13)%w,(j*53+7)%h,1,1,138);
    packed.set(frame,k*w*h);times.push(k/fps);
  }
  const img=frameCtx.createImageData(w,h),last=packed.subarray((count-1)*w*h);
  for(let p=0,i=0;p<last.length;p++,i+=4){img.data[i]=img.data[i+1]=img.data[i+2]=last[p];img.data[i+3]=255;}
  frameCtx.putImageData(img,0,0);
  return {buffer:packed.buffer,frames:count,width:w,height:h,times,isDemo:true};
}
async function runAnalysis(demo){
  if(running)return;busy(true);csvBtn.disabled=true;lastResult=null;progress(1);
  try{
    // Synthetic demo calibration is passed only to the worker; never modifies the user field.
    status(demo?"建立合成運動測試影片…":"解析手機影片…");
    const payload=demo?captureDemo():await captureUploadedVideo(),params=getParams();if(demo)params.scale=0.5;progress(65);
    worker??=new Worker("./worker.js");
    const result=await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{worker.terminate();worker=null;reject(new Error("分析逾時；請使用較短影片或改用電腦。"));},180000);
      worker.onmessage=({data})=>{
        if(data.type==="status"){status(data.text);progress(75);}
        if(data.type==="result"){clearTimeout(timeout);resolve(data.result);}
        if(data.type==="error"){clearTimeout(timeout);reject(new Error(data.message));}
      };
      worker.onerror=e=>{clearTimeout(timeout);reject(new Error("分析 Worker 失敗："+(e.message||"未知錯誤")));};
      worker.postMessage({type:"analyze",...payload,...params},[payload.buffer]);
    });
    lastResult=result;showMetrics(result,demo);drawResult(result);csvBtn.disabled=false;
    progress(100);
    status("完成："+result.trackCount+" 條有效候選軌跡，"+result.frameCount+" 張影格；"+
      (demo?"合成測試資料。":"真實影片分析。")+" 尚未經教師標註驗證。");
  }catch(error){status("分析失敗："+(error.message||error));progress(0);console.error(error);}
  finally{busy(false);}
}
fileInput.addEventListener("change",async()=>{
  csvBtn.disabled=true;lastResult=null;if(objectURL)URL.revokeObjectURL(objectURL);
  const file=fileInput.files?.[0];if(!file){busy(false);return;}
  objectURL=URL.createObjectURL(file);video.hidden=false;video.src=objectURL;video.load();
  analyzeBtn.disabled=false;
  status("已選擇："+file.name+"（"+(file.size/1048576).toFixed(1)+" MiB）。讀取影片資訊…");
  try{
    if(video.readyState<1)await waitForEvent(video,"loadedmetadata");
    status("已讀取 "+video.videoWidth+" × "+video.videoHeight+"；"+video.duration.toFixed(2)+" 秒。可開始分析。");
  }catch(e){status("此格式可能無法被目前瀏覽器解碼："+e.message);}
});
analyzeBtn.addEventListener("click",()=>runAnalysis(false));
demoBtn.addEventListener("click",()=>runAnalysis(true));
csvBtn.addEventListener("click",()=>{
  if(!lastResult)return;
  const rows=[["id","group","frames","duration","vcl","vsl","vap","lin","str","x","y","time"].join(",")];
  for(const tr of lastResult.tracks)
    for(const [x,y,t] of tr.points)rows.push([tr.id,tr.group,tr.frames,tr.duration,tr.vcl,tr.vsl,tr.vap,tr.lin,tr.str,x,y,t].join(","));
  const blob=new Blob(["\ufeff"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const href=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=href;link.download="web-casa-lite-tracks.csv";document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
});
const grad=resultCtx.createLinearGradient(0,0,640,480);
grad.addColorStop(0,"#143346");grad.addColorStop(1,"#0d1e2b");
resultCtx.fillStyle=grad;resultCtx.fillRect(0,0,640,480);
resultCtx.textAlign="center";resultCtx.fillStyle="#b8d0d9";
resultCtx.font="20px system-ui";resultCtx.fillText("Microscopy trajectory preview",320,227);
resultCtx.font="14px system-ui";resultCtx.fillText("請先上傳影片或執行合成示範",320,257);
resultCtx.textAlign="left";
