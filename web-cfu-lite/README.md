# Web-CFU Lite · Colony Counting Teaching Lab

**Version:** 0.1 experimental prototype
**Course:** NYCU Department of Medical Laboratory Science and Biotechnology — clinical microbiology / laboratory teaching
**Website:** https://jimhaoch.github.io/web-cfu-lite/

## Features
- Fully static website deployable from GitHub Pages; no upload server.
- Photo upload from mobile or desktop (browser support of image encoding required).
- Locally generated synthetic demonstration image with 72 target colonies. Compare automatic count with synthetic reference.
- Automatic colony candidate segmentation: grayscale, integral-image local background, adaptive brightness threshold, 8-connected components and shape/area filtering.
- Editable circular plate ROI, dragging center or radius handle.
- Manual review: add/remove markers by tapping, undo, display IDs.
- Quantitative plate CFU/mL = count / (plated volume mL × dilution fraction). For instance 84 colonies, 0.1 mL, 10^-4 gives 8.40e+6 CFU/mL.
- Quadrant streak cultures cannot be converted into CFU/mL here.
- Export annotated PNG and per-colony UTF-8 CSV.
- All processing is local; no image is transmitted to a server.

## Classroom use
1. Open the webpage and load the **72-colony synthetic demo**, then compare automatic count with the known synthetic target count.
2. Upload a top-down JPG/PNG or another browser-supported image; images are scaled to maximum 900 pixels along one side.
3. Choose **調整培養皿** to drag the center or right-side radius handle. Re-run automatic detection after adjustments.
4. Adjust colony polarity, sensitivity and minimum/maximum blob area to refine candidates.
5. Tap **新增菌落** or **刪除標記** to correct the count. Export marked PNG or CSV.
6. Choose **定量平板** and input the actual dilution exponent (-4 is 10^-4) and plated volume in mL. The calculation updates with corrections.

## Limitations and verification
- Traditional local brightness thresholding is lightweight and can fail on transparent colonies, colored agar, glare, vignetting, cracks, debris, overlaps, streaks and confluent lawns.
- Touching colonies can be merged into one connected component. Correct them manually in v0.1; MCount is a future candidate to evaluate independently.
- Very dense and TNTC plates are outside the verified scope.
- The circular plate ROI is adjustable manually; initial circle is a heuristic.
- 30–300 colonies is a classroom reference range; apply course SOP and method-specific plate selection, replicate, and dilution criteria.
- The detected candidate count does not represent validated colony enumeration before manual review.
- HEIC/HEIF decoding support depends on the browser; JPG and PNG are recommended.
- Output is for education and demonstration only, not a clinical diagnostic tool or formal laboratory report.
- Accuracy, false positives, missed colonies and mobile performance have not yet been validated on annotated lab photos.

## Files
- index.html: teaching UI
- style.css: responsive layout
- detector.js: dependency-free, original JavaScript adaptive segmentation and connected components
- app.js: photo upload, synthetic example, ROI adjustment, manual correction, CFU calculator and downloads
- README.md: setup, notes, limitations

No OpenCFU, MCount, or SoftCount source code is copied into this educational prototype. Future work can compare MCount on teacher-annotated dense plates and explore tiled analysis, colored-colony segmentation, and automatic plate boundary detection.

Copyright © Bioflumen & Xensor Lab / NYCU. Experimental educational software.
