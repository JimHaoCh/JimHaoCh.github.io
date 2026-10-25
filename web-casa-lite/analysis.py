"""Web-CASA Lite prototype. Educational / experimental, not a validated clinical CASA."""
import json
import cv2
import numpy as np
from scipy.optimize import linear_sum_assignment

def detect_heads(frame, contrast):
    """Bright-field assumption: darker head-like regions on brighter field."""
    blur = cv2.medianBlur(frame, 3)
    binary = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 25, int(contrast))
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN,
                             np.ones((2, 2), dtype=np.uint8))
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)
    detected = []
    for i in range(1, count):
        x, y, w, h, area = [int(v) for v in stats[i]]
        if area < 7 or area > 230 or w < 2 or h < 2 or w > 28 or h > 28:
            continue
        # Ignore connected foreground on edges.
        if x < 2 or y < 2 or x + w >= frame.shape[1] - 1 or y + h >= frame.shape[0] - 1:
            continue
        cx, cy = centroids[i]
        detected.append((float(cx), float(cy), float(area)))
    return detected

def smooth_path(points, radius=2):
    """Short, endpoint-preserving running mean; an illustrative VAP estimator."""
    if len(points) < 3:
        return points.copy()
    n = len(points)
    result = []
    for i in range(n):
        lo, hi = max(0, i-radius), min(n, i+radius+1)
        result.append(points[lo:hi].mean(axis=0))
    return np.array(result)

def analyze(frames, times, scale, jump, contrast):
    frames = np.asarray(frames, dtype=np.uint8)
    times = np.asarray(times, dtype=float)
    if len(frames) != len(times) or len(frames) < 2:
        raise ValueError("必須提供至少兩張影格及對應時間戳。")
    if not np.all(np.diff(times) > 0):
        raise ValueError("影片時間戳必須遞增。")
    tracks, active = [], {}
    next_id = 1
    detections_seen = 0
    for frame_index, frame in enumerate(frames):
        objects = detect_heads(frame, contrast)
        detections_seen += len(objects)
        active_ids = list(active.keys())
        assignments, assigned_objects = {}, set()
        if active_ids and objects:
            last = np.array([tracks[active[k]]["points"][-1][:2] for k in active_ids])
            positions = np.array([ob[:2] for ob in objects])
            distance = np.linalg.norm(last[:, None] - positions[None, :], axis=2)
            # A real assignment is accepted only when within the distance gate.
            dt = times[frame_index] - times[frame_index - 1] if frame_index else .05
            baseline_dt = np.median(np.diff(times))
            gate = float(jump) * max(0.5, min(3., dt/max(1e-5, baseline_dt)))
            cost = distance.copy()
            cost[distance > gate] = 1e6
            row, col = linear_sum_assignment(cost)
            for r, c in zip(row, col):
                if distance[r, c] <= gate:
                    tid = active_ids[r]
                    assignments[tid] = int(c)
                    assigned_objects.add(int(c))
        new_active = {}
        for track_id, object_index in assignments.items():
            index = active[track_id]
            x, y, area = objects[object_index]
            tracks[index]["points"].append([x, y, float(times[frame_index])])
            tracks[index]["last_index"] = frame_index
            new_active[track_id] = index
        # Allow a track to survive two missing frames; rejected tracks are filtered later.
        for track_id, index in active.items():
            if track_id in assignments:
                continue
            if frame_index - tracks[index]["last_index"] <= 2:
                new_active[track_id] = index
        for i, ob in enumerate(objects):
            if i in assigned_objects:
                continue
            x, y, area = ob
            tracks.append({"id": next_id, "points": [[x, y, float(times[frame_index])]],
                           "first_index": frame_index, "last_index": frame_index})
            new_active[next_id] = len(tracks) - 1
            next_id += 1
        active = new_active
    min_frames = max(5, int(len(frames) * .25))
    out = []
    has_scale = scale is not None and float(scale) > 0
    pixel_to_unit = float(scale) if has_scale else 1.0
    for item in tracks:
        pts = item["points"]
        if len(pts) < min_frames:
            continue
        span = item["last_index"] - item["first_index"] + 1
        if len(pts) / span < .65:
            continue
        coords = np.array([p[:2] for p in pts], dtype=float)
        ts = np.array([p[2] for p in pts], dtype=float)
        duration = float(ts[-1] - ts[0])
        if duration <= 0:
            continue
        intervals = np.linalg.norm(np.diff(coords, axis=0), axis=1)
        smooth = smooth_path(coords)
        vcl = float(np.sum(intervals) * pixel_to_unit / duration)
        vsl = float(np.linalg.norm(coords[-1] - coords[0]) * pixel_to_unit / duration)
        vap = float(np.linalg.norm(np.diff(smooth, axis=0), axis=1).sum() * pixel_to_unit / duration)
        lin = (100 * vsl/vcl) if vcl > 1e-8 else 0.
        straightness = (100 * vsl/vap) if vap > 1e-8 else 0.
        # Teaching-only heuristic; not WHO-validated. NP can include flagellum-only motion
        # that head tracking cannot resolve.
        if not has_scale:
            group = "unclassified"
        elif vap >= 20.0 and straightness >= 60.0:
            group = "PR"
        elif vcl >= 5.0:
            group = "NP"
        else:
            group = "IM_candidate"
        out.append({
            "id": int(item["id"]),
            "group": group, "frames": len(pts), "duration": round(duration, 3),
            "vcl": round(vcl, 3), "vsl": round(vsl, 3),
            "vap": round(vap, 3), "lin": round(lin, 2),
            "str": round(straightness, 2),
            "points": [[round(p[0], 2), round(p[1], 2), round(p[2], 4)] for p in pts],
        })
    out.sort(key=lambda d: d["id"])
    counts = {g: sum(1 for tr in out if tr["group"] == g)
              for g in ("PR", "NP", "IM_candidate", "unclassified")}
    count = len(out)
    motility = 100. * (counts["PR"] + counts["NP"]) / count if count and has_scale else None
    progressive = 100. * counts["PR"] / count if count and has_scale else None
    return {
        "tracks": out, "counts": counts, "trackCount": count,
        "candidates": int(detections_seen), "motility": motility,
        "progressive": progressive,
        "unit": "µm/s" if has_scale else "px/s",
        "hasScale": has_scale, "width": int(frames.shape[2]), "height": int(frames.shape[1]),
        "frameCount": int(len(frames)), "duration": float(times[-1] - times[0]),
        "warnings": [
            "Classification is an unvalidated prototype estimate.",
            "Motion-only tails and non-motile debris cannot be reliably distinguished.",
            "Track count is not a validated sperm concentration or clinical count."
        ],
    }

def analyze_from_file(path, json_args):
    args = json.loads(json_args)
    width, height, n = int(args["width"]), int(args["height"]), int(args["frames"])
    arr = np.fromfile(path, dtype=np.uint8)
    if arr.size != width * height * n:
        raise ValueError("影格資料大小與解析度不一致。")
    frames = arr.reshape((n, height, width))
    result = analyze(frames, args["times"], args["scale"], args["jump"], args["contrast"])
    return json.dumps(result, ensure_ascii=False)
