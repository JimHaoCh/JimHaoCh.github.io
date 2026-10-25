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
add("web-wbc-lite",`
白血球分類與 100-Cell Differential Count || White blood cell classification and 100-cell differential count
醫技系臨床血液學與鏡檢教學專用 || For clinical hematology and microscopy teaching
觀察經專家標註的單一白血球顯微影像，練習五種成熟白血球分類、累計 100 顆細胞並檢查誤判。另提供不需上傳伺服器的血液抹片人工計數模式。 || Examine expert-labeled individual leukocyte images, practice classification of five mature WBC types, complete a 100-cell differential and review mistakes. A manual blood smear count mode processes user images locally.
教學用途： || Educational use:
PBC 是正常周邊血細胞的已裁切資料集，隨機平衡題庫的各類比例不代表病人血液 differential。此網站提供選用的實驗性 kNN AI 比較，但沒有 WBC-NCA 正式分類模型或整張抹片白血球定位功能；不得作為臨床檢驗依據。 || PBC comprises cropped images of normal peripheral blood cells. Balanced quiz categories do not represent an actual patient's differential. The optional kNN comparison is experimental; this version has neither a validated WBC-NCA classifier nor whole-smear WBC localization. It is unsuitable for clinical testing.
01　細胞形態學習 || 01 Cell morphology learning
02　Differential 練習 || 02 Differential practice
03　抹片手動計數 || 03 Manual smear count
細胞形態辨識 || Cell morphology identification
依照細胞核、細胞質與顆粒特徵學習，再觀察 PBC 專家標註影像。 || Study nuclear, cytoplasmic and granule features, then examine expert-labeled PBC images.
載入 PBC 真實影像 || Load real PBC images
示意圖 · Schematic illustration || Schematic illustration
Neutrophil · 嗜中性球 || Neutrophil
預設顯示程式繪製之形態示意圖；若成功載入 PBC，才顯示真實顯微影像。 || Default images are programmatically drawn diagrams. Real microscopy images appear only after PBC data has loaded.
每張影像判讀一種白血球；系統紀錄你的選擇並和專家標籤比較。 || Classify each single-cell image; your answers will be compared with expert labels.
尚未開始 || Not started
20 題（練習） || 20 questions (practice)
50 題（練習） || 50 questions (practice)
100 題（標準模式） || 100 questions (standard mode)
載入 PBC 真實鏡檢題庫 || Load real PBC microscopy quiz
使用形態示意圖練習 || Practice with schematic cells
PBC 模式需連線至公開 Hugging Face Dataset Viewer API，影像由該資料來源提供；若外部服務無法連線，可使用內建示意題庫練習操作。 || PBC mode retrieves images via the public Hugging Face Dataset Viewer API. If that service is unavailable, use the built-in schematic quiz.
目前正確率 — || Current accuracy —
請判斷這顆白血球： || Identify this white blood cell:
下一題 || Next question
影像載入失敗：跳過此題 || Image failed to load: skip question
鍵盤 1–5 可快速作答。題庫中不同類別的數量刻意平衡，方便練習辨識，不作為健康人群參考比例。 || Press 1–5 to answer. Categories are intentionally balanced for training and do not reflect reference leukocyte proportions.
分類結果與錯題回顧 || Results and mistake review
混淆矩陣（列：標準答案；欄：學生判斷） || Confusion matrix (rows: expert label; columns: student answer)
需要複習的細胞 || Cells to review
下載作答記錄 CSV || Download answer records (CSV)
重新練習 || Restart practice
整張抹片人工計數 || Manual whole-smear counting
選擇本機血液抹片照片，點選細胞中心並指定類別。此模式沒有教師標準答案。 || Load a blood-smear image locally, click cell centers and assign classes. This mode has no expert answer key.
先選擇要標記的細胞類型，再點選照片。最多可記錄 100 顆；點錯可「復原上一顆」。檢體照片僅保留於目前瀏覽器記憶體，重新整理即清除。 || Choose a cell class, then click the photograph. Up to 100 cells can be recorded; use Undo for mistakes. Sample images remain in this tab's memory and disappear on reload.
目前標記類型 || Current annotation class
復原上一顆 || Undo last cell
重設計數 || Reset count
網站已就緒。選擇學習、題庫或人工計數模式。 || Ready. Choose morphology learning, quiz or manual counting mode.
資料來源與使用限制 || Sources and usage limitations
. 原始資料由 Hospital Clínic de Barcelona 提供，CC BY 4.0。此工具使用 || The original dataset was provided by Hospital Clínic de Barcelona under CC BY 4.0. This tool uses
Nirschl Lab / MicroBench 整理版本 || Nirschl Lab / MicroBench curated dataset
，並另引用 || and also cites
。圖片依來源授權標示歸屬。 || Image credits follow their respective source licenses.
五類白血球：Neutrophil、Lymphocyte、Monocyte、Eosinophil、Basophil。PBC 另有 Immature Granulocyte、Erythroblast、Platelet，此版題目僅挑選五類成熟 WBC。完整血液分類應依臨床實驗室 SOP 對未成熟細胞、NRBC、異常細胞等另行處理。 || Five mature WBC types are included: neutrophils, lymphocytes, monocytes, eosinophils and basophils. PBC also contains immature granulocytes, erythroblasts and platelets; these are excluded from this quiz. Follow clinical laboratory SOPs for immature, nucleated red and atypical cells.
`);
add("web-hemocytometer",`
血球計數盤互動分析 || Interactive hemocytometer analysis
醫技系鏡檢課專用：上傳計數盤顯微鏡照片，框選指定大格，利用瀏覽器內的 Python/OpenCV 圈出候選細胞，手動修正後計算 cells/µL 與 cells/mL。支援 RBC、WBC、細胞培養計數練習。 || Built for microscopy teaching: upload a counting chamber image, select the relevant large square, identify cell candidates with browser-side Python/OpenCV, manually review them and calculate cells/µL and cells/mL. Supports RBC, WBC and cell culture exercises.
教學驗證版本： || Educational validation prototype:
自動辨識可能受格線、細胞重疊、染色和影像品質影響。所有候選細胞均須人工確認；僅作課堂練習及方法展示，不提供臨床檢驗或診斷結果。 || Gridlines, overlapping cells, stains and image quality affect detection. All candidates require manual verification. For coursework and demonstration only; no clinical testing or diagnosis.
影像與計數設定 || Image and counting settings
載入合成計數盤範例（可直接試用） || Load synthetic counting chamber demo
計數盤模式 || Chamber counting mode
Cell Culture｜1 個大格（1 mm²） || Cell culture · One large square (1 mm²)
WBC｜1 個角落大格（1 mm²） || WBC · One corner large square (1 mm²)
RBC｜中央 5 個中格（合計 0.20 mm²） || RBC · Five central medium squares (total 0.20 mm²)
框選完整一個 1 × 1 mm 大格；可以逐張照片加入多個計數區。 || Select one complete 1 × 1 mm large square. Counting regions can be added from multiple photographs.
目標與背景 || Target and background
深色細胞・明亮背景 || Dark cells · Bright background
明亮細胞・深色背景 || Bright cells · Dark background
局部閾值偏移 || Local threshold offset
最小細胞面積 (px²) || Minimum cell area (px²)
最大細胞面積 (px²) || Maximum cell area (px²)
線條抑制與圓形度篩選屬於初版影像處理策略；不同顯微鏡照片需調整參數。原始圖片僅在裝置上處理。 || Line suppression and circularity filtering are preliminary processing methods. Tune parameters for different images. Original images are processed only on-device.
框選、辨識及修正 || Select, detect and correct
先拖曳框選完整的 || First drag to select an entire
。RBC 模式會自動顯示中央 5 × 5 區域，只計入四角和中央的五個中格。 || RBC mode displays a central 5 × 5 grid and includes the four corner and center medium squares.
▢ 框選計數區 || ▢ Select counting region
＋ 增加細胞 || + Add cell
－ 刪除細胞 || − Remove cell
自動圈選候選細胞 || Automatically identify candidate cells
清空候選標記 || Clear candidate markers
請上傳照片，或開啟合成範例。 || Upload a photo or load the synthetic demo.
計入 || Included
排除／不計入 || Excluded / not counted
目前指定區域 || Active counting region
計數盤與人工校對 || Counting chamber and manual verification
手機操作：在「框選計數區」模式中，按住拖曳畫出大格；分析後可切換「增加細胞」或「刪除細胞」以觸控修正。 || On mobile, drag across the large square in the region-selection mode. After analysis, use Add cell or Remove cell to correct annotations.
本視野納入細胞 || Included cells in this field
排除或非目標區域 || Excluded or outside counting regions
本視野計數面積 || Counting area for this field
將這一格加入總計 || Add this square to the total
下載標記影像 PNG || Download annotated PNG
多視野統計與細胞濃度 || Multi-field summary and cell concentration
同一個檢體可連續加入不同照片中的計數格。WBC 典型練習需計數四個角落大格；RBC 每一張可框選中央大格，程式自動選出五個中格。請避免重複拍攝同一區域。 || Combine counting squares from separate images of the same specimen. Typical WBC exercises count four corner large squares; RBC mode selects five central medium squares. Avoid counting the same region twice.
累計細胞數 || Cumulative cell count
計數視野 || Counting fields
濃度公式：總細胞數 × 稀釋倍率 ÷（總計數面積 × 計數室深度）。 || Concentration = total cells × dilution factor / (total counted area × chamber depth).
視野 || Field
細胞數 || Cell count
面積 (mm²) || Area (mm²)
來源 || Source
尚未加入計數視野 || No counting fields added yet
移除最後一個視野 || Remove last field
清空本次統計 || Clear current session
下載統計 CSV || Download summary CSV
Neubauer 計數規則 || Neubauer counting rules
計數線上細胞採 || For cells touching boundary lines, use
上、左納入；下、右排除 || include top and left; exclude bottom and right
，避免在相鄰計數區重複計數。圖片中會以綠色標記納入的細胞，紅色標記排除的候選物件。 || to prevent double counting across adjacent areas. Green indicates included cells; red indicates excluded candidates.
標準 Improved Neubauer 計數室深度為 0.1 mm。WBC 計四個 1 mm² 大格共 4 mm²；RBC 計中央五個 0.04 mm² 中格共 0.20 mm²。 || A standard Improved Neubauer chamber has a 0.1 mm depth. WBC exercises cover four 1 mm² large squares (4 mm² total), and RBC exercises cover five 0.04 mm² medium squares (0.20 mm² total).
教學限制與下一版 || Educational limitations and planned work
本版以手動選取格線確保計數面積，以 OpenCV 偵測細胞候選物件。細胞重疊、斷裂格線、非圓形細胞和 Trypan Blue 活死細胞分類尚未完成準確度驗證。 || Users select grid boundaries manually to establish counting area; OpenCV detects cell candidates. Accuracy for overlapping cells, broken gridlines, irregular cells and Trypan Blue viability has not been validated.
預計下一版評估自動格線偵測、群聚細胞分割、Trypan Blue Live/Dead 判讀和教師評分模式。 || Future evaluations may include automatic grid detection, clustered-cell segmentation, Trypan Blue live/dead classification and instructor scoring.
`);

