# 百洑傳息｜Bioflumen & Xensor Lab

Static bilingual lab website for Dr. Chun-Hao Chang, Department of Biotechnology and Laboratory Science in Medicine, National Yang Ming Chiao Tung University.

Public website: https://jimhaoch.github.io/

## Editing

- `index.html`: Traditional Chinese / English content, 4 research stories, PI CV, 2 master’s students, 4 undergraduates and 9 publications.
- `style.css`: logo-derived blue (#2b61ab), orange (#ffad55), warm white (#fef9f5), responsive layout.
- `site.js`: mobile navigation, active-section navigation, reading progress, publication/member filters and a keyboard-accessible image gallery with zoom.
- `assets/lab-logo.png`: user-supplied logo, preserved as provided.
- `assets/*-fig1.jpg`: Fig. 1 cropped from four author-supplied papers; attribution and DOI accompany each figure.
- `assets/*-v3.webp`: six AI-generated conceptual illustrations created with the built-in image_gen tool. Full prompts and saved asset paths: `assets/image-generation.json`.
- Earlier SVGs are no longer referenced by the website.
- `assets/research-sources.json`: research provenance, source DOIs and figure attribution.

No build step, paid API, analytics or external font service is required. GitHub Pages deploys from `main` / repository root. `.nojekyll` keeps assets served directly.

## Content provenance

PI profile, lab philosophy, education, experience, training, patents, honors and publications were checked against the official faculty profile on 2026-10-09:
https://dmt.nycu.edu.tw/en/%E5%BC%B5%E9%88%9E%E8%B1%AA%E8%80%81%E5%B8%AB/

Text is arranged into bilingual pairs and edited for clarity. English translations are supplied where the official source lists Chinese only. Journal metrics are omitted because their reporting year is unspecified. The four research stories identify work completed with the PI before this lab was founded. Student information is limited to the names and master’s and undergraduate roles supplied by the PI; photos, romanized names and individual project assignments have not been provided.

Paper figures retain their original labels and scientific colors. Cropping removes surrounding page text; each image links to its source paper. Au/SiC figure: Chang et al. 2024, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Elsevier figure attribution follows the original publications. The author supplied these papers for use in the research introduction. Original PDF files are not republished. The six generated illustrations are labeled as AI research concepts. Original paper figures remain the source for exact device structures and experimental evidence. WebP conversion preserves the generated composition at its original resolution.

## Verification

Check navigation at small widths, filter counts (9 / 4 / 5), figure-dialog opening and Escape closure, internal anchors, images and horizontal overflow. The site supports reduced motion and keyboard focus indicators.

## Contact form and discovery

The contact form posts to FormSubmit for jimhao@nycu.edu.tw, with its default CAPTCHA and a honeypot. First use sends an activation email to the owner; delivery requires the owner to confirm that email. Check spam if necessary. The `email` field sets Reply-To. No API key is stored. Provider processing is disclosed beside the form. `thanks.html` acknowledges submission to the provider, not verified inbox delivery.

Discovery files: canonical and social metadata, JSON-LD for the lab/PI/website and nine cited articles, `robots.txt`, `sitemap.xml`, and the factual bilingual `llms.txt` directory. Visible collaboration Q&A matches the website facts. These files do not guarantee indexing or ranking. No instructions to override another AI's behavior are embedded. Submit the sitemap in Google Search Console when owner verification is available.

Provider documentation: https://formsubmit.co/documentation and https://formsubmit.co/help
Search guidance: https://developers.google.com/search/docs/appearance/ai-features

## Navigation and pages

The shared script supports home sections and independent pages. Same-document hash clicks close menus before measuring the sticky header and explicitly scrolling, including repeated clicks on the same hash. Mobile navigation overlays the page without changing header height. Escape and outside clicks close menus; history navigation aligns anchors again. Paper figures reserve their intrinsic sizes to reduce layout changes during lazy loading.

`news.html`, `instruments.html`, and `moments.html` are empty page shells (noindex until populated). `techniques.html` contains six bilingual technique introductions. Update the shared header/footer across pages together.

## Pages CMS (October 2026)

`.pages.yml` provides owner-only content editing through the hosted Pages CMS app. First sign-in requires installing its GitHub App for this repository; no credentials are embedded in the site. `admin.html` is an instruction/link page, and the editor itself requires authentication.

Editable JSON lives in `_data/`: `home`, `members`, `publications`, `techniques`, `news`, `instruments`, and `moments`. Existing bilingual prose and member/publication records are preserved. `_includes/` renders these records during the native GitHub Pages Jekyll build. `.nojekyll` was removed so the existing main/root publishing source compiles the data into static HTML on every CMS save. Public pages need no JavaScript data fetch to display managed content. Published counts, page indexing, sitemap and publication citations are generated from the data.

Rich-text fields output HTML. Home paragraph IDs are stable object keys; they are edited in place. Entry lists may be added to, reordered or removed. The `published` toggle controls website visibility. Content files are in the existing public GitHub repository.

Only the owner is configured; no collaborators are added. FormSubmit contact routing remains unchanged. Desktop typography increases within a min-width:861px media query; existing phone typography is retained.


### 2026-10-15 介面與作者身分更新

- 共用頂部導覽位於 `_includes/header.html`；11 個入口直接顯示，手機使用橫向捲動列。
- 各頁統一載入 Noto Sans TC、Noto Serif TC 與 Source Serif 4 網頁字型。
- Pages CMS 的「主持人的作者身分」可複選：第一作者、共同第一作者、通訊作者、共同作者。`type` 儲存為陣列，前台篩選支援同篇多重身分；舊單一字串仍可呈現。
- 動畫尊重系統 reduced-motion 設定，文字預設保持可見。logo 使用原圖，移除 multiply 疊色與半透明底板，底色維持 #fef9f5。


### 2026-10-15 手機導覽與互動科普

- 手機顯示三個常用入口與「全站選單 · 11」按鈕；完整選單以兩欄展開，支援 Escape、點外側與選項選取後收合。
- 作者身分加入 `co-corresponding`（共同通訊作者），可與其他身分複選。
- 首頁 `_includes/interactive-flow.html` 提供四步驟的檢體到訊號概念圖；自動導覽每 5 秒切換，手動點選或暫停動態會停止導覽。離開畫面時停止圖形運動，尊重 reduced-motion。
- 微流體與感測器的兩則雙語科普問答可在 Pages CMS 的首頁文字中編輯；頁面附 NIST、NIH、IUPAC 來源。
