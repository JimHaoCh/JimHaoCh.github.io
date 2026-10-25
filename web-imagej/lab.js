"use strict";
(() => {
  // Original browser-side image teaching tool. No third-party libraries or network calls.
  const $ = name => document.getElementById("wi-" + name);
  const file = $("file"), demo = $("demo"), clear = $("clear"), meta = $("meta"), scale = $("scale");
  const stage = $("stage"), placeholder = $("placeholder"), canvas = $("image"), overlay = $("overlay");
  const bc = canvas.getContext("2d", {willReadFrequently: true}), oc = overlay.getContext("2d");
  const hist = $("hist"), hc = hist.getContext("2d");
  const stats = $("stats"), threshold = $("threshold"), thresholdValue = $("threshold-value");
  const polarity = $("polarity"), preview = $("preview"), minArea = $("min-area");
  const analyze = $("analyze"), count = $("count"), rows = $("rows"), status = $("status");
  const csv = $("csv"), png = $("png"), all = $("all");
  const modeButtons = Array.from(document.querySelectorAll("[data-wi-mode]"));
  // v0.3 teaching extension: numeric snapshots only; no names, image content or storage.
  const lesson = $("lesson"), lessonSteps = $("lesson-steps"), lessonFeedback = $("lesson-feedback");
  const knownLength = $("known-length"), calibrateButton = $("calibrate"), benchmarkButton = $("benchmark");
  const openBenchmark = $("open-benchmark"), checkBenchmark = $("check-benchmark");
  const activityCalibrate = $("activity-calibrate"), activityCount = $("activity-count"), activityIntensity = $("activity-intensity");
  const saveTarget = $("save-target"), saveBackground = $("save-background"), resetIntensity = $("reset-intensity");
  const recordButton = $("record"), exportRecordsButton = $("export-records"), clearRecordsButton = $("clear-records");
  const recordRows = $("record-rows"), reviewed = $("reviewed");
  const training = {image:"none",records:[],target:null,background:null};
  const lessonTips = {
    calibrate:"1. 載入有已知尺度的影像，切換為「直線量測」。2. 沿已知長度拖曳直線。3. 輸入真實 µm 並設定校正值，再記錄結果；合成示範圖未具真實物理尺度。",
    count:"1. 載入「12 顆基準圖」（原創合成圖）。2. 設為深色目標、閾值 145、最小面積 20 原始 pixel²。3. 分析連通顆粒、核對基準答案，再下載紀錄。",
    intensity:"1. 載入影像，框選目標區域 ROI，按「記錄目前 ROI 為目標」。2. 框選背景 ROI 並記錄背景。3. 查看目標平均灰階－背景平均灰階，保存結果。"
  };
  const s = {w:0,h:0,origW:0,origH:0,gray:null,selection:null,mode:"rect",drag:false,start:null,
             components:[],analyzed:false,loadVersion:0};
  const format = (n,d=2) => Number.isFinite(n) ? n.toLocaleString("en-US",{maximumFractionDigits:d}) : "—";
  const integer = (v,fallback) => Number.isFinite(v) ? v : fallback;
  const validScale = () => {const n=Number(scale.value);return scale.value.trim()!=="" && Number.isFinite(n) && n>0 ? n : null;};
  const factorX = () => s.origW/s.w, factorY=()=>s.origH/s.h;
  const announce = text => {status.textContent=text;};
  const resetNotebook = () => {
    training.records=[];training.target=null;training.background=null;reviewed.checked=false;
    recordRows.innerHTML='<tr><td colspan="5">尚未保存量測紀錄</td></tr>';
    exportRecordsButton.disabled=true;clearRecordsButton.disabled=true;recordButton.disabled=!s.w;
    lessonFeedback.textContent="已清除目前影像的教學紀錄與灰階比較。";
  };
  const invalidateReview = () => {reviewed.checked=false;};
  const setLoaded = loaded => {
    placeholder.hidden=loaded;canvas.hidden=!loaded;overlay.hidden=!loaded;
    stage.classList.toggle("wi-has-image",loaded);
    analyze.disabled=!loaded;csv.disabled=!loaded;png.disabled=!loaded;recordButton.disabled=!loaded;
  };
  const bounds = () => {
    if (!s.w) return null;
    if (!s.selection || s.selection.type!=="rect") return {x:0,y:0,x2:s.w,y2:s.h};
    const a=s.selection;
    const x=Math.max(0,Math.min(s.w-1,Math.floor(a.x))), y=Math.max(0,Math.min(s.h-1,Math.floor(a.y)));
    const x2=Math.max(x+1,Math.min(s.w,Math.ceil(a.x+a.w)));
    const y2=Math.max(y+1,Math.min(s.h,Math.ceil(a.y+a.h)));
    return {x,y,x2,y2};
  };
  const resetResults = () => {
    s.components=[];s.analyzed=false;count.textContent="尚無計數結果";
    rows.innerHTML='<tr><td colspan="4">尚無結果</td></tr>';
  };
  const reset = () => {
    s.loadVersion++;s.w=0;s.h=0;s.origW=0;s.origH=0;s.gray=null;
    s.selection=null;s.drag=false;s.start=null;training.image="none";resetNotebook();
    resetResults();bc.clearRect(0,0,canvas.width,canvas.height);
    oc.clearRect(0,0,overlay.width,overlay.height);
    meta.textContent="尚未讀入影像。可先使用合成示範圖。";
    stats.textContent="選取影像後顯示 ROI 統計。";
    setLoaded(false);drawHistogram();chooseLesson();announce("已清除影像。");
    file.value="";
  };
  const ingest = (source,srcW,srcH,label,origin="uploaded") => {
    if (!srcW||!srcH||srcW>16000||srcH>16000||srcW*srcH>35000000) {
      announce("影像像素數過大或尺寸無效。請先縮小至 3,500 萬像素內。");return false;
    }
    const maxSide=1280, ratio=Math.min(1,maxSide/Math.max(srcW,srcH));
    const w=Math.max(1,Math.round(srcW*ratio)),h=Math.max(1,Math.round(srcH*ratio));
    canvas.width=overlay.width=w;canvas.height=overlay.height=h;
    bc.fillStyle="#fff";bc.fillRect(0,0,w,h);bc.drawImage(source,0,0,w,h);
    const d=bc.getImageData(0,0,w,h).data;
    s.w=w;s.h=h;s.origW=srcW;s.origH=srcH;s.gray=new Uint8Array(w*h);
    for(let i=0,j=0;i<d.length;i+=4,j++) s.gray[j]=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2]);
    s.selection={type:"rect",x:0,y:0,w,h};s.drag=false;resetResults();
    resetNotebook();training.image=origin;
    setLoaded(true);
    meta.textContent=label+" · 原始影像 "+srcW+" × "+srcH+" px · 分析工作影像 "+w+" × "+h+" px"+(ratio<1?"（已縮圖）":"");
    render();announce("影像已在本機載入。可拖曳選取 ROI，或調整閾值並分析。");return true;
  };
  const generateDemo = () => {
    const c=document.createElement("canvas");c.width=720;c.height=480;const x=c.getContext("2d");
    x.fillStyle="#eef1f3";x.fillRect(0,0,720,480);
    // Deterministic synthetic shapes, intentionally not patient/microscope material.
    let seed=8421;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<28;i++){
      const px=38+rnd()*644,py=38+rnd()*404,r=8+rnd()*12,shade=35+Math.floor(rnd()*55);
      x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fillStyle="rgb("+shade+","+shade+","+shade+")";x.fill();
      x.strokeStyle="rgba(20,35,45,.15)";x.lineWidth=1;x.stroke();
    }
    for(let i=0;i<80;i++){
      const v=145+Math.floor(rnd()*65);x.fillStyle="rgba("+v+","+v+","+v+",.4)";
      x.fillRect(rnd()*720,rnd()*480,1+rnd()*2,1+rnd()*2);
    }
    return c;
  };
  const generateBenchmark = () => {
    const c=document.createElement("canvas");c.width=720;c.height=430;
    const x=c.getContext("2d");x.fillStyle="#eeeeee";x.fillRect(0,0,c.width,c.height);
    // Exactly twelve disjoint dark components: deterministic synthetic reference.
    for(let row=0;row<3;row++)for(let col=0;col<4;col++){
      const index=row*4+col,px=96+col*156,py=85+row*128,r=14+(index%4)*2;
      const shade=40+(index%5)*12;
      x.beginPath();x.arc(px,py,r,0,Math.PI*2);
      x.fillStyle="rgb("+shade+","+shade+","+shade+")";x.fill();
    }
    return c;
  };
  const loadBenchmark = () => {
    s.loadVersion++;file.value="";
    threshold.value="145";thresholdValue.value="145";polarity.value="dark";minArea.value="20";preview.checked=true;
    const c=generateBenchmark();ingest(c,c.width,c.height,"12 顆原創合成基準圖","benchmark");
    lessonFeedback.textContent="已載入 12 顆互不接觸的合成圓形。請執行連通區計數後核對結果。";
  };
  const coords = ev => {
    const r=overlay.getBoundingClientRect();
    return {x:Math.max(0,Math.min(s.w,(ev.clientX-r.left)/r.width*s.w)),
            y:Math.max(0,Math.min(s.h,(ev.clientY-r.top)/r.height*s.h))};
  };
  const selectMode = mode => {
    s.mode=mode;modeButtons.forEach(b=>{const active=b.dataset.wiMode===mode;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
    resetResults();invalidateReview();render();
  };
  const pointerDown = ev => {
    if(!s.w||!ev.isPrimary)return;
    s.drag=true;s.start=coords(ev);s.selection=null;
    overlay.setPointerCapture(ev.pointerId);ev.preventDefault();
  };
  const pointerMove = ev => {
    if(!s.drag||!s.start)return;
    const p=coords(ev),start=s.start;
    if(s.mode==="line") s.selection={type:"line",x1:start.x,y1:start.y,x2:p.x,y2:p.y};
    else s.selection={type:"rect",x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(p.x-start.x),h:Math.abs(p.y-start.y)};
    render();
  };
  const pointerEnd = ev => {
    if(!s.drag)return;
    pointerMove(ev);s.drag=false;s.start=null;
    if(s.selection?.type==="rect"&&(s.selection.w<2||s.selection.h<2)) s.selection=null;
    if(s.selection?.type==="line"&&Math.hypot(s.selection.x2-s.selection.x1,s.selection.y2-s.selection.y1)<2) s.selection=null;
    resetResults();invalidateReview();render();
    if(overlay.hasPointerCapture(ev.pointerId))overlay.releasePointerCapture(ev.pointerId);
  };
  const selected = (i) => polarity.value==="dark" ? s.gray[i]<=Number(threshold.value) : s.gray[i]>=Number(threshold.value);
  const drawOverlay = () => {
    if(!s.w)return;
    oc.clearRect(0,0,s.w,s.h);
    if(preview.checked && s.selection?.type!=="line"){
      const b=bounds(),d=oc.createImageData(s.w,s.h),out=d.data;
      for(let y=b.y;y<b.y2;y++)for(let x=b.x;x<b.x2;x++){
        const idx=y*s.w+x;if(selected(idx)){const q=idx*4;out[q]=236;out[q+1]=148;out[q+2]=45;out[q+3]=72;}
      }
      oc.putImageData(d,0,0);
    }
    if(s.analyzed) {
      oc.fillStyle="rgba(30,135,104,.18)";oc.strokeStyle="#16845f";oc.lineWidth=Math.max(1,s.w/800);
      for(const p of s.components.slice(0,250)) {
        const x=p.x/factorX(),y=p.y/factorY();
        oc.beginPath();oc.arc(x,y,Math.max(3,s.w/250),0,Math.PI*2);oc.fill();oc.stroke();
      }
    }
    if(s.selection){
      oc.strokeStyle="#1565bc";oc.fillStyle="rgba(34,103,184,.07)";oc.lineWidth=Math.max(1.5,s.w/600);
      oc.setLineDash([Math.max(4,s.w/160),Math.max(3,s.w/240)]);
      if(s.selection.type==="line"){
        const a=s.selection;oc.beginPath();oc.moveTo(a.x1,a.y1);oc.lineTo(a.x2,a.y2);oc.stroke();
      }else{
        const a=s.selection;oc.fillRect(a.x,a.y,a.w,a.h);oc.strokeRect(a.x,a.y,a.w,a.h);
      }
      oc.setLineDash([]);
    }
  };
  const roiStats = () => {
    if(!s.w)return null;
    const b=bounds();let sum=0,mn=255,mx=0,n=0;
    for(let y=b.y;y<b.y2;y++)for(let x=b.x;x<b.x2;x++){
      const v=s.gray[y*s.w+x];sum+=v;mn=Math.min(mn,v);mx=Math.max(mx,v);n++;
    }
    return {n,mean:sum/n,min:mn,max:mx,b};
  };
  const refreshStats = () => {
    if(!s.w)return;
    const um=validScale();
    if(s.selection?.type==="line"){
      const a=s.selection;
      const dx=(a.x2-a.x1)*factorX(),dy=(a.y2-a.y1)*factorY(),len=Math.hypot(dx,dy);
      stats.innerHTML='<p><strong>Line Length：</strong>'+format(len)+' 原始 px'+(um!==null?' · '+format(len*um,3)+' µm':'')+'</p>';
    }else{
      const st=roiStats(),nativeArea=st.n*factorX()*factorY();
      const physical=um!==null?' · '+format(nativeArea*um*um,3)+' µm²':'';
      stats.innerHTML='<p><strong>ROI 面積：</strong>'+format(nativeArea)+' 原始 pixel²'+physical+'</p>'+
        '<p><strong>平均灰階：</strong>'+format(st.mean)+' / 255</p>'+
        '<p><strong>最小／最大：</strong>'+st.min+' / '+st.max+'</p>';
    }
  };
  const drawHistogram = () => {
    hc.clearRect(0,0,hist.width,hist.height);
    hc.fillStyle="#f7f9fb";hc.fillRect(0,0,hist.width,hist.height);
    hc.fillStyle="#698096";hc.font="12px sans-serif";hc.fillText("ROI Gray Intensity · 0–255",14,20);
    if(!s.w||s.selection?.type==="line")return;
    const bins=new Uint32Array(256),b=bounds();
    for(let y=b.y;y<b.y2;y++)for(let x=b.x;x<b.x2;x++)bins[s.gray[y*s.w+x]]++;
    const peak=Math.max(1,...bins);
    const width=hist.width-28,height=hist.height-54;
    hc.fillStyle="#6793b7";
    for(let k=0;k<256;k++){
      const ht=bins[k]/peak*height;hc.fillRect(14+k*width/256,32+height-ht,Math.max(1,width/256),ht);
    }
    hc.fillStyle="#b96827";const pos=14+Number(threshold.value)*width/256;hc.fillRect(pos,28,2,height+8);
    hc.fillStyle="#778999";hc.fillText("0",14,hist.height-8);hc.fillText("255",hist.width-38,hist.height-8);
  };
  const render = () => {drawOverlay();refreshStats();drawHistogram();};
  const countParticles = () => {
    if(!s.w)return;
    if(s.selection?.type==="line"){announce("直線模式不能執行面積計數。請選取矩形 ROI。");return;}
    const b=bounds(),W=s.w,seen=new Uint8Array(W*s.h),queue=new Int32Array(W*s.h);
    const origPixelArea=factorX()*factorY(),min=Number(minArea.value);
    if(!Number.isFinite(min)||min<1){announce("請輸入有效的最小顆粒面積（至少 1 原始 pixel²）。");return;}
    const items=[];let found=0,discarded=0;
    for(let y=b.y;y<b.y2;y++)for(let x=b.x;x<b.x2;x++){
      const start=y*W+x;if(seen[start]||!selected(start))continue;
      let head=0,tail=1,area=0,sumX=0,sumY=0;
      queue[0]=start;seen[start]=1;
      while(head<tail){
        const pos=queue[head++],py=Math.floor(pos/W),px=pos-py*W;
        area++;sumX+=px+.5;sumY+=py+.5;
        for(let yy=Math.max(b.y,py-1);yy<=Math.min(b.y2-1,py+1);yy++)
          for(let xx=Math.max(b.x,px-1);xx<=Math.min(b.x2-1,px+1);xx++){
            const q=yy*W+xx;if(!seen[q]&&selected(q)){seen[q]=1;queue[tail++]=q;}
          }
      }
      const nativeArea=area*origPixelArea;
      if(nativeArea>=min) {
        found++;
        if(items.length<10000)items.push({area:nativeArea,x:sumX/area*factorX(),y:sumY/area*factorY()});
      } else discarded++;
      if(found>10000){resetResults();count.textContent="候選連通區超過 10,000 個；請調整閾值及最小面積後重試。";announce("區塊數量超出教學工具限制，尚未輸出計數。");render();return;}
    }
    s.components=items;s.analyzed=true;
    count.textContent="有效顆粒："+format(found,0)+" 個 · 移除過小區塊："+format(discarded,0)+" 個";
    rows.textContent="";
    if(!items.length){const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=4;td.textContent="此設定下無符合條件的顆粒";tr.appendChild(td);rows.appendChild(tr);}
    for(const [i,p] of items.slice(0,100).entries()){
      const tr=document.createElement("tr");[i+1,format(p.area),format(p.x),format(p.y)].forEach(v=>{const td=document.createElement("td");td.textContent=String(v);tr.appendChild(td);});rows.appendChild(tr);
    }
    invalidateReview();announce("本機連通區分析已完成；請人工核對重疊顆粒及非均勻背景。");render();
  };
  const dl=(blob,name)=>{
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  };
  const exportCsv=()=>{
    if(!s.w)return;
    const um=validScale(),st=s.selection?.type==="line"?null:roiStats();
    const entries=[
      ["Metric","Value","Unit"],
      ["Image width",s.origW,"original pixel"],["Image height",s.origH,"original pixel"],
      ["Analysis width",s.w,"working pixel"],["Analysis height",s.h,"working pixel"],
      ["Calibration",um===null?"uncalibrated":um,"um / original pixel"],
      ["ROI type",s.selection?.type||"full image",""],
      ["ROI area",st?st.n*factorX()*factorY():"","original pixel^2"],
      ["Mean gray",st?st.mean.toFixed(3):"","0-255"],
      ["Threshold",threshold.value,"0-255"],["Polarity",polarity.value,""],
      ["Minimum area",minArea.value,"original pixel^2"],
      ["Particle count",s.analyzed?s.components.length:"not run","objects"],
      [],
      ["Particle","Area (original px^2)","Center X (original px)","Center Y (original px)"],
      ...s.components.map((p,i)=>[i+1,p.area.toFixed(3),p.x.toFixed(3),p.y.toFixed(3)])
    ];
    if(s.selection?.type==="line"){
      const a=s.selection,len=Math.hypot((a.x2-a.x1)*factorX(),(a.y2-a.y1)*factorY());
      entries.splice(6,0,["Line length",len.toFixed(3),"original pixel"],["Line length calibrated",um===null?"":(len*um).toFixed(3),"um"]);
    }
    const escapeCsv=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
    const content="\uFEFF"+entries.map(line=>line.map(escapeCsv).join(",")).join("\r\n");
    dl(new Blob([content],{type:"text/csv;charset=utf-8"}),"web-image-lab-results.csv");
  };
  const exportPng=()=>{
    if(!s.w)return;
    const c=document.createElement("canvas");c.width=s.w;c.height=s.h;const ctx=c.getContext("2d");
    ctx.drawImage(canvas,0,0);ctx.drawImage(overlay,0,0);
    c.toBlob(blob=>{if(blob)dl(blob,"web-image-lab-annotated.png");else announce("PNG 匯出失敗，請確認瀏覽器功能。");},"image/png");
  };
  const chooseLesson = () => {
    const type=lesson.value;
    activityCalibrate.hidden=type!=="calibrate";
    activityCount.hidden=type!=="count";
    activityIntensity.hidden=type!=="intensity";
    lessonSteps.textContent=lessonTips[type]||lessonTips.calibrate;
    lessonFeedback.textContent="請按照上述步驟操作。所有分析與記錄皆在目前瀏覽器分頁進行。";
  };
  const lineLengthOriginal = () => {
    if(!s.w||s.selection?.type!=="line")return null;
    const a=s.selection;
    return Math.hypot((a.x2-a.x1)*factorX(),(a.y2-a.y1)*factorY());
  };
  const setCalibratedScale = () => {
    const linePx=lineLengthOriginal(),known=Number(knownLength.value);
    if(linePx===null||linePx<3){lessonFeedback.textContent="請先在影像上切換至「直線量測」，畫出至少 3 原始 px 的已知長度。";return;}
    if(knownLength.value.trim()===""||!Number.isFinite(known)||known<=0){
      lessonFeedback.textContent="請輸入正確的已知長度（µm）；合成圖沒有天然的真實比例尺。";return;
    }
    const next=known/linePx;
    if(next<0.000001||next>100000){lessonFeedback.textContent="計算出的 µm/pixel 超出教學工具接受的範圍，請核對輸入。";return;}
    scale.value=String(Number(next.toPrecision(10)));
    invalidateReview();refreshStats();
    lessonFeedback.textContent="校正已設定："+format(next,6)+" µm/原始 px（已知 "+format(known,3)+" µm ÷ "+format(linePx,3)+" 原始 px）。請確認選線確實對應影像的實際尺度。";
  };
  const checkReferenceCount = () => {
    if(training.image!=="benchmark"){lessonFeedback.textContent="請先載入本站提供的 12 顆合成基準圖，其他影像沒有固定標準答案。";return;}
    if(!s.analyzed){lessonFeedback.textContent="請先在「Threshold 與計數」區按下連通顆粒分析。";return;}
    const observed=s.components.length;
    lessonFeedback.textContent=observed===12 ?
      "與合成基準答案一致：12 顆。這只驗證目前設定對此特定合成影像的連通區計數，其他顯微影像仍須人工核對。":
      "目前計數 "+observed+" 顆；合成基準為 12 顆。請檢查 ROI 是否涵蓋整張圖、閾值、深淺方向及最小面積。";
  };
  const captureIntensity = kind => {
    if(!s.w||s.selection?.type!=="rect"){lessonFeedback.textContent="請先載入影像並框選矩形 ROI，再記錄灰階值。";return;}
    const st=roiStats(),snapshot={mean:st.mean,area:st.n*factorX()*factorY()};
    training[kind]=snapshot;invalidateReview();
    if(training.target&&training.background){
      const diff=training.target.mean-training.background.mean;
      lessonFeedback.textContent="目標："+format(training.target.mean,3)+"；背景："+format(training.background.mean,3)+"；Δgray（目標－背景）＝"+format(diff,3)+" / 255。此值可能為負，反映兩區域的相對亮度差。";
    }else{
      lessonFeedback.textContent=(kind==="target"?"目標":"背景")+" ROI 平均灰階 "+format(snapshot.mean,3)+" 已暫存；請另外框選另一個區域。";
    }
  };
  const recordCurrent = () => {
    if(!s.w)return;
    if(training.records.length>=50){announce("此分頁紀錄已達 50 筆上限，請匯出並清除後再記錄。");return;}
    const um=validScale(),line=lineLengthOriginal(),st=s.selection?.type==="line"?null:roiStats();
    let type,result,unit,details;
    if(lesson.value==="intensity" && training.target && training.background){
      type="target-background gray";result=training.target.mean-training.background.mean;unit="gray (0-255)";
      details="target="+training.target.mean.toFixed(3)+";background="+training.background.mean.toFixed(3);
    }else if(line!==null){
      type="line length";result=um===null?line:line*um;unit=um===null?"original px":"um";
      details="line original px="+line.toFixed(3);
    }else if(s.analyzed){
      type="connected component count";result=s.components.length;unit="objects";
      details="threshold="+threshold.value+";polarity="+polarity.value+";min original px2="+minArea.value;
    }else{
      type="ROI mean gray";result=st.mean;unit="gray (0-255)";
      details="ROI area original px2="+(st.n*factorX()*factorY()).toFixed(3);
    }
    training.records.push({number:training.records.length+1,type,result,unit,calibration:um,reviewed:reviewed.checked,source:training.image,details});
    const tr=document.createElement("tr");
    [training.records.length,type,format(result,3)+" "+unit,um===null?"未校正":format(um,6)+" µm/px",reviewed.checked?"學生自我核對":"尚未核對"].forEach(v=>{
      const td=document.createElement("td");td.textContent=String(v);tr.appendChild(td);
    });
    if(training.records.length===1)recordRows.textContent="";
    recordRows.appendChild(tr);
    exportRecordsButton.disabled=false;clearRecordsButton.disabled=false;
    lessonFeedback.textContent="已保存第 "+training.records.length+" 筆本機量測快照。請下載 CSV 留存；關閉或重新整理頁面會清除。";
  };
  const exportNotebook = () => {
    if(!training.records.length)return;
    const lines=[["Record","Measurement","Value","Unit","Scale_um_per_original_px","Self_reviewed","Source","Parameters"],
      ...training.records.map(rec=>[rec.number,rec.type,rec.result.toFixed(6),rec.unit,rec.calibration===null?"uncalibrated":rec.calibration.toFixed(9),rec.reviewed?"yes":"no",rec.source,rec.details])];
    const safeCsv = v => '"'+String(v??"").replace(/"/g,'""')+'"';
    const output="\\uFEFF"+lines.map(line=>line.map(safeCsv).join(",")).join("\\r\\n");
    dl(new Blob([output],{type:"text/csv;charset=utf-8"}),"web-image-lab-teaching-records.csv");
  };
  file.addEventListener("change",()=>{
    const f=file.files?.[0];if(!f)return;
    if(!["image/png","image/jpeg","image/webp"].includes(f.type)){announce("請選擇 PNG、JPEG 或 WebP 格式影像。");return;}
    if(f.size>25*1024*1024){announce("檔案超過 25 MB，請先縮小再操作。");return;}
    const key=++s.loadVersion,url=URL.createObjectURL(f),img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);if(key!==s.loadVersion)return;ingest(img,img.naturalWidth,img.naturalHeight,"本機影像");};
    img.onerror=()=>{URL.revokeObjectURL(url);if(key===s.loadVersion)announce("無法解碼影像，請改用 PNG／JPEG／WebP。");};
    img.src=url;
    announce("正在本機解碼影像…");
  });
  demo.addEventListener("click",()=>{s.loadVersion++;file.value="";const c=generateDemo();ingest(c,c.width,c.height,"合成教學影像（非真實檢體）","demo");});
  benchmarkButton.addEventListener("click",loadBenchmark);
  openBenchmark.addEventListener("click",loadBenchmark);
  checkBenchmark.addEventListener("click",checkReferenceCount);
  lesson.addEventListener("change",chooseLesson);
  calibrateButton.addEventListener("click",setCalibratedScale);
  saveTarget.addEventListener("click",()=>captureIntensity("target"));
  saveBackground.addEventListener("click",()=>captureIntensity("background"));
  resetIntensity.addEventListener("click",()=>{
    training.target=null;training.background=null;lessonFeedback.textContent="已清除目前影像的目標與背景灰階比較。";
  });
  recordButton.addEventListener("click",recordCurrent);
  exportRecordsButton.addEventListener("click",exportNotebook);
  clearRecordsButton.addEventListener("click",resetNotebook);
  clear.addEventListener("click",reset);
  modeButtons.forEach(b=>b.addEventListener("click",()=>selectMode(b.dataset.wiMode)));
  all.addEventListener("click",()=>{if(!s.w)return;selectMode("rect");s.selection={type:"rect",x:0,y:0,w:s.w,h:s.h};render();});
  overlay.addEventListener("pointerdown",pointerDown);
  overlay.addEventListener("pointermove",pointerMove);
  overlay.addEventListener("pointerup",pointerEnd);
  overlay.addEventListener("pointercancel",()=>{s.drag=false;s.start=null;render();});
  scale.addEventListener("input",()=>{invalidateReview();refreshStats();});
  [threshold,polarity,preview].forEach(el=>el.addEventListener("input",()=>{
    thresholdValue.value=threshold.value;resetResults();invalidateReview();render();
  }));
  minArea.addEventListener("input",()=>{resetResults();invalidateReview();render();});
  analyze.addEventListener("click",countParticles);
  csv.addEventListener("click",exportCsv);
  png.addEventListener("click",exportPng);
  setLoaded(false);drawHistogram();
})();