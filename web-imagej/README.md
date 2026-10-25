# Web-Image Lab v0.3 — NYCU MLS teaching prototype

Public entry: `https://jimhaoch.github.io/web-imagej/`  
Local workspace: `https://jimhaoch.github.io/web-imagej/lab.html`

## Copyright and integration boundaries

This website contains **original, first-party teaching code** in `lab.html`, `lab.css`, `lab.js` and a **separate hyperlink** to `https://ij.imjoy.io/`. There is no copied ImageJ source, CheerpJ runtime, ImJoy plugin, ImageJ.JS bundle, web-embedded ImageJ iframe, copyrighted scientific figure or third-party imaging library in the new workspace.

- ImageJ.JS is explicitly attributed to the ImJoy Team. The source code and official page are separately linked for reference.
- External links to ImageJ.JS use `target="_blank"`, `rel="noopener noreferrer"` and `referrerpolicy="no-referrer"`.
- Any future redistribution or iframe/API embedding of ImageJ.JS, CheerpJ or plugins requires **fresh, version-specific licensing review before publication**. Current licensing reference: https://cheerpj.com/docs/licensing.
- The original website uses shared headers, analytics-free first-party assets and externally fetched Google Fonts. The local image analysis script makes **no network requests**, and no image data are intentionally uploaded by these new functions. External navigation is a separate action.
- Independent legal review may still be appropriate before an institutional, commercial or clinical deployment; technical implementation alone does not certify legal compliance.

Sources: https://imagej.net/software/imagej-js · https://github.com/imjoy-team/imagej.js · https://doi.org/10.1038/s41592-019-0627-0

## Features

### Existing v0.2

- Browser-native PNG/JPEG/WebP decoder, file limit 25 MB, max input 35 megapixels and 16,000 pixels on an axis. Analysis work image max 1280 pixels along the longest edge.
- Rectangle ROI, line length, gray mean/min/max, intensity histogram, 8-connected gray threshold components, area filter, direct CSV and annotated PNG output.
- No external processing library, paid API, backend upload, user account or persistent local storage.
- Numeric scale refers to **original** pixels; area refers to original pixel², as estimated through the downsampled analysis image.

### New v0.3

1. Guided calibration lesson: students draw a line matching a **known physical distance**, enter µm and calculate µm/original px. A synthetic demonstration has **no inherent physical calibration**.
2. Guided threshold/counting lesson: original code draws 12 non-touching dark circles on a light canvas with a known component count. Default threshold 145, dark polarity, 20 original pixel² minimum yields 12 components on the 720×430 reference.
3. Guided background lesson: students capture two **different rectangular ROIs**, calculating target mean gray minus background mean gray. The signed difference may be negative and is not automatically normalized.
4. In-memory measurement notebook (max 50 snapshots). Logs type, result, original-image calibration, self-review checkbox state, image-origin type, and method parameters. Downloadable as UTF-8 BOM CSV with CRLF; no student names, filenames, image bytes or external upload.
5. New image and clear actions wipe previous notebook values **and reset spatial calibration** to prevent carrying an old µm/px into a new image. Threshold or ROI adjustments invalidate the current self-review checkbox but preserve earlier saved snapshots.

### Accuracy and safety boundaries

- A known-count synthetic fixture is a **functional smoke test**, not a measurement accuracy validation with biological samples.
- ROI data are sampled from a resized *working image*. Converting them to original pixel dimensions does not restore lost resolution, touching-cell boundaries, or photometric information.
- No clinical diagnostic interpretation, automated cell identity classification, full TIFF/Z-stack support, ImageJ Macro interpreter or validated diagnostic-grade measurement.
- Uploaded images remain in tab memory unless a user explicitly downloads an output. Avoid identifiable patient images. Reloading or closing this page removes notebook records.

## Verification performed in code-mode simulation

Tests executed against actual `lab.js` fetched from the GitHub repository with a simulated browser DOM and deterministic synthetic grayscale fixture:

- Loaded 720×430 reference consisting of 12 disjoint dark circular regions.
- Threshold and 8-connected counting produced **12 objects**, and the guided comparison returned the expected benchmark answer.
- Rectangle ROI restricted counting in earlier v0.2 fixtures (2 objects full-image vs 1 in a selected ROI); a changed threshold excluded candidates.
- Target/background captures were tested with distinct ROIs, and an identical-ROI attempt was rejected.
- A 200-original-pixel line with user-provided 50 µm real length yielded **0.25 µm/original pixel**, and the line reported 50 µm.
- Saved count, intensity and calibration snapshots; exported CSV callback and checked actual generated text begins with UTF-8 BOM and uses CRLF.
- Clear removed the stored notebook and disabled report export.
- Source was statically checked for external imaging dependencies and third-party iframe embedding.
- Additional fix: spatial calibration is cleared on each new image, preventing false physical-scale carryover.

**Still outstanding**: real-device Chrome, Firefox, macOS Safari, iOS Safari QA; pointer/touch alignment, actual downloaded files, large real-image memory use, real microscope-image accuracy and repeatability. These have not been claimed or represented as completed.

## Browser acceptance checklist

- [ ] Desktop Chrome: open synthetic demo, drag ROI/line, threshold both polarities, verify 12 circle benchmark.
- [ ] iPhone Safari (portrait): compare touch region and image coordinates.
- [ ] Desktop Safari / Firefox: load real PNG, JPEG, WebP and confirm histogram and working-resolution PNG export.
- [ ] Upload a source >1280 pixels wide and compare measured lengths before/after working-image downsampling.
- [ ] Compare line measurements to a known ruler/scale bar and cell count results to manual evaluation.
- [ ] Inspect downloaded CSV numeric values, CRLF and BOM in spreadsheet applications.
- [ ] Confirm new image clears previous calibration and all notebook entries.
- [ ] Confirm external ImageJ.JS hyperlink opens in a separate tab; review upstream service's policy before using any sensitive material.
- [ ] Verify that published GitHub Pages build succeeds.
