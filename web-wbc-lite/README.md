# Web-WBC Lite · 白血球分類鏡檢教學

**Version:** 0.1 educational prototype  
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

Pure HTML, CSS, JavaScript, SVG, browser File API, Canvas and Blob downloads. No Pyodide, YOLO or server required for local tally, schematic practice and CSV. Internet is required to fetch external PBC images.

- `index.html`: responsive course interface / accessibility
- `style.css`: mobile and desktop layout
- `app.js`: morphology learning, curated PBC API client, balanced 100-cell quiz, confusion matrix, mistake review, local smear markup, CSV export

## Before classroom release

1. Verify PBC dataset viewer query, image decoding and browser CORS in Safari (iPhone) and Android Chrome. If unreliable, assemble a small **legally attributed static image set** directly within GitHub Pages, with explicit source metadata.
2. Independently review a selected sample for morphology clarity and labelling consistency.
3. Ask student users to test 100-question completion, keyboard shortcuts, mobile tap controls and CSV export.
4. Add external teacher-selected ground-truth images or additional morphology challenge sets only with appropriate licenses.
5. Consider an optional lightweight ONNX model *after* validating the paper, model weights, license and device memory consumption.

**For educational use only, not clinical differential counting or diagnosis.**
