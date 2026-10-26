# Web-Gram Stain Lite · 教學版 v0.1

Client-side Gram-stain microscopy training utility for NYCU Medical Laboratory Science teaching.

## How to use / 操作流程

1. Load a local JPG/PNG/WebP image, or select synthetic sample A/B/C.
2. Choose Gram reaction, morphology, and optional arrangement. Save the student response.
3. Optionally drag an ROI. Changing the ROI resets the student response.
4. Adjust chromatic contrast and connected-component area thresholds; select **Detect candidates**.
5. Select **Reveal suggestions** to compare student labels with heuristic findings.
6. Tap the overlay in a category editing mode to add/relabel an annotation, or use Erase; export reviewed PNG/CSV.

## What the analysis does

- Single-frame, in-browser RGB-threshold stain region detection (purple-like / pink-like).
- 8-neighbor connected components filtered by pixel area.
- Provisional round/elongated shape from second central moments and principal-axis ratio.
- Uncertain connected components sent to **Review**.
- Suggested view-level Gram reaction and morphology determined from candidate-count proportions; the 80% cutoff is solely a teaching interface heuristic.
- Three self-generated schematic microscopy examples for student practice.

**No deep-learning model, reference microscopy images, externally sourced weights or third-party analysis code is distributed in this folder.** The CSS follows the lab's preexisting teaching-tool style. Images do not leave the browser via this tool's code.

## Scope and limitations / 限制

This is a proof of concept, not an analytical performance claim. No sensitivity, specificity, clinical agreement, or real-image segmentation benchmark has been completed. Background stain, precipitates, eukaryotic cells, dense bacterial groups, optical blur, imaging compression and camera color correction create false detections and missed detections. Candidate components must not be interpreted as verified bacterial counts. Manual review is required. Arrangement, species identification, Gram-variable organisms, fungi and differential diagnosis are outside v0.1 scope.

**Educational and research use only. Not for diagnosis, patient-specific identification, reporting, or antimicrobial treatment decisions.** Use de-identified or authorized teaching images.

## Relevant literature (reference only)

- Wang X, et al. **A Clinical Bacterial Dataset for Deep Learning in Microbiological Rapid On-Site Evaluation.** *Scientific Data* (2024) 11:608. https://doi.org/10.1038/s41597-024-03370-5
- **An annotated dataset of Gram stains from positive blood cultures.** *Scientific Data* (2026). https://doi.org/10.1038/s41597-026-06651-3

These sources are cited for context. Their released data and models have not been incorporated into this prototype.

## Verification snapshot

- Confirmed: all HTML identifiers used by JavaScript exist; no duplicate HTML identifiers; JavaScript syntax compilation passes.
- Confirmed: mocked browser-runtime smoke sequence covers initialization, synthetic example, student submission, detection invocation, and result reveal.
- Still needed: independent browser validation on iOS Safari/Chrome and actual microscope Gram-stain photos; performance and GitHub Pages publication should be checked on the live site.
