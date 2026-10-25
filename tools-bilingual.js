/* Bilingual Chinese / English companion copy for NYCU teaching tools.
   Original DOM, IDs, algorithms, file contents and event handlers remain untouched. */
(()=>{
"use strict";
const dict={};
const add=(group,lines)=>{const map=new Map();for(const row of lines.trim().split("\n")){const at=row.indexOf(" || ");if(at>=0)map.set(row.slice(0,at).trim(),row.slice(at+4).trim());}dict[group]=map;};
add("common",`
線上工具 || Online Tools
影像與校正 || Image and calibration
人工修正 || Manual correction
影像視野 || Image viewer
自動辨識 || Automated detection
尚無結果 || No results yet
尚無計數結果 || No counting results yet
匯出 CSV || Export CSV
下載 CSV || Download CSV
清除影像 || Clear image
清除紀錄 || Clear records
下載標註 PNG || Download annotated PNG
資料來源 || Data source
教學用途 || For teaching only
本機處理 · 教學用途 || Local processing · Educational use only
本機量測紀錄 || Local measurement records
`);
add("web-ast",`
抗生素感受性試驗｜Disk Diffusion Teaching Lab || Antibiotic susceptibility testing · Disk diffusion teaching lab
專供醫學檢驗暨生物技術學系臨床微生物學實驗教學。上傳 Kirby–Bauer 培養皿照片，自動偵測紙錠與抑菌圈候選邊界，完成毫米量測與人工修正。所有照片均在本機瀏覽器內處理。 || Designed for clinical microbiology laboratory classes in Medical Laboratory Science and Biotechnology. Upload a Kirby–Bauer plate photograph to detect candidate antibiotic disks and inhibition-zone boundaries, measure diameters in millimeters, and correct them manually. Images are processed locally in your browser.
教學用途／未經驗證 || Educational use / Not validated
抑菌圈邊界易受拍攝角度、陰影、重疊及菌落影響。請人工核對每個量測值。本版只輸出直徑，不自動產生 CLSI／EUCAST S／I／R 臨床解釋。 || Camera angle, shadows, overlapping zones and colonies can affect boundary detection. Verify every measurement manually. This version reports diameters only and does not assign clinical S/I/R categories under CLSI or EUCAST.
上傳照片與校正 || Upload and calibrate
Kirby–Bauer 培養皿照片 || Kirby–Bauer plate photograph
開啟合成示範平板 || Load synthetic demonstration plate
自動量測抑菌圈 || Detect and measure inhibition zones
建議由正上方拍攝，平板完整入鏡，減少反光；iPhone HEIC 的支援依瀏覽器版本而異。若自動辨識失敗，仍可手動新增、移動紙錠或調整邊界。 || Photograph the entire plate from directly above and minimize glare. HEIC support varies by browser. If automatic detection fails, add or reposition disks and adjust zone boundaries manually.
紙錠實際直徑 || Actual disk diameter
mm（常見為 6 mm） || mm (commonly 6 mm)
手動比例校正 || Manual scale calibration
pixels/mm，留空則由紙錠估算 || pixels/mm; leave blank to estimate from a disk
紙錠偵測門檻 || Disk detection threshold
亮度差／標準化後像素 || Intensity contrast / normalized pixel
請上傳平板照片，或先開啟合成示範平板。 || Upload a plate image or load the synthetic demonstration.
紙錠與抑菌圈修正 || Review disks and inhibition zones
選取／拖曳 || Select / drag
新增紙錠 || Add disk
刪除紙錠 || Delete disk
選取模式：點選紙錠後可拖曳中心；拖曳抑菌圈邊界可調整半徑。觸控手機也可操作。新加入紙錠需人工確認。 || In Select mode, drag a disk center to reposition it or drag the zone boundary to change its radius. Touch controls are supported. Verify all added disks manually.
選取紙錠編號／名稱 || Selected disk number / label
紙錠影像直徑 || Disk diameter in image
抑菌圈直徑 || Inhibition-zone diameter
mm（未確認時為空白） || mm (blank until confirmed)
清除選取抑菌圈 || Clear selected zone
重新偵測 || Run detection again
分析視野 || Analysis view
偵測紙錠 || Detected disk
自動抑菌圈候選 || Candidate inhibition zone
人工確認 || Manually confirmed
讀取影像後顯示紙錠數量、校正比例及量測結果。 || Disk count, scale calibration and measurements appear after loading an image.
紙錠 || Disk
直徑 (mm) || Diameter (mm)
狀態 || Status
尚無量測結果 || No measurements yet
下載標註圖片 || Download annotated image
查看示範參考值 || View demo reference values
量測流程 / Workflow || Measurement workflow
辨識圓形抗生素紙錠（影像對比及候選連通區）。 || Identify round antibiotic disks using image contrast and candidate connected components.
沿紙錠周圍進行環狀亮度分析，估計菌苔與透明抑菌區的交界。 || Analyze radial intensity around each disk to estimate the transition between bacterial lawn and clear inhibition zone.
以已知紙錠直徑或校正比例換算 mm，逐個檢查並手動修正。 || Convert measurements to millimeters using disk diameter or a calibrated scale, then inspect and correct each measurement.
教學判讀 / Interpretation || Teaching interpretation
抑菌圈直徑需包含紙錠本身。S／I／R 依菌種、抗生素、紙錠含量及 CLSI／EUCAST 版本判定；本版先練習量測和誤差來源。遇到雙層抑菌圈、菌落侵入及非典型邊界，應依對應標準進行人工判讀。 || Measure the full inhibition-zone diameter, including the disk. Clinical S/I/R interpretations depend on species, antimicrobial agent, disk potency and the applicable CLSI/EUCAST edition. This exercise focuses on measurement and error sources; unusual boundaries and colonies within zones require manual interpretation according to the relevant standard.
`);
add("web-casa-lite",`
NYCU · 醫技系鏡檢課專用 || NYCU · Medical Laboratory Microscopy Teaching
醫技系鏡檢課專用｜精子活動力教學平台 || Sperm motility teaching platform · Microscopy laboratory
本工具提供陽明交通大學醫學檢驗暨生物技術學系鏡檢課進行精子活動力觀察與 CASA 原理練習。上傳顯微鏡短片後，瀏覽器使用 Python + OpenCV 辨識精子頭部候選物件、追蹤運動軌跡，並估算 VCL、VSL、VAP、LIN、STR 等指標；影片於學生裝置本機處理。 || This educational platform supports sperm motility observation and computer-assisted sperm analysis (CASA) exercises in NYCU's microscopy curriculum. Upload a short microscopy video; browser-side Python and OpenCV detect candidate sperm heads, track trajectories, and estimate VCL, VSL, VAP, LIN and STR. Video processing takes place on the student's own device.
教學驗證原型 || Educational prototype requiring validation
｜辨識結果可能包含雜質；IM 為頭部低位移候選，無法可靠辨識僅有鞭毛擺動的 NP。不得用於臨床診斷或研究定量結論。 || Detected objects may include debris. The IM output identifies low-displacement head candidates and cannot reliably distinguish NP sperm with flagellar motion alone. Do not use these results for clinical diagnosis or validated research quantification.
影片與校正 || Video input and calibration
建議先用 1–3 秒、固定視野、明亮背景且精子頭部呈深色的影片。iPhone MOV 是否可解析取決於瀏覽器支援的編碼。 || Start with a 1–3-second video from a fixed field of view, with a bright background and dark sperm heads. iPhone MOV playback depends on browser codec support.
空間校正 || Spatial calibration
分析取樣率 || Analysis sampling rate
頭部閾值 || Head detection threshold
最大位移 || Maximum displacement
分析上傳影片 || Analyze uploaded video
執行合成影片示範 || Run synthetic video demo
就緒。請選擇影片，或先執行合成示範。 || Ready. Choose a video or run the synthetic demo.
自動辨識與軌跡 || Automated detection and trajectories
Trajectory overlay · 原型結果 || Trajectory overlay · Prototype output
軌跡顏色代表追蹤 ID。當沒有可靠 µm/pixel 校正值時，僅顯示像素速度；活動力分類停用。 || Each trajectory color represents one track ID. Without reliable µm/pixel calibration, velocities are shown in pixels and motility classification is disabled.
完成分析後將顯示追蹤數量、速度與活動力估計值。 || Track counts, speeds and estimated motility metrics will appear here.
匯出軌跡與 CASA CSV || Export trajectories and CASA data as CSV
判讀說明 || Understanding CASA parameters
總路徑長度 ÷ 追蹤時間 || Total curvilinear path length / tracking time
起終點距離 ÷ 追蹤時間 || Start-to-end displacement / tracking time
平滑平均路徑長度 ÷ 追蹤時間 || Smoothed average-path length / tracking time
原型限制與下一步 || Prototype limitations and future work
只針對深色精子頭部／亮背景做傳統影像偵測；需以實際人類精子影片校正。 || Classical image detection targets dark sperm heads on bright backgrounds and requires calibration using real human sperm videos.
以時間點 seek 取樣影片，可能遺漏快速運動或短暫交錯事件。 || Timestamp-based frame seeking may miss rapid movement or brief crossing events.
測試用 PR／NP／IM 門檻：VAP ≥20 µm/s 且 STR ≥60% 為 PR；VCL ≥5 µm/s 為 NP；其餘是頭部低位移 IM 候選。 || Software test thresholds: PR if VAP ≥20 µm/s and STR ≥60%; NP if VCL ≥5 µm/s; remaining tracks are low-head-displacement IM candidates.
這些門檻是軟體測試參數，尚未依 WHO 標準或教師標記驗證。 || These are software test thresholds and have not been validated against WHO criteria or instructor annotations.
`);
add("web-cfu-lite",`
菌落計數與 CFU/mL 教學平台 || Colony counting and CFU/mL teaching platform
醫技系臨床微生物學實驗專用 || For clinical microbiology laboratory teaching
以手機拍攝培養皿照片，自動標示候選菌落、手動修正數量，並練習定量培養的稀釋倍率換算。全部影像運算於瀏覽器本機進行。 || Photograph an agar plate using your phone, detect candidate colonies, adjust counts manually and practice quantitative culture dilution calculations. Image analysis runs in the local browser.
教學驗證原型： || Educational prototype:
辨識結果可能受到光照、菌落重疊、培養基與雜質影響。請先檢查標記結果並依實驗室 SOP 判讀；本工具不作為臨床報告或正式檢驗數據依據。 || Lighting, overlapping colonies, media and artifacts may influence detections. Verify the annotations and follow laboratory SOPs. These results are unsuitable for clinical reports or validated laboratory measurements.
影像輸入 || Image input
培養皿照片（JPG、PNG 等） || Agar plate photograph (JPG, PNG, etc.)
請盡量由正上方拍攝，避免強烈反光、陰影與斜角。HEIC 是否支援取決於裝置瀏覽器。 || Photograph directly from above; avoid glare, strong shadows and oblique angles. HEIC support depends on your browser.
載入合成菌落示範圖（72 個） || Load synthetic colony demo (72 colonies)
菌落相對培養基的明暗 || Colony contrast against agar
深色菌落／亮背景（預設） || Dark colonies / light background (default)
淺色菌落／暗背景 || Light colonies / dark background
辨識靈敏度 || Detection sensitivity
數字越小，偵測到的局部差異越多，也可能增加雜點。 || Lower numbers detect smaller local intensity differences and may introduce noise.
最小菌落面積 || Minimum colony area
最大菌落面積（px²） || Maximum colony area (px²)
開始自動圈選菌落 || Start automated colony detection
演算法使用局部亮度差、二值化及連通區域辨識。黏連菌落需人工分開計數。 || Detection uses local intensity contrast, thresholding and connected components. Joined colonies need manual correction.
檢視 || Inspect
調整培養皿 || Adjust plate boundary
＋ 新增菌落 || + Add colony
－ 刪除標記 || − Remove marker
請先載入照片。綠色標記為手動新增的菌落。 || Load an image first. Green markers indicate manually added colonies.
復原上一步 || Undo last action
顯示編號 || Show IDs
培養皿影像 || Plate image
青色＝自動偵測　綠色＝人工新增 || Cyan: automatic detection; green: manually added
請上傳培養皿照片，或先按「載入合成菌落示範圖」。 || Upload a plate photograph or load the synthetic colony demo.
目前總數 || Total count
手動修正 || Manual adjustments
匯出標記照片 PNG || Export annotated PNG
匯出菌落座標 CSV || Export colony coordinates CSV
05　定量培養與 CFU/mL 計算 || 05 Quantitative culture and CFU/mL calculation
適用於具已知稀釋倍數及接種體積的定量平板。 || For quantitative plates with known dilution and plated volume.
培養方式 || Culture method
請先選擇培養方式 || Select a culture method
定量平板（塗布／傾注培養） || Quantitative plate (spread / pour plate)
四區劃線／分離培養 || Four-quadrant streak / isolation culture
樣品稀釋度 || Sample dilution
10 的指數，例如 −4 代表 10⁻⁴ || Base-10 exponent (e.g. −4 means 10⁻⁴)
接種體積 || Plated volume
請載入影像、完成菌落計數並選擇定量培養。 || Load an image, count colonies and choose a quantitative culture method.
CFU/mL = 菌落數 ÷（接種體積 [mL] × 原樣品稀釋比例） || CFU/mL = colony count / [plated volume (mL) × sample dilution fraction]
教學常見可計數範圍為每皿 30–300 個菌落；實際標準須依課程指定的方法及 SOP 判斷。四區劃線分離培養不適用此換算。 || A common classroom countable range is 30–300 colonies per plate; use the method-specific course protocol and SOP. This calculation does not apply to isolation streak plates.
教學操作建議 || Suggested classroom workflow
① 載入照片與調整培養皿圓形範圍。② 使用自動辨識並觀察標記。③ 點擊「新增」或「刪除標記」修正重疊菌落和雜點。④ 確認定量培養方法及稀釋條件後計算 CFU/mL。 || 1. Load an image and set the circular plate boundary. 2. Run detection and inspect markers. 3. Add or remove annotations to correct touching colonies and artifacts. 4. Confirm culture and dilution settings, then calculate CFU/mL.
本版限制 || Version limitations
初版採局部亮度差與連通區域計數。影像有強烈反光、色差、菌落黏連、透明菌落、大片菌膜或高密度 TNTC 情況時，可能產生漏檢與重複計數。MCount 等進階演算法留待後續比較驗證。 || This version uses local intensity contrast and connected-component counting. Glare, unusual colors, touching or translucent colonies, confluent growth and TNTC plates can produce missed or duplicate counts. Algorithms such as MCount require further evaluation.
`);
/* LOCALE_EXTRA */
const slug=(location.pathname.split("/").filter(Boolean).find(p=>dict[p])||"common");
const map=new Map([...(dict.common||new Map()),...(dict[slug]||new Map())]);
const seen=new WeakMap();
const forbidden=node=>!node.parentElement||node.parentElement.closest("script,style,noscript,svg,.bf-en,[data-no-translate],textarea");
function translateText(node){
 if(!node||node.nodeType!==3||forbidden(node))return;
 const cn=node.textContent.trim();const en=map.get(cn);
 if(!en)return;
 if(node.parentElement.tagName==="OPTION"||node.parentElement.tagName==="TITLE"){
   const updated=cn+" / "+en;
   if(node.textContent!==updated){node.textContent=node.textContent.replace(cn,updated);}
   return;
 }
 const last=seen.get(node);
 if(last && last.cn===cn && last.span.isConnected)return;
 if(last && last.span.isConnected)last.span.remove();
 const span=document.createElement("span");span.className="bf-en";span.lang="en";span.textContent=en;
 node.parentNode.insertBefore(span,node.nextSibling);seen.set(node,{cn,span});
}
function scan(root){
 if(root.nodeType===3){translateText(root);return;}
 if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
 if(root.nodeType===1&&root.matches(".bf-en,script,style,noscript,svg,textarea"))return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const items=[];
 while((n=walker.nextNode()))if(/[\u3400-\u9fff]/.test(n.textContent))items.push(n);
 for(const t of items)translateText(t);
}
const init=()=>{
 scan(document.body);
 const observer=new MutationObserver(changes=>{
  for(const change of changes){
   if(change.type==="characterData")translateText(change.target);
   else for(const node of change.addedNodes)scan(node);
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
