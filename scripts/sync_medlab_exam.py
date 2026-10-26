#!/usr/bin/env python3
"""Create a compact medical laboratory scientist index from the MOEX open CSV.
Source: https://data.gov.tw/dataset/170565
Only metadata and original MOEX question/answer URLs are retained; no PDF content.
"""
import csv, datetime, io, json, os, re, sys, urllib.parse, urllib.request
from pathlib import Path

SOURCE = "https://wwwc.moex.gov.tw/main/Exam/wHandExamQandA_CSV.ashx"
OUTPUT = Path("assets/data/moex_medlab.json")
ALLOWED = ("moex.gov.tw",)

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
    last = None
    for encoding in ("utf-8-sig", "cp950", "big5hkscs"):
        try:
            decoded = raw.decode(encoding)
            reader = csv.DictReader(io.StringIO(decoded, newline=""))
            if not reader.fieldnames:
                continue
            reader.fieldnames = [str(c or "").replace("\ufeff","").strip().replace(" ", "") for c in reader.fieldnames]
            if not any("考試" in c or "試題" in c for c in reader.fieldnames):
                continue
            return list(reader), encoding, reader.fieldnames
        except (UnicodeDecodeError, csv.Error) as exc:
            last = exc
    raise ValueError("Cannot decode official CSV: " + str(last))

def parse_year(s):
    m = re.search(r"\d{2,4}", s or "")
    if not m:
        return None
    value = int(m.group())
    return value - 1911 if value > 1911 else value

def main():
    request = urllib.request.Request(SOURCE, headers={"User-Agent": "Bioflumen-MLS-open-data-index/1.0 (+https://jimhaoch.github.io/courses.html)", "Accept": "text/csv,*/*"})
    with urllib.request.urlopen(request, timeout=85) as response:
        raw = response.read(60_000_000)
    rows, encoding, columns = read_rows(raw)
    items = {}
    candidate_count = 0
    for r in rows:
        # Exam name may enumerate all allied-health professions; DO NOT use it alone.
        specialty = first(r, ("類科組別", "考試及等別", "類科名稱", "類科", "組別", "類別", "類科組別名稱"))
        if "醫事檢驗師" not in specialty and "醫事檢驗" not in specialty:
            continue
        candidate_count += 1
        year = parse_year(first(r, ("考試年度", "年度", "考試年")))
        subject = first(r, ("科目全名", "科目名稱", "考試科目", "科目"))
        question = official_url(first(r, ("試題網址", "考畢試題網址", "試題連結")))
        answer = official_url(first(r, ("測驗式試題答案網址", "答案網址", "測驗題標準答案網址", "標準答案網址")))
        if not year or year < 90 or year > 200 or not subject or not (question or answer):
            continue
        exam = first(r, ("考試名稱", "考試及等別", "考試簡稱"))
        session = first(r, ("節次", "考試節次", "考試次別"))
        test_type = first(r, ("試題型態", "題型"))
        notes = first(r, ("備註",))
        item = {"year": year, "subject": subject, "exam": exam[:190], "session": session[:40], "type": test_type[:32], "question": question, "answer": answer, "notes": notes[:160]}
        key = (year, subject, exam, session, question)
        items[key] = item
    output = sorted(items.values(), key=lambda r:(-r["year"],r["exam"],r["subject"],r["session"]))
    if len(output) < 60 or len({v["year"] for v in output}) < 5:
        raise RuntimeError(f"Source parsing failed: {len(rows)} total rows, {candidate_count} candidate rows, {len(output)} output records; header: {columns!r}. Refusing to replace published data.")
    years = sorted({v["year"] for v in output}, reverse=True)
    data = {
        "source": SOURCE,
        "dataset": "https://data.gov.tw/dataset/170565",
        "retrieved_at_utc": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
        "records": len(output),
        "years": years,
        "entries": output,
        "note": "Official MOEX link metadata only; always consult the official website for amended answer keys."
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",",":"))+"\n", encoding="utf-8")
    print(f"Success: {len(output)} MLS rows from {len(years)} years; encoding={encoding}, rawBytes={len(raw)}, filename={OUTPUT}")
if __name__ == "__main__":
    main()
