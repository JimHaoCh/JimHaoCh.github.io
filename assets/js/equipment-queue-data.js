"use strict";
const QueueScenarios={
  "ed": {
    "a": "血液生化",
    "b": "hs-cTnI",
    "aTitle": "A｜電解質／血液生化",
    "bTitle": "B｜hs-cTnI 心肌標記",
    "aDesc": "協助評估代謝與腎功能等狀態。",
    "bDesc": "協助評估心肌損傷，需結合臨床資訊。",
    "note": "依臨床需求開單，並非每位病人都測兩項。序列採檢與複驗會增加實際工作量。",
    "mode": "同一分析位置一次處理一件檢體，不中斷已開始的反應。",
    "lesson": "快檢驗，也可能在慢檢驗後面排隊。",
    "intro": "同一平台支援不同卡匣，不代表每位病人都需要全部檢驗。整合還要考慮分析位置能否平行運作，以及急件的時間需求。",
    "questions": [
      [
        "需求是什麼？",
        "診所、小檢驗所、大醫院的來件量、急件比例與備援條件，有哪些差異？"
      ],
      [
        "何時需要結果？",
        "單次心肌標記結果，是否已足以完成病人的評估？序列採檢如何增加工作量？"
      ],
      [
        "整合到哪一層？",
        "該共用分析位置、設置獨立模組，還是分開分析、整合結果回報？"
      ]
    ],
    "quick": "一件 15 分鐘的 B 類剛開始，下一件 3 分鐘的 A 類來了。只有一個分析位置時，A 類可能接近 18 分鐘後才完成。",
    "sources": "<p><strong>真實資料：</strong>Abbott CHEM8+ 產品頁列分析時間約 2 分鐘；hs-TnI 約 15 分鐘。i-STAT 1 手冊的 Analysis Time 段落亦列不同卡匣的分析時間。</p><p><strong>模型設定：</strong>預設 A 類以 3 分鐘、B 類以 15 分鐘作占機時間近似，未加入裝卸卡匣。時限、來件量、固定成本與耗材點數皆為教學假設。以單槽資源比較；不代表特定型號的完整現場性能或臺灣許可範圍。</p><div class=\"source-links\"><a href=\"https://www.globalpointofcare.abbott/ww/en/product-details/apoc/istat-chem8plus.html\" target=\"_blank\" rel=\"noopener noreferrer\">Abbott｜i-STAT CHEM8+ 產品資料 ↗</a><a href=\"https://www.globalpointofcare.abbott/us/en/product-details/apoc/istat-hs-tni.html\" target=\"_blank\" rel=\"noopener noreferrer\">Abbott｜i-STAT hs-TnI 產品資料 ↗</a><a href=\"https://www.globalpointofcare.abbott/content/dam/ardx/globalpointofcare/apoc/support/hs-tni-resource-center/gb/i-STAT_1_System_Manual_UK_English_014331-01_66_A.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">Abbott｜i-STAT 1 System Manual，Analysis Time ↗</a><a href=\"https://www.acc.org/latest-in-cardiology/ten-points-to-remember/2021/10/27/14/06/2021-guideline-for-chest-pain-gl_chestpain\" target=\"_blank\" rel=\"noopener noreferrer\">ACC｜2021 胸痛評估指引重點：序列 troponin ↗</a></div>"
  },
  "resp": {
    "a": "CRP",
    "b": "病原核酸",
    "aTitle": "A｜CRP 發炎指標",
    "bTitle": "B｜呼吸道病原核酸",
    "aDesc": "血液檢體；反映發炎，須結合臨床評估。",
    "bDesc": "呼吸道檢體；偵測檢驗涵蓋的目標病原。",
    "note": "不是每位呼吸道病人都需要兩項檢驗。血液與呼吸道檢體的處理流程不同；本例共用設備為設計假設。",
    "mode": "CRP＋核酸共用單槽是待評估的設計假設，並非宣稱已有對應的市售兩用機。",
    "lesson": "同一位病人，可能有不同的檢驗問題。",
    "intro": "CRP 與病原核酸檢驗提供不同資訊。整合前，先釐清哪些病人需要哪項結果，以及結果是否會在當次就醫改變處置。",
    "questions": [
      [
        "檢驗改變什麼？",
        "CRP 的發炎資訊與特定病原核酸結果，分別能協助哪個臨床問題？不能單靠 CRP 判定病原。"
      ],
      [
        "需求怎麼形成？",
        "盛行率、症狀、採檢時機及開單策略，如何改變檢驗件數？哪些病人需要追加檢驗？"
      ],
      [
        "整合真的省事嗎？",
        "CRP 常用血液、核酸檢驗使用呼吸道檢體。共用外殼後，採檢與前處理真的簡化了嗎？"
      ]
    ],
    "quick": "病原核酸分析占機 20 分鐘時，只有 2 分鐘的 CRP 能否等到空位？若分開配置，核酸設備會不會反而成為瓶頸？",
    "sources": "<p><strong>真實資料：</strong>Aidian QuikRead go CRP 列出的量測時間為 2 分鐘，使用全血、血清或血漿；產品資料強調結果不能脫離完整臨床評估。CDC 的流感檢驗方法表列快速分子檢驗約 15–30 分鐘。</p><p><strong>模型設定：</strong>預設 CRP 取 2 分鐘、快速病原核酸取 20 分鐘作占機近似；20 分鐘不是所有呼吸道核酸檢驗的通用規格。共用資源是假設性整合方案，不代表 QuikRead go 或其他現有產品具備 CRP＋核酸雙功能。</p><p>CRP 反映發炎，不能單獨確定感染病原；核酸檢驗限於所涵蓋的目標。兩項檢驗的適應症、檢體處理與分析品質需另行驗證。時限與成本均為課堂假設。</p><div class=\"source-links\"><a href=\"https://www.aidian.eu/point-of-care/quikread-go/quikread-go-crp\" target=\"_blank\" rel=\"noopener noreferrer\">Aidian｜QuikRead go CRP，Technical data ↗</a><a href=\"https://www.cdc.gov/flu/php/laboratories/table-testing-methods.html\" target=\"_blank\" rel=\"noopener noreferrer\">CDC｜Influenza Virus Testing Methods，快速分子檢驗 ↗</a></div>"
  },
  "food": {
    "a": "包子",
    "b": "燒餅",
    "aTitle": "包子｜蒸 5 分鐘",
    "bTitle": "燒餅｜烤 10 分鐘",
    "aDesc": "每份占用蒸機或兩用機 5 分鐘。",
    "bDesc": "每份占用烤箱或兩用機 10 分鐘。",
    "note": "一次只製作一份；兩用機不能同時蒸與烤，製作不中斷。實際設備的批次容量、預熱及切換時間另需建模。",
    "mode": "food",
    "lesson": "從早餐店，思考醫療檢驗設備設計。",
    "intro": "兩用機能做兩種餐點，還要確認能同時處理幾份；生物晶片也需要放回完整工作流程中評估。",
    "questions": [
      [
        "多功能平台",
        "能做兩種檢驗，仍要確認有幾個位置可以同時分析。"
      ],
      [
        "占機時間與交付時間",
        "反應很快的檢驗，也可能在較慢的檢驗後排隊。"
      ],
      [
        "檢驗組合",
        "不是每位病人都需要蛋白、小分子與核酸全套；應依臨床問題、疾病進程與採檢時機決定。"
      ],
      [
        "工作量",
        "盛行率不能直接代替開單件數；追加檢驗與複驗也會增加需求。"
      ]
    ],
    "sources": ""
  }
};
if(typeof window!=="undefined")window.QueueScenarios=QueueScenarios;
if(typeof module!=="undefined"&&module.exports)module.exports=QueueScenarios;
