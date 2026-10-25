# Web-AST Lite — Kirby–Bauer Disk Diffusion Teaching Tool

**Version: 0.1 experimental educational prototype (2026-10-25). Not validated for clinical interpretation.**

Web: https://jimhaoch.github.io/web-ast/
Course materials: https://jimhaoch.github.io/courses.html

Developed for National Yang Ming Chiao Tung University Department of Medical Laboratory Science and Biotechnology, clinical microbiology laboratory teaching.

## Current functionality
- Upload local JPEG, PNG or browser-supported image (mobile-friendly).
- Resize image locally to max 1050 pixels for analysis.
- Automatic candidate antibiotic-disk localization using luminance/low-chroma threshold, large box-background correction, morphology and component shape filtering.
- Automatic **candidate** inhibition zone boundary estimation from 72-angle radial grayscale profiles, median filtering and drop-off in radial luminance. If evidence is weak, leave zone unresolved instead of inventing a diameter.
- Select/drag/move candidate disks, resize inhibition-zone boundary by touch, add or delete disks.
- Enter nominal disk diameter (default 6 mm) and/or override pixels/mm calibration.
- Edit labels, disk image diameters and zone diameters numerically.
- CSV and annotated PNG export.
- Synthetic teaching plate with five disks and known geometry; compare detection against generated reference radii.
- Browser-only Web Worker processing. Photos never leave the device; no backend or cloud inference.

## First-use instructions
1. Open the web page, press 「開啟合成示範平板」, then press 「自動量測抑菌圈」.
2. Tap a candidate disk to inspect its contour; drag the inhibition zone boundary or edit 「抑菌圈直徑 mm」.
3. For a real plate, photograph from directly above under even illumination and include all paper disks in focus. Upload the photo, perform automatic detection and manually verify every zone.
4. Confirm the 6 mm disk diameter or enter your own calibrated pixels/mm. The zone diameter includes the paper disk itself.
5. Export a CSV or annotated PNG.

## Scientific limitations
- This is an **original test-only image-processing implementation** informed by published computer-vision approaches. It has **not** been evaluated against manually annotated real plates.
- An automatic candidate may be a glare spot or other circular object. Inhibition zones may be irregular, overlapping, double-edged or have colonies inside. A radial symmetric model may produce errors or return no zone.
- Pixel size inferred from a 6 mm disk assumes the disk is standard size and the photo is perpendicular with negligible perspective distortion. Otherwise use a separate calibration and/or recapture.
- Requires user confirmation for all measurements. CSV status=auto means unverified; status=manual means user-edited, *not* clinical validation.
- Output includes inhibition-zone **diameter** only, not clinical susceptible/increased-exposure/resistant classification. Interpret S/I/R using the relevant CLSI or EUCAST standard for organism, antibiotic, disk content, method and edition.
- Does not embed or reproduce proprietary breakpoint tables.
- HEIC works only when the user's browser decodes it; convert to JPEG when necessary.

## Planned validation
- Manually mark at least 50–100 antibiotic disks with ground-truth zone boundaries across real photographs from different phones and lighting setups.
- Report disk candidate precision/recall, diameter MAE and absolute errors, unresolved fraction and manual correction rate.
- Test touching, double and irregular zones, perspective distortions and disks with printed text.
- Verify touch editing and PNG/CSV in iOS Safari and Android Chrome.

## Implementation
- index.html / style.css — interface
- app.js — file processing, demo generation, correction, calibration, CSV and PNG
- engine.js — luminance analysis, paper-disk candidates, ring intensity profiles
- worker.js — off-main-thread detection

No external runtime dependencies or original patient images in the repository.

### Methods and credits
Architectural ideas informed by:
- Pascucci et al., *Nature Communications* (2021), ASTimp / AST image processing: https://github.com/mpascucci/AST-image-processing
- AntibiogramJ, *Computer Methods and Programs in Biomedicine* (2017)
- EUCAST Disk Diffusion and Reading Guide: https://www.eucast.org/bacteria/methodology-and-instructions/disk-diffusion-and-quality-control/

This project is original JavaScript code; ASTimp, AntibiogramJ and J-AST source code was not copied. J-AST is outside this prototype's scope.
