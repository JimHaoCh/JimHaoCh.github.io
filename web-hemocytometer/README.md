# Web-Hemocytometer v0.1

Educational prototype for National Yang Ming Chiao Tung University Department of Medical Laboratory Science and Biotechnology.

Site: https://jimhaoch.github.io/web-hemocytometer/

## Features

- Mobile/desktop photo uploads, local processing, synthetic Neubauer demo.
- Manual ROI selection of one physically complete 1 × 1 mm large counting square.
- Pyodide 0.29.5 + OpenCV-Python candidate cell detection (threshold / grid line suppression / contour filters).
- Touchscreen add/remove corrections and top/left included, bottom/right excluded border rule.
- Cell Culture: one 1 mm² square per image, default dilution 2×.
- WBC: one corner 1 mm² square per image, accumulate four different corner fields, default dilution 20×.
- RBC: crop central full 1 mm² large square, automatically count the four corner middle squares and center middle square from a 5×5 grid; total 5 × 0.04 = 0.20 mm², default dilution 200×.
- Multi-image session concentration and CSV/annotated PNG export.

## Concentration

Cells per µL = (number counted × dilution factor) / (total counted area in mm² × chamber depth in mm). Cells per mL = cells per µL × 1000. Standard Improved Neubauer depth is 0.1 mm.

Math examples: WBC 80 cells from four 1 mm² squares with dilution 20 gives 4,000 cells/µL. RBC 500 cells across five 0.04 mm² squares with dilution 200 gives 5,000,000 cells/µL.

## How to use

1. Open the synthetic demo and learn the inclusion/exclusion rule.
2. Choose Cell Culture/WBC/RBC preset and enter actual dilution and chamber depth.
3. Upload a microscopy image; drag to align precisely one large 1 mm² square.
4. Click Auto Detect; use Add/Remove to verify and correct detected candidate cells.
5. Click Add Field to accumulate counts. Upload another image, or choose another distinct counting region.
6. Export a session CSV and annotated PNG.

## Safety and validation status

**Not validated for clinical diagnostics, laboratory result reporting or quantitative research.**

- Auto-detection of circular candidates cannot reliably distinguish cell types, debris or clumps. Images with illumination changes or grid overlap need manual correction.
- Upper/left border is included and bottom/right excluded using an approximate circular footprint from the candidate area. Observe the real outline and correct manually.
- The selected rectangular ROI must correspond to a real physical 1 × 1 mm square. Tilt or poor alignment invalidates area calibration.
- RBC sub-squares are inferred from an even 5×5 split of the selected central large square; automatic grid calibration is not provided.
- Saved field snapshots store counts and areas only. Check/correct a field before adding it to the session.
- Pyodide and OpenCV are loaded from jsDelivr on the first automatic analysis; a network connection and device memory are required.
- Trypan Blue live/dead classification, auto grid localization, splitting of clumps and teacher assessments are future enhancements.

## Files

index.html: HTML interface
style.css: mobile interface
math.js: Neubauer region masks and concentration formulas
app.js: photo handling, manual edits, multi-field tally, export
worker.js: Pyodide loader and local worker
analysis.py: original OpenCV cell-candidate detection

Source is independently written and does not copy Neubauer-Counter, SporeQuant or GridRuler source code. Dependencies retain their respective licenses. Dimensions follow Improved Neubauer chamber technical specifications.

## Before classroom release

Test iPhone Safari and Android Chrome; compare final counts with teacher annotations in at least several conditions: different stains, density, grid overlap, defocus and debris. Measure detection precision/recall and corrected counting error.
