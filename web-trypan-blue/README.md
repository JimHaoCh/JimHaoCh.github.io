# Web-Trypan Blue · Cell Viability Image Analyzer

**Version:** v0.1 educational prototype · **Language:** Traditional Chinese + English

Website: https://jimhaoch.github.io/web-trypan-blue/

## Scope
Original, static, browser-only Trypan Blue image analysis for NYCU Medical Laboratory Science teaching. No images leave the browser; no APIs, cloud inference, externally downloaded models, or third-party source code are used. A 60-cell synthetic image (48 live and 12 dead) is included as an interface and sanity-check sample, not a validation dataset.

## Features
- Upload JPG/PNG or another browser-decodable image. Large pictures are downscaled to 1,000 pixels on the longest side.
- Draw a rectangular region of interest (ROI) by mouse or touch, or analyze the entire image.
- Original rule-based candidate detector: locally normalized grayscale contrast via integral image; binary 3×3 morphological closing; connected components; equivalent radius, roundness, fill-ratio, and ROI-edge filters.
- Classify candidate cells provisionally using mean RGB (B − R) chroma from the cell core. Near-threshold / suspiciously dark, low-blue candidates are flagged **review**.
- Switch modes to mark **live**, **dead**, **review**, or delete a cell. Existing marks can be reclassified. Supports undo of marker changes.
- Display live count, dead count, review count and viability = live / (live + dead) × 100%. Review candidates are excluded from the denominator; results stay provisional until reviewed.
- Optional concentration = count × dilution × 1000 / (calibrated area in mm² × chamber depth in mm). Requires a manually selected ROI and explicit area confirmation; defaults (1 mm², 0.1 mm, 2× dilution) are examples only.
- Download annotated PNG and per-cell UTF-8 CSV. All outputs remain local.

## Classroom flow
1. Load the synthetic reference and run detection with default settings.
2. Compare automatic markings against the known 48 live / 12 dead image. Differences demonstrate the need for human review.
3. Upload a photographed Trypan Blue–stained brightfield image; select a clean ROI free from major grid lines, bubbles and debris.
4. Adjust radius, contrast threshold and blue score if necessary; rerun detection.
5. Correct misclassifications, missed cells, aggregates and debris using the annotation modes.
6. Review all candidates before discussing viability. Use the optional hemocytometer calculator only when the ROI area and counting depth are actually known.
7. Export the evidence image and CSV for a class exercise.

## Measurement caveats
- The code is **not an AI model** and has not been validated against teacher-annotated actual cell images. No sensitivity, precision, F1, error bound or repeatability claim is made.
- Dye-exclusion viability measures membrane integrity, not every biological mechanism of cell survival.
- Broken rings, variable focus, illumination, color balance, blue dye precipitation, grid lines, overlapping cells, cell fragments and near-border cells may yield false, missed or merged objects.
- Color threshold is image-dependent. In grayscale or colorless images, live/dead automatic classification should not be trusted.
- An ROI does not automatically calibrate physical area. Only a known chamber region justifies cells/mL.
- Concentration calculations include only the single selected ROI, not independent multi-field aggregation. For count-chamber rules, see the separate Web-Hemocytometer tool and follow local teaching SOP.
- A missing unmarked cell is invisible to the 'review' counter. Students must inspect the underlying image, including areas with no marker.
- Exported results are educational drafts, not regulated laboratory records or clinical diagnostics.

## References
1. Kuijpers L, et al. *Automated cell counting for Trypan blue-stained cell cultures using machine learning.* PLoS ONE 18(11):e0291625 (2023). https://doi.org/10.1371/journal.pone.0291625
2. NIST. *Addressing Sources of Error in the Cell Viability Measurement Process.* https://www.nist.gov/mml/bbd/biomaterials/addressing-sources-error-cell-viability-measurement-process
3. Thermo Fisher Scientific. *Trypan Blue Exclusion protocol.* https://www.thermofisher.com/de/en/home/references/gibco-cell-culture-basics/cell-culture-protocols/trypan-blue-exclusion.html

The cited works motivate educational design; their trained weights, reference images, and macro source are **not** included or copied.

## Files
- index.html — accessible bilingual layout
- style.css — responsive styling consistent with /tools-common.css
- app.js — local original JavaScript detection, manual annotation, statistics and export
- README.md — this documentation

Copyright © Bioflumen & Xensor Lab / NYCU. Research and teaching demonstration; use with attribution.