add("web-imagej",`
鏡檢影像分析教學 || Microscopy image analysis teaching
第三版在原創瀏覽器影像工作台中新增三種引導式教學練習：比例尺校正、12 顆合成粒子計數，以及目標／背景灰階比較；可保存本機量測紀錄並匯出 CSV。進階 ImageJ 功能仍以外部連結前往 ImJoy 團隊提供的 ImageJ.JS。 || Version 0.3 of our original browser-side image workspace offers guided exercises in scale calibration, counting 12 synthetic particles, and comparing target/background gray levels. Local measurement records can be exported as CSV. Advanced ImageJ functions are available through an external link to the ImJoy team's ImageJ.JS.
使用前請留意 || Read before using
本站自製 Web-Image Lab 採原生 JavaScript Canvas，影像在您的瀏覽器中處理，程式未加入影像上傳接口或第三方分析函式庫。完整 ImageJ.JS 由第三方 ImJoy 團隊提供；本網站沒有託管、修改、複製或嵌入 ImageJ.JS、CheerpJ 及其插件。點擊外部連結後會離開本站，資料處理方式依外部服務政策。 || The original Web-Image Lab workspace runs with native JavaScript Canvas in your browser and has no image-upload endpoint or third-party analysis library. The full ImageJ.JS is provided separately by the ImJoy team. This website does not host, modify, copy or embed ImageJ.JS, CheerpJ or their plugins. External sites apply their own data-processing policies.
開啟第三版影像工作台 || Open v0.3 image workspace
前往完整 ImageJ.JS || Open full ImageJ.JS (external)
查看 ImageJ 專案介紹 || View the ImageJ project page
本站工作台是教學用的簡易分析原型，支援桌面與觸控操作；瀏覽器差異仍需實機測試。學生量測結果需人工核對，合成基準圖的標準答案僅適用於該固定測試影像。 || This teaching prototype supports desktop and touch interaction; browser compatibility requires device testing. Verify student measurements manually. Reference answers for synthetic benchmarks apply only to the fixed example image.
課堂操作流程 || Classroom workflow
可先在本站工作台完成基本練習；以下提及的 ImageJ 選單名稱，則對應外部完整版 ImageJ.JS。 || Complete introductory exercises in the original workspace. ImageJ menu names below refer to the external full ImageJ.JS application.
開啟網頁版 || Open the browser workspace
點選上方「本站影像分析工作台」進行本機練習；進階功能可另開第三方 ImageJ.JS。 || Open the local image workspace above for exercises; use the separate ImageJ.JS link for advanced features.
讀入練習影像 || Load an exercise image
於本站使用「合成細胞示範」或上傳 PNG／JPEG／WebP；外部 ImageJ.JS 可以使用 File → Open。 || Use the synthetic cell demo or load PNG, JPEG or WebP files here; the external ImageJ.JS provides File → Open.
設定比例與 ROI || Calibrate scale and ROI
在本站輸入經確認的 µm/pixel，再拖曳矩形 ROI 或直線；外部 ImageJ 可使用 Analyze → Set Scale。 || Enter a verified µm/pixel value, then drag a rectangular ROI or line. In full ImageJ, use Analyze → Set Scale.
量測與紀錄 || Measure and record
在本站調整 Threshold 後執行連通區計數，再匯出 CSV／PNG；外部 ImageJ 可使用 Analyze → Measure 或 Analyze Particles。 || Adjust the threshold, count connected components and export CSV or PNG. Full ImageJ offers Analyze → Measure and Analyze Particles.
建議教學練習 || Suggested classroom exercises
細胞大小與形態量測 || Cell dimensions and morphology
設定已知長度與 µm/pixel，以矩形 ROI 取得面積、灰階統計，或以直線工具量測長度。此版沒有單顆細胞自動周長與長軸估算。 || Calibrate a known distance in µm/pixel. A rectangular ROI provides area and grayscale statistics; a line tool measures length. Per-cell automated perimeter and major-axis estimates are not included.
核心概念：Pixel-to-µm calibration · ROI || Key concepts: pixel-to-µm calibration and ROI
細胞／顆粒計數 || Cell / particle counting
利用 12 顆合成圓形基準圖調整 Threshold 與最小面積，觀察連通區數量與參數的關係。 || Use the 12-circle synthetic benchmark to test threshold and minimum area settings and observe changes in connected-component count.
核心概念：Segmentation · Size filtering || Key concepts: segmentation and size filtering
染色與影像強度 || Staining and image intensity
分別擷取目標及背景 ROI 的平均灰階，計算兩者差值，討論曝光與背景的影響。 || Measure mean gray values in target and background ROIs; compare the difference and discuss exposure and background effects.
核心概念：Mean gray value · Background || Key concepts: mean gray value and background
資料使用、軟體來源與學術引用 || Data usage, attribution and scholarly citations
資料保護與判讀界線 || Privacy and interpretation boundaries
僅使用教師提供的範例、合成影像或確認可公開使用的素材。 || Use instructor-provided samples, synthetic examples or materials cleared for public use.
請勿在第三方網頁上傳可識別病人身分的臨床檢體影像、病歷資訊或其他機敏資料。 || Do not upload identifiable clinical specimens, patient records or other sensitive data to third-party sites.
外部服務與插件可能有各自的資料傳輸流程；使用前應確認其政策與功能。本站無法保證外部處理完全限於本機。 || External services and plugins may transfer data according to their own policies. Review these before use; this site cannot guarantee local-only processing by third parties.
練習結果須人工檢查；本教學入口及外部軟體均未由本站驗證為臨床檢驗或診斷系統。 || Review all exercise results manually. Neither this portal nor the linked external software is validated by our laboratory for clinical diagnosis.
專案來源與致謝 || Software attribution and acknowledgments
由 || is developed by
開發。本站自製工作台採原生瀏覽器程式碼；ImageJ.JS 部分僅提供名稱介紹、教學導引與對外連結，未使用對方的程式碼、商標圖像或截圖，也未表示雙方具有合作或官方認證關係。 || . Our original workspace uses native browser code. We refer to ImageJ.JS by name for educational guidance and external links; no ImageJ.JS source, logo or screenshots are incorporated, and no partnership or endorsement is implied.
建議引用：Ouyang W, Mueller F, Hjelmare M, et al. || Suggested citation: Ouyang W, Mueller F, Hjelmare M, et al.
ImageJ 專案頁面 ↗ || ImageJ project page
ImageJ.JS 原始專案 ↗ || ImageJ.JS source repository
原開發團隊網頁版 ↗ || Original team's web application
線上工具 || Online tools
ImageJ.JS 教學入口 || ImageJ.JS learning portal
本機分析工作台 || Local image analysis workspace
第三版增加三組引導式練習：比例尺校正、合成顆粒計數、目標與背景灰階差。每筆記錄附上分析參數，方便課堂討論、人工核對與匯出。所有影像分析留在目前瀏覽器分頁。 || Version 0.3 adds guided exercises in scale calibration, synthetic particle counting and target/background grayscale differences. Each measurement record includes analysis settings for review and export. Processing remains in this browser tab.
前往第三方完整 ImageJ.JS || Open the external full ImageJ.JS
影像由此頁原生 JavaScript Canvas 在瀏覽器內運算；本分析程式不包含影像上傳、遠端 AI 模型或外部影像處理函式庫。請使用合成影像或已去識別化教學資料，避免載入含病人個資的圖片。重新整理將清除目前的量測紀錄，請自行下載。分析結果需人工核對，不能作為臨床診斷依據。外部 ImageJ.JS 連結會離開本站。 || Images are processed locally with native JavaScript Canvas, without image uploads, remote AI models or external image-processing libraries. Use synthetic or de-identified teaching images. Reloading clears current records; export them first. Verify results manually; this software is not intended for clinical diagnosis. The external ImageJ.JS link leads to another website.
引導式教學練習 || Guided classroom exercises
選擇練習主題。流程提示只使用目前瀏覽器內的影像與量測結果，沒有線上評分或資料上傳。 || Choose an exercise topic. The guidance uses only images and results in this tab, without online scoring or upload.
教學主題 || Exercise topic
A · 比例尺與長度校正 || A · Scale and length calibration
B · 12 顆合成粒子計數 || B · Count 12 synthetic particles
C · 目標／背景灰階差 || C · Target / background grayscale difference
1. 開啟合成示範圖或已知比例尺影像。2. 使用「直線量測」框出已知距離。3. 輸入距離（µm）後計算校正值，並保存量測紀錄。 || 1. Load the synthetic demo or an image with a known scale. 2. Draw a line over a known distance. 3. Enter its length in µm, calibrate and save a record.
選取直線代表的已知長度（µm） || Actual length represented by the selected line (µm)
依直線設定 µm/pixel || Calibrate µm/pixel from line
載入基準圖（12 個深色圓形） || Load 12-dark-circle benchmark
核對 12 顆基準答案 || Check reference count of 12
記錄目前 ROI 為目標 || Record current ROI as target
記錄目前 ROI 為背景 || Record current ROI as background
清除灰階比較 || Clear intensity comparison
完成一個步驟後，這裡會顯示操作結果與核對提醒。 || Completion feedback and review reminders appear here.
讀入影像（PNG / JPEG / WebP） || Load image (PNG / JPEG / WebP)
合成細胞示範 || Synthetic cell demo
12 顆基準圖 || 12-particle benchmark
尚未讀入影像。可先使用合成示範圖。 || No image loaded. You can start with the synthetic demo.
校正值：原始影像每像素的長度（µm/pixel） || Scale: physical length per source-image pixel (µm/pixel)
請由顯微鏡比例尺或已知尺度自行校正；大圖為了效能可能縮圖分析，程式會換算回原始影像的像素尺度。 || Calibrate from a microscope scale bar or known feature. Large images may be resized for performance, with measurements converted back to original-image pixel units.
ROI 與量測 || ROI and measurements
矩形 ROI || Rectangular ROI
直線量測 || Line measurement
全影像 ROI || Whole-image ROI
在影像上以滑鼠或觸控拖曳。矩形 ROI 支援灰階統計及粒子計數；直線模式量測長度。一次顯示一個 ROI。 || Drag across the image with mouse or touch. Rectangular ROIs support grayscale statistics and particle counting; line mode measures distance. One ROI is displayed at a time.
選取影像後顯示 ROI 統計。 || ROI statistics appear after selecting an image.
Threshold 與計數 || Threshold and counting
閾值 || Threshold
目標像素 || Target pixel intensity
深色目標（灰階 ≤ 閾值） || Dark targets (grayscale ≤ threshold)
淺色目標（灰階 ≥ 閾值） || Light targets (grayscale ≥ threshold)
顯示二值化覆蓋層 || Show binary threshold overlay
最小連通區面積（原始 pixel²） || Minimum connected-component area (original pixel²)
分析連通顆粒（8-connected） || Count 8-connected particles
此演算法以灰階閾值及 8 鄰接連通區計數，適合基本教學；重疊細胞、雜訊與背景不均可能造成合併、漏計或誤計。 || This introductory algorithm uses grayscale thresholding and 8-connected components. Overlaps, noise and uneven backgrounds can merge particles or cause missed and false counts.
請上傳影像或開啟合成示範 || Upload an image or start the synthetic demo
本工具不需要帳號與影像上傳服務 || No account or image-upload service is required
計數結果 || Counting result
尚未讀入影像。 || No image loaded.
顆粒計數結果（最多顯示前 100 筆） || Particle count results (first 100 records)
面積（pixel²） || Area (pixel²)
中心 X（pixel） || Centroid X (pixel)
中心 Y（pixel） || Centroid Y (pixel)
每筆記錄保存當下 ROI、校正、閾值或灰階結果的數值快照。切換影像會清除舊紀錄；沒有伺服器同步。 || Each record stores a snapshot of ROI, scale, threshold or grayscale settings and results. Switching images clears previous records; no server synchronization is used.
記錄目前結果 || Save current result
下載教學紀錄 CSV || Download classroom records CSV
已自行核對目前 ROI、比例尺及可見目標（人工核對勾選，不代表軟體驗證通過） || I have manually reviewed the ROI, scale and visible targets (self-check only; no software validation implied)
此分頁的量測快照（最多 50 筆） || Measurement snapshots in this tab (up to 50)
序號 || Index
量測類型 || Measurement type
結果 || Result
校正 || Calibration
尚未保存量測紀錄 || No saved measurements yet
為避免無意洩漏檢體資訊，教學紀錄不收集姓名、學號、檔名或圖片內容；下載 CSV 僅包含測量數值和設定。校正後的長度／面積須與真實比例尺相符才具物理意義。 || To limit disclosure, classroom records exclude names, student IDs, filenames and image content. CSV exports contain measurements and settings only. Physical length and area values require a valid scale calibration.
功能範圍與進階分析 || Features and advanced analysis
目前支援瀏覽器可解碼的 PNG、JPEG、WebP；另有本站程式自行繪製的 12 顆教學基準圖。像素尺度會換算回原始影像，但超過最大工作尺寸的影像經重取樣後，ROI 與連通區分析仍會受工作解析度影響；原始像素換算不能還原已損失的影像細節。分析與標註 PNG 使用工作解析度。TIFF stack、Z-stack、ROI Manager、ImageJ Macro 與進階分割屬第三方完整版 ImageJ.JS 的功能範圍，請由外部網站入口操作。此工具沒有引入 ImageJ.JS、CheerpJ 或任何第三方程式碼。 || Browser-decodable PNG, JPEG and WebP files are supported, along with an original 12-particle benchmark. Pixel dimensions are mapped to the original image, although resampling oversized inputs reduces working resolution and can affect ROI and particle results. Lost detail cannot be restored by coordinate conversion. Annotated PNGs use working resolution. TIFF stacks, Z-stacks, ROI Manager, ImageJ macros and advanced segmentation are features of the separate full ImageJ.JS; this workspace incorporates no ImageJ.JS, CheerpJ or third-party code.
回到 ImageJ.JS 教學入口 || Return to ImageJ.JS learning portal
ImageJ.JS 專案介紹 ↗ || ImageJ.JS project page
本站原創程式碼 ↗ || Original site source code
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
