# Web-Image Lab v0.2 (original browser-side teaching tool)

Part of the Bioflumen & Xensor Lab teaching resources at `/web-imagej/`.

## Architecture and copyright boundary

- `index.html`: educational gateway, attribution and links to third-party ImageJ.JS.
- `lab.html`, `lab.css`, `lab.js`: original first-party teaching workspace written with browser-native Canvas and JavaScript. No imports, runtime CDN, copied ImageJ code, CheerpJ, ImageJ.JS or other third-party analysis libraries.
- The external `https://ij.imjoy.io/` link opens as a separate page with `rel="noopener noreferrer"` and `referrerpolicy="no-referrer"`. No ImageJ.JS content is embedded in our page.
- Avoid use of third-party ImageJ logos, screenshots, badges and redistributed bundles pending separately documented permission.
- If academic-institution production embedding is reconsidered, secure appropriate CheerpJ/ImJoy legal permission and review the exact runtime version/third-party plugin terms **before** deploying it. The available CheerpJ commercial-licence guidance includes academic public projects: https://cheerpj.com/docs/licensing

ImageJ.JS upstream documentation: https://imagej.net/software/imagej-js
Upstream repository: https://github.com/imjoy-team/imagej.js
ImJoy paper: https://doi.org/10.1038/s41592-019-0627-0

## Functionality

- PNG, JPEG and WebP images only (as decoded by the browser); maximum input file size 25 MB.
- Large images downsampled to a maximum working edge of 1280 px. Images over 35 megapixels or 16,000 px per axis rejected after decoding.
- Rectangle ROI, line length (original pixel units, optional µm/pixel), gray intensity summary, histogram.
- Bright/dark threshold and eight-connected binary component count, minimum area based on **original** pixel². Results represent connected regions, not validated cells.
- CSV of metadata and particle centroids; annotated PNG at **working** resolution.
- Synthetic demonstrator is generated locally with original code; not a real microscopy sample.
- No image upload endpoint, third-party analysis library, remote model, cookies or local storage. All input is kept in the current browser tab memory unless user explicitly downloads output.
- CSV fields are generated from controlled numeric and enumeration values; original file names are deliberately excluded.

## Evaluation completed

- JavaScript syntactic compilation: passed (V8 parser, 2026-10-25).
- Simulated Canvas DOM and gray-image fixture: loading a 720x480 image, thresholding two isolated dark square regions, eight-connected counting (2), 0.25 µm/pixel area calculation, output table (2 rows): passed.
- Simulated DOM tests additionally verified a rectangle ROI restricted the count to one object; lowering the dark threshold excluded both objects; a 200-original-pixel line with 0.5 µm/pixel calibration produced 100 µm; CSV and PNG export event handlers were dispatched. Passed.\n- Static source review confirmed no `iframe`, external JavaScript import or remote image-analysis request on the new `lab.html` + `lab.js`.

## Manual compatibility acceptance checklist (pending physical devices)

1. Windows Chrome, macOS Safari and iPhone Safari: file selection, synthetic image and visible overlay position.
2. Draw a rectangle and a line using both mouse and finger; the overlay must align with the displayed canvas.
3. Calibrate using a known scale; compare pixel and µm outputs to an independent reference.
4. Analyze synthetic discrete objects under both threshold polarities; vary minimum pixel area; inspect oversegmentation.
5. Export CSV and PNG. Verify the expected centroid coordinates and that PNG is at the working resolution.
6. Test a >1280 px image and verify the displayed original versus working dimensions and converted measurements.
7. Ensure external ImageJ.JS opens in its own tab and users understand its separate data handling and limitations.
8. Confirm GitHub Pages build, mobile CSS at 320–430px widths, keyboard focus and reload behavior.

No claim of Chrome/Safari/iOS device compatibility testing is made until these tests are completed.

## Known limitations

This does not reproduce desktop ImageJ: no TIFF-stack, macro interpreter, ImageJ plugins, ROI Manager, watershed splitting, cell classification or clinical performance validation. Grayscale conversion uses the standard weighted RGB formula; physical calibration is user-entered. Threshold masks are simple binary segmentation and eight-connected objects may merge if they touch. It is an educational prototype.
