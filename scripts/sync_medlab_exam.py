#!/usr/bin/env python3
"""Refresh a metadata-only Medical Laboratory Scientist MOEX past-paper index.

Open dataset 170565: https://data.gov.tw/dataset/170565
No PDF content or copyrighted figures are mirrored. Failure never deletes the published index.
"""
import csv
import datetime
import io
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

SOURCE = "https://wwwc.moex.gov.tw/main/Exam/wHandExamQandA_CSV.ashx"
OUTPUT = Path("assets/data/moex_medlab.json")
SUBJECT_PREFIXES = (
    "臨床生理學", "臨床血液學", "醫學分子檢驗學",
    "微生物學與臨床微生物學", "生物化學與臨床生化學",
    "臨床血清免疫學"
)

def official_url(value):
    value = (value or "").strip().replace("\ufeff", "")
    if not value:
        return ""
    if value.startswith("/"):
        value = urllib.parse.urljoin("https://wwwq.moex.gov.tw/", value)
    try:
        u = urllib.parse.urlsplit(value)
        host = (u.hostname or "").lower()
        if u.scheme not in ("http", "https") or not (host == "moex.gov.tw" or host.endswith(".moex.gov.tw")):
            return ""
        return urllib.parse.urlunsplit(("https", u.netloc, u.path, u.query, ""))
    except ValueError:
        return ""

def first(row, names):
    for n in names:
        v = row.get(n, "")
        if v is not None and str(v).strip():
            return str(v).strip()
    return ""

def read_rows(raw):
    errors = []
    for encoding in ("utf-8-sig", "cp950", "big5hkscs"):
        try:
            decoded = raw.decode(encoding)
            reader = csv.DictReader(io.StringIO(decoded, newline=""))
            if not reader.fieldnames:
                continue
            reader.fieldnames = [str(c or "").replace("\ufeff", "").strip().replace(" ", "") for c in reader.fieldnames]
            if not {"考試年度", "類科組別", "科目全名", "試題網址"}.issubset(set(reader.fieldnames)):
                continue
            return list(reader), encoding, reader.fieldnames
        except (UnicodeDecodeError, csv.Error) as exc:
            errors.append(str(exc))
    raise ValueError("Could not decode official MOEX CSV with expected headers: " + "; ".join(errors))

def parse_year(text):
    m = re.search(r"\d{2,4}", text or "")
    if not m:
        return None
    v = int(m.group())
    return v - 1911 if v > 1911 else v

def exam_session(exam, session_hint):
    match = re.search(r"第([一二三四])次", exam or "")
    if match:
        return "第" + match.group(1) + "次"
    if re.fullmatch(r"第[一二三四]次", session_hint or ""):
        return session_hint
    # CSV 節次 is a subject time-slot, NOT an exam session. Leave blank if unclear.
    return ""

def previous_corrections():
    if not OUTPUT.exists():
        return {}
    try:
        data = json.loads(OUTPUT.read_text(encoding="utf-8"))
        return {(x.get("year"), x.get("subject"), x.get("question")): official_url(x.get("correction")) for x in data.get("entries", []) if x.get("correction")}
    except (OSError, ValueError):
        return {}

def main():
    req = urllib.request.Request(SOURCE, headers={
        "User-Agent": "Bioflumen-MOEX-open-data-index/2.0 (https://jimhaoch.github.io/resources/exam.html)",
        "Accept": "text/csv,application/octet-stream,*/*"
    })
    with urllib.request.urlopen(req, timeout=110) as response:
        raw = response.read(65_000_001)
    if len(raw) > 65_000_000:
        raise RuntimeError("Official CSV exceeds the 65 MB safety limit; retaining previous index.")
    rows, encoding, columns = read_rows(raw)
    corrections = previous_corrections()
    unique = {}
    skipped = 0
    for r in rows:
        specialty = first(r, ("類科組別", "類科名稱", "類科", "類科組別名稱"))
        if "醫事檢驗師" not in specialty:
            continue
        year = parse_year(first(r, ("考試年度", "年度")))
        subject = first(r, ("科目全名", "科目名稱", "考試科目"))
        question = official_url(first(r, ("試題網址", "考畢試題網址")))
        answer = official_url(first(r, ("測驗式試題答案網址", "答案網址", "測驗題標準答案網址")))
        if not year or year < 101 or year > 200 or not any(subject.startswith(p) for p in SUBJECT_PREFIXES) or not (question or answer):
            skipped += 1
            continue
        exam = first(r, ("考試名稱", "考試及等別", "考試簡稱"))
        session = exam_session(exam, first(r, ("節次", "考試節次", "考試次別")))
        if not session:
            skipped += 1
            continue
        question_code = urllib.parse.parse_qs(urllib.parse.urlsplit(question or answer).query).get("code", [""])[0]
        source_page = (
            "https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx?e=" + question_code + "&y=" + str(year + 1911)
            if re.fullmatch(r"\d{5,6}", question_code) else ""
        )
        key = (year, session, subject)
        record = {
            "year": year, "subject": subject, "exam": exam[:190], "session": session,
            "type": first(r, ("試題型態", "題型"))[:35],
            "question": question, "answer": answer,
            "correction": corrections.get((year, subject, question), ""),
            "source_page": source_page,
            "notes": first(r, ("備註",))[:160]
        }
        if key in unique:
            old = unique[key]
            if bool(record["question"]) + bool(record["answer"]) <= bool(old["question"]) + bool(old["answer"]):
                continue
        unique[key] = record
    entries = sorted(unique.values(), key=lambda r: (-r["year"], r["session"], r["subject"]))
    years = sorted({e["year"] for e in entries}, reverse=True)
    if len(entries) < 60 or len(years) < 5 or len({e["subject"][:4] for e in entries}) < 5:
        raise RuntimeError(
            f"Refusing to replace published index: {len(rows)} CSV rows, {len(entries)} selected, "
            f"{len(years)} years, {skipped} skipped; headers={columns!r}"
        )
    payload = {
        "source": SOURCE,
        "dataset": "https://data.gov.tw/dataset/170565",
        "retrieved_at_utc": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
        "records": len(entries), "years": years, "entries": entries,
        "note": "Metadata links only; verify the official website for post-publication corrections."
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":"))+"\n", encoding="utf-8")
    print(f"Indexed {len(entries)} official MLS records / {len(years)} years from {len(rows)} CSV rows ({encoding}).")

if __name__ == "__main__":
    main()
