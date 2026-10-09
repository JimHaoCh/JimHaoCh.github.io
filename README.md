# 百洑傳息｜Bioflumen & Xensor Lab

Static bilingual lab website for Dr. Chun-Hao Chang, Department of Biotechnology and Laboratory Science in Medicine, National Yang Ming Chiao Tung University.

Public website: https://jimhaoch.github.io/

## Editing

- `index.html`: Traditional Chinese / English content, 4 research stories, PI CV, first-cohort students and 9 publications.
- `style.css`: logo-derived blue (#2b61ab), orange (#ffad55), warm white (#fef9f5), responsive layout.
- `site.js`: mobile navigation, publication filters and accessible figure dialog.
- `assets/lab-logo.png`: user-supplied logo, preserved as provided.
- `assets/*-fig1.jpg`: Fig. 1 cropped from four author-supplied papers; attribution and DOI accompany each figure.
- `assets/*.svg`: six original conceptual illustrations using the site palette.
- `assets/research-sources.json`: research provenance, source DOIs and figure attribution.

No build step, paid API, analytics or external font service is required. GitHub Pages deploys from `main` / repository root. `.nojekyll` keeps assets served directly.

## Content provenance

PI profile, lab philosophy, education, experience, training, patents, honors and publications were checked against the official faculty profile on 2026-10-09:
https://dmt.nycu.edu.tw/en/%E5%BC%B5%E9%88%9E%E8%B1%AA%E8%80%81%E5%B8%AB/

Text is arranged into bilingual pairs and edited for clarity. English translations are supplied where the official source lists Chinese only. Journal metrics are omitted because their reporting year is unspecified. The four research stories identify work completed with the PI before this lab was founded. Student information is limited to the names and first-cohort master's roles supplied by the PI; photos, romanized names and individual project assignments have not been provided.

Paper figures retain their original labels and scientific colors. Cropping removes surrounding page text; each image links to its source paper. Au/SiC figure: Chang et al. 2024, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Elsevier figure attribution follows the original publications. The author supplied these papers for use in the research introduction. Original PDF files are not republished. SVG diagrams illustrate workflows and do not represent experimental data.

## Verification

Check navigation at small widths, filter counts (9 / 4 / 5), figure-dialog opening and Escape closure, internal anchors, images and horizontal overflow. The site supports reduced motion and keyboard focus indicators.
