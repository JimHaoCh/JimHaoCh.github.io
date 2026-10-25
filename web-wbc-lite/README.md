# Web-WBC Lite · 白血球分類鏡檢教學

**Version:** 0.2 experimental AI teaching comparison  
**Website:** https://jimhaoch.github.io/web-wbc-lite/  
**Target:** NYCU Department of Medical Laboratory Science and Biotechnology — clinical hematology / microscopy teaching

## Three learning modes

1. **Morphology Learning** — Five mature white blood cell types (NEU, LYM, MON, EOS, BAS), paired with morphological notes. Built-in SVG schematic images are available even when the external photo service is unavailable; students can request actual PBC expert-labelled cell photos.
2. **Differential Count** — Select 20 / 50 / 100 questions. Quiz samples 5 classes equally (4, 10 or 20 per class). Each expert-labelled single-cell image is classified by the student, followed by feedback, error review, confusion matrix and CSV export. Keyboard shortcuts 1–5 and Enter. Original PBC images load from the Hugging Face Dataset Viewer service at runtime.
3. **Manual Smear Review** — Select one *local* blood smear image, tap a cell and assign its type (NEU, LYM, MON, EOS, BAS). Tracks up to 100 clicks, supports undo/reset and CSV export. This mode has no teacher answer for user-uploaded images.

## Image provenance and licensing

The source PBC dataset contains 17,092 expert-annotated single-cell images and eight classes. This v0.1 deliberately uses five mature WBC classes only. The PBC reference is:

Acevedo A, Merino A, Alférez S, Molina Á, Boldú L, Rodellar J. *A dataset of microscopic peripheral blood cell images for development of automatic recognition systems*. Data in Brief. 2020;30:105474. https://doi.org/10.1016/j.dib.2020.105474

Original data: https://data.mendeley.com/datasets/snkd93bnjr/1 (CC BY 4.0).

Runtime hosted / curated copy: https://huggingface.co/datasets/nirschl-lab/acevedo_et_al_2020 (CC BY 4.0); the extended set is from MicroBench: https://arxiv.org/abs/2407.01791 . Credit both original and extended sources.

Real-image fetch route: `https://datasets-server.huggingface.co/rows`, using query parameters `dataset=nirschl-lab/acevedo_et_al_2020`, `config=default`, `split=test`, `offset` and `length=100`. This external API may be rate-limited, unavailable, blocked by CORS, or return image URLs that expire; **this service has not been verified end-to-end from iOS Safari**. If it cannot load, the application displays an explicit error and retains a **separately labelled illustrated/schematic practice mode**. No generated schematic image is presented as actual microscopy.

## Pedagogical design

- Each real-image quiz is balanced across 5 classes. Thus the 100-question answer distribution is 20 NEU, 20 LYM, 20 MON, 20 EOS and 20 BAS. **Those 20% per-class proportions are an intentional study design and must not be interpreted as a normal or patient differential.**
- Each real quiz image has expert class label from the dataset. Student results are compared against those labels (which are not an independent second faculty audit).
- Scores: correct answers / actual completed cases. Images that fail to load can be skipped without penalty and reduce total usable questions.
- The tool is not an automatic leukocyte detector. For a whole smear, students manually locate and classify cells; there is no AI object detection, class prediction, or clinical hematology analyzer.
- Abnormal cells, immature granulocytes, band forms and NRBC need separate protocols and are out of scope for this initial five-class exercise.
- For an educational 100-cell tally, this web app does not determine the representative location of patient cells or validate full laboratory hematology SOP.

## Technical stack

Pure HTML, CSS, JavaScript, SVG, browser File API, Canvas and Blob downloads. v0.2 adds a handcrafted-feature, supervised k-nearest-neighbor (kNN) browser inference module (`ai.js`, `ai-compare.js`). No Pyodide, YOLO or server required for local tally, schematic practice and CSV. Internet is required to fetch external PBC images.

- `index.html`: responsive course interface / accessibility
- `style.css`: mobile and desktop layout
- `app.js`: morphology learning, curated PBC API client, balanced 100-cell quiz, confusion matrix, mistake review, local smear markup, CSV export
- `ai.js`: original browser-side training and prediction for supervised kNN on image-derived feature vectors
- `ai-compare.js`: opt-in model training, independent prediction, and student/AI/expert comparison

