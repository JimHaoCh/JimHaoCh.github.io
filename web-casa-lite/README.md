# Web-CASA Lite — 精子活動力鏡檢教學原型

**v0.1 技術驗證原型：未經臨床驗證，不能用於診斷或精液檢驗報告。**

## 網站
https://jimhaoch.github.io/web-casa-lite/

本專案是原有 Bioflumen & Xensor Lab GitHub Pages 儲存庫內的獨立子目錄，不改動實驗室首頁。

## 已實作
- 無後端的手機或桌面影片選擇及抽樣影格解析（HTML video + Canvas）。
- Web Worker 執行 Pyodide 0.29.5、NumPy、SciPy、OpenCV-Python。
- 傳統 adaptive threshold + connected components 尋找深色頭部候選物件。
- SciPy linear_sum_assignment 多目標配對及基本軌跡篩選。
- 計算 VCL、VSL、VAP、LIN、STR；彩色軌跡疊圖及 CSV 匯出。
- 具備合成運動影片示範，可以先檢查分析引擎是否載入。
- 本機影片處理；原始影片不會上傳到伺服器。初次使用需要下載 Pyodide 與套件。

## 使用方式
1. 首次開啟先按「執行合成影片示範」，確認 Python 環境載入並顯示軌跡。
2. 選擇 1–3 秒的明場顯微鏡影片，建議 MP4/H.264，固定載物台。
3. 輸入已由 stage micrometer 校正的 µm/pixel，並調整取樣 FPS。
4. 按「分析上傳影片」，完成後檢視候選軌跡與匯出 CSV。

## 重要限制
- 僅針對亮背景下深色精子頭部候選物件，可能混入雜質與其他顆粒。
- IM（頭部低位移）不能可靠識別有鞭毛擺動但頭部低位移的 NP。全自動比例是原型估計。
- 用 video element 依時間 seek 取樣，並非精準逐張解碼所有原始影格；可能漏掉快速事件。
- 需另行空間校正。未設定 µm/pixel 時只顯示 px/s，停用 PR/NP/IM。
- 暫用的教學程式判斷：VAP ≥ 20 µm/s 且 STR ≥ 60% 為 PR；其餘 VCL ≥ 5 µm/s 為 NP；其他為低位移 IM candidate。這不是 WHO 的臨床分類門檻。
- VAP 是固定短窗移動平均示例，不同採樣率或平滑方法可能造成明顯差異。
- 手機支援程度取決於 Safari/Chrome 版本、影片編碼、網路、下載量及可用 RAM；尚未完成實機驗證。

## 程式結構
- index.html：教學操作介面
- style.css：響應式樣式
- app.js：影片擷取、合成測試、結果呈現、CSV
- worker.js：Pyodide/OpenCV/SciPy 載入及分析執行緒
- analysis.py：偵測、線性配對、基本 CASA 運算

## 教室使用前待辦
- iPhone Safari／Android Chrome 冷啟動和記憶體實測
- 精子頭部與背景雜質的教師標註資料測試，評估 Precision、Recall
- 追蹤 ID Switch、速度偏差與人工 PR/NP/IM 判讀比較
- 不同倍率、手機配接、對比、濃度及樣本流動的影片驗證
- 明確識別靜止精子與原地擺動鞭毛的 NP
- 合法使用的示範教學影片及授權檢查

本程式為獨立撰寫的教學原型，未複製 OpenCASA、pycasa、Trackpy 或 Simple Sperm Analyzer 原始碼。

Third-party software: https://pyodide.org/ · https://opencv.org/ · https://numpy.org/ · https://scipy.org/

Bioflumen & Xensor Lab, National Yang Ming Chiao Tung University.
