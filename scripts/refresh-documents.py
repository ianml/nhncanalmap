"""Refresh the versioned, page-by-page search text; never modify source PDFs.

Requires curl and Poppler (pdfinfo, pdftotext, pdftoppm). Install Tesseract
for scanned pages. Ordinary Astro builds only read the resulting JSON cache.
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "search/documents"
DOWNLOADS = ROOT / ".cache/search-pdfs"


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def clean(text):
    text = re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", text)
    return re.sub(r"\s+", " ", text).strip()


def refresh(source, force=False):
    path = CACHE / f"{source['id']}.json"
    previous = json.loads(path.read_text()) if path.exists() else {}
    if previous.get("url") != source["url"]:
        previous = {}
    with tempfile.TemporaryDirectory(dir=DOWNLOADS) as work:
        work = Path(work)
        pdf, headers = work / "source.pdf", work / "headers"
        args = ["curl", "--fail", "--location", "--silent", "--show-error",
                "--connect-timeout", "30", "--max-time", "600", "--retry", "2",
                "--dump-header", str(headers), "--output", str(pdf), "--write-out", "%{http_code}"]
        if not force:
            if previous.get("etag"):
                args += ["--header", f"If-None-Match: {previous['etag']}"]
            elif previous.get("lastModified"):
                args += ["--header", f"If-Modified-Since: {previous['lastModified']}"]
        status = run(*args, source["url"]).strip()
        if status == "304":
            print(f"{source['id']}: unchanged", flush=True)
            return
        with pdf.open("rb") as stream:
            if not stream.read(1024).lstrip().startswith(b"%PDF-"):
                raise ValueError("Response is not a PDF")
            stream.seek(0)
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        if not force and digest == previous.get("sha256"):
            print(f"{source['id']}: unchanged content", flush=True)
            return
        info = run("pdfinfo", str(pdf))
        count = int(re.search(r"^Pages:\s+(\d+)", info, re.M)[1])
        text = run("pdftotext", "-enc", "UTF-8", str(pdf), "-")
        raw_pages = text.split("\f")
        if raw_pages[-1].strip() == "":
            raw_pages.pop()
        if len(raw_pages) != count:
            raise ValueError(f"Page extraction mismatch: {len(raw_pages)} / {count}")
        pages, low_text = [], []
        for number, raw in enumerate(raw_pages, 1):
            method = "text"
            content = clean(raw)
            if sum(c.isalpha() for c in content) < 60:
                if not shutil.which("tesseract"):
                    raise RuntimeError(f"Page {number} needs OCR; install Tesseract and retry")
                prefix = work / "page"
                run("pdftoppm", "-f", str(number), "-l", str(number), "-singlefile", "-scale-to", "2600", "-png", str(pdf), str(prefix))
                recognized = clean(run("tesseract", str(prefix) + ".png", "stdout", "-l", "eng"))
                if len(recognized) > len(content):
                    content, method = recognized, "ocr"
                if sum(c.isalpha() for c in content) < 60:
                    low_text.append(number)
            pages.append({"page": number, "text": content, "method": method})
        header_text = headers.read_text()
        def header(name):
            matches = re.findall(rf"^{name}:\s*(.+)$", header_text, re.M | re.I)
            return matches[-1].strip() if matches else None
        record = {"schema": 1, "id": source["id"], "url": source["url"], "sha256": digest,
                  "etag": header("etag"), "lastModified": header("last-modified"),
                  "extractedAt": datetime.now(timezone.utc).isoformat(),
                  "pageCount": count, "lowTextPages": low_text, "pages": pages}
        temporary = path.with_suffix(".tmp")
        temporary.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
        temporary.replace(path)
        # Keep the originals locally for extraction QA; not checked in or deployed.
        shutil.copyfile(pdf, DOWNLOADS / f"{source['id']}.pdf")
        ocr_count = sum(p["method"] == "ocr" for p in pages)
        print(f"{source['id']}: {count} pages, {ocr_count} OCR; low-text pages: {low_text}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="Re-download and extract even unchanged PDFs")
    parser.add_argument("--id", help="Refresh one catalogue ID")
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    sources = json.loads((ROOT / "src/data/sources.json").read_text())
    selected = [s for s in sources if s["pdf"] and (not args.id or args.id == s["id"])]
    if not selected:
        parser.error("No matching PDF sources")
    failures = []
    for source in selected:
        print(f"Checking {source['id']}…", flush=True)
        try:
            refresh(source, args.force)
        except Exception as error:
            detail = getattr(error, "stderr", None) or str(error)
            failures.append(source["id"])
            print(f"FAILED {source['id']}: {detail.strip()} (previous index retained)", flush=True)
    if failures:
        raise SystemExit(f"Refresh incomplete: {', '.join(failures)}")
