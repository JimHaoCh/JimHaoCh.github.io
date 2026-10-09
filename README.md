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