## Before classroom release

1. Verify PBC dataset viewer query, image decoding and browser CORS in Safari (iPhone) and Android Chrome. If unreliable, assemble a small **legally attributed static image set** directly within GitHub Pages, with explicit source metadata.
2. Independently review a selected sample for morphology clarity and labelling consistency.
3. Ask student users to test 100-question completion, keyboard shortcuts, mobile tap controls and CSV export.
4. Add external teacher-selected ground-truth images or additional morphology challenge sets only with appropriate licenses.
5. Consider an optional lightweight ONNX model *after* validating the paper, model weights, license and device memory consumption.

**For educational use only, not clinical differential counting or diagnosis.**

## v0.2: Student vs AI vs expert — experimental

The optional `Experimental ML` panel is shown in the quiz setup. It offers:

- **Offline schematic kNN:** trains a small supervised image-feature kNN on the site's programmatically generated schematic drawings. Intended **only as an interactive software demonstration**; these pictures are not blood cells. Do **not** cite its results as microscopy accuracy.
- **PBC image-feature kNN:** requests a small number of explicitly labelled **training split** images from the PBC/MicroBench Dataset Viewer. With five-class coverage, it loads up to 12 source images per class, computes numerical brightness/color-region features from pixels in the current browser, and fits a weighted k-nearest-neighbor classifier. Quiz questions use the **test split**. No ground-truth test label is passed into inference. No model files or raw study images are uploaded to the lab server.
- Model advice appears after the student clicks a class. The UI then independently compares student answer, model suggestion and expert dataset label. It summarizes how often the student's answer agreed with the model and the model agreed with the expert on successfully inferred questions.

**Important limitations of the v0.2 baseline**

1. The ML engine is **NOT WBC-NCA**, not an endorsed substitute for a trained clinical classifier, and not a CNN. It uses local RGB/HSV-like luminance/color signals and spatial features with supervised kNN. It has **not been benchmarked** against human teachers or a representative held-out sample.
2. Nearest-neighbor weighted vote share is **not a calibrated probability**. Training set size is small. Results may overfit a staining/background condition or fail for immature or abnormal cells.
3. PBC image access uses a third-party public API and image CDN. Browser CORS, request limits and external availability may prevent both loading and extracting pixels. In that case prediction fails **visibly**; the page does not manufacture a result or use expert labels as a replacement.
4. The PBC train/test split is respected when preparing the lightweight baseline. This should not be confused with validated patient-level disjointness, external clinical validation, or a verified accuracy claim.
5. Images uploaded to the separate manual-smear mode are never sent to the ML inference module; there is still no automatic full-smear leukocyte localization.
6. The schematic model is only for matching schematic quiz content; the PBC model is only for PBC microscopy content. Domain mismatch disables suggestions.

### WBC-NCA feasibility review

**Paper:** Deutges M, Sadafi A, Navab N, Marr C. *Neural Cellular Automata for Lightweight, Robust and Explainable Classification of White Blood Cell Images*. MICCAI 2024. https://papers.miccai.org/miccai-2024/559-Paper3422.html

**Upstream:** https://github.com/marrlab/WBC-NCA

Inspection on 2026-10-25 confirmed:

- The public model checkpoint `models/modelMax128chan64step_trained_on_AML` is approximately **350 KB**, but its name says **trained on AML**; `src/models/NCA.py` implements an output head of **13 logits**, not five.
- Configuration shows 64 update steps at 64 × 64 input, 128 feature channels. Model size alone does not establish low computation/memory cost in iOS browsers.
- Repository metadata has no explicit software license. Thus no WBC-NCA checkpoint or source code has been copied or redistributed in this website.
- Before considering WBC-NCA for teaching, obtain permission/license, re-train/calibrate the correct five-class head against legally usable labelled images, convert to ONNX or another browser runtime, and measure accuracy & device performance against an independent test set.

The current 0.2 implementation is an honest lightweight **ML feasibility prototype**. A WBC-NCA model can be swapped in later once those requirements are satisfied.
