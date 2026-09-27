from pathlib import Path
from io import BytesIO
import json
import re
import time
import unicodedata

import requests
from bs4 import BeautifulSoup
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
BOX_PATH = ROOT / "data/boxoffice.json"
RANK_PATH = ROOT / "rankings.html"
HTML_BASE = "https://www.eiren.org/toukei/{year}.html"
PDF_BASE = "https://www.eiren.org/toukei/img/eiren_kosyu/data_{year}.pdf"
HEADERS = {"User-Agent": "Cinemap/1.0 historical-boxoffice-backfill (static one-time import)"}


def norm(value):
    return unicodedata.normalize("NFKC", str(value or "")).replace("\xa0", " ").strip()


def parse_numeric(text):
    text = norm(text).replace(",", "")
    m = re.search(r"\d+(?:\.\d+)?", text)
    return float(m.group(0)) if m else None


def dedupe(rows, year, url):
    seen = set()
    unique = []
    for row in rows:
        key = (row["title"], row["region"], row["gross"])
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)
    unique.sort(key=lambda x: x["gross"], reverse=True)
    if len(unique) < 5:
        raise RuntimeError(f"{year}: parsed only {len(unique)} rows from {url}")
    return unique


def section_for(table):
    for prev in table.find_all_previous(limit=30):
        text = norm(prev.get_text(" ", strip=True))
        if "邦画" in text and len(text) < 80:
            return "邦画"
        if "洋画" in text and len(text) < 80:
            return "洋画"
    return None


def scrape_html_year(year):
    url = HTML_BASE.format(year=year)
    response = requests.get(url, headers=HEADERS, timeout=25)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    soup = BeautifulSoup(response.text, "html.parser")
    page_text = norm(soup.get_text(" ", strip=True))
    compact = page_text.replace(" ", "")
    unit_million = "単位:百万円" in compact or "単位：百万円" in compact
    metric = "配給収入" if year <= 1999 else "興行収入"
    rows = []

    for table in soup.find_all("table"):
        region = section_for(table)
        if region not in {"邦画", "洋画"}:
            continue
        trs = table.find_all("tr")
        title_idx = amount_idx = header_row = None
        for ridx, tr in enumerate(trs[:8]):
            cells = [norm(c.get_text(" ", strip=True)) for c in tr.find_all(["th", "td"])]
            for idx, cell in enumerate(cells):
                key = cell.replace(" ", "")
                if title_idx is None and ("作品名" in key or "題名" in key):
                    title_idx = idx
                if amount_idx is None and ("興収" in key or "興行収入" in key or "配給収入" in key):
                    amount_idx = idx
            if title_idx is not None and amount_idx is not None:
                header_row = ridx
                break
        if title_idx is None or amount_idx is None:
            continue

        for tr in trs[(header_row or 0) + 1:]:
            cells = tr.find_all(["th", "td"])
            if max(title_idx, amount_idx) >= len(cells):
                continue
            title = norm(cells[title_idx].get_text(" / ", strip=True))
            amount = parse_numeric(cells[amount_idx].get_text(" ", strip=True))
            if not title or amount is None:
                continue
            gross_oku = amount / 100.0 if unit_million else amount
            rows.append({"title": title, "gross": round(gross_oku, 3), "year": year,
                         "region": region, "metric": metric, "source_url": url})
    return dedupe(rows, year, url)


def table_header_indices(table):
    for ridx, row in enumerate(table[:8]):
        cells = [norm(x) for x in row]
        title_idx = amount_idx = None
        for idx, cell in enumerate(cells):
            key = cell.replace(" ", "").replace("\n", "")
            if title_idx is None and ("作品名" in key or "題名" in key):
                title_idx = idx
            if amount_idx is None and ("興収" in key or "興行収入" in key):
                amount_idx = idx
        if title_idx is not None and amount_idx is not None:
            return ridx, title_idx, amount_idx
    return None


def scrape_pdf_year(year):
    url = PDF_BASE.format(year=year)
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    valid_tables = []
    with pdfplumber.open(BytesIO(response.content)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                idx = table_header_indices(table)
                if idx:
                    valid_tables.append((table, idx))
    if len(valid_tables) < 2:
        raise RuntimeError(f"{year}: expected 邦画/洋画 tables in {url}, got {len(valid_tables)}")

    rows = []
    # Official PDFs place 邦画 first and 洋画 second. Any later summary table is ignored.
    for region, (table, indices) in zip(("邦画", "洋画"), valid_tables[:2]):
        header_row, title_idx, amount_idx = indices
        for row in table[header_row + 1:]:
            if not row or max(title_idx, amount_idx) >= len(row):
                continue
            title = norm(row[title_idx]).replace("\n", " ")
            amount = parse_numeric(row[amount_idx])
            if not title or amount is None:
                continue
            # Avoid total/footer rows sometimes captured by PDF table extraction.
            if "興収計" in title or "合計" in title:
                continue
            rows.append({"title": title, "gross": round(amount, 3), "year": year,
                         "region": region, "metric": "興行収入", "source_url": url})
    return dedupe(rows, year, url)


def scrape_year(year):
    return scrape_html_year(year) if year <= 2010 else scrape_pdf_year(year)


def update_data():
    data = json.loads(BOX_PATH.read_text(encoding="utf-8"))
    by_year = data.setdefault("by_year", {})
    for year in range(1980, 2020):
        print(f"Fetching {year}...", flush=True)
        by_year[str(year)] = scrape_year(year)
        time.sleep(0.15)
    data["by_year"] = dict(sorted(by_year.items(), key=lambda kv: int(kv[0]), reverse=True))
    data["generated_at"] = "2026-09-27"
    sources = data.setdefault("sources", [])
    source_name = "日本映画製作者連盟 過去興行収入上位作品 1980-2019"
    sources = [s for s in sources if s.get("name") != source_name]
    sources.append({
        "name": source_name,
        "url": "https://www.eiren.org/toukei/data.html",
        "as_of": "2026-09-27",
        "note": "1980-1999は配給収入、2000年以降は興行収入。1980-2010は各年HTML、2011-2019は映連公式PDFから静的取得。",
    })
    data["sources"] = sources
    BOX_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_ui():
    text = RANK_PATH.read_text(encoding="utf-8")
    old_amount = "'+Number(m.gross||0).toFixed(1)+'億円</div>"
    new_amount = "'+(m.metric||\"興行収入\")+' '+Number(m.gross||0).toFixed(1)+'億円</div>"
    if old_amount in text:
        text = text.replace(old_amount, new_amount, 1)
    elif 'm.metric||"興行収入"' not in text:
        raise RuntimeError("ranking amount label pattern not found")

    old_note = '$("#sourceNote").textContent="日本国内興行収入 · 国内/国外は公式資料の邦画/洋画区分を優先 · "+(boxEra==="歴代"?"歴代ベスト100":""+boxEra+"年");hydrateBoxCardsLazy()'
    new_note = 'const pre2000=boxEra!=="歴代"&&Number(boxEra)<2000;$("#sourceNote").textContent=pre2000?"日本映画製作者連盟 · 1999年以前は配給収入（興行収入とは指標が異なります） · 国内/国外=邦画/洋画":"日本国内興行収入 · 国内/国外は公式資料の邦画/洋画区分を優先 · "+(boxEra==="歴代"?"歴代ベスト100":""+boxEra+"年");hydrateBoxCardsLazy()'
    if old_note in text:
        text = text.replace(old_note, new_note, 1)
    elif '1999年以前は配給収入' not in text:
        raise RuntimeError("ranking source note pattern not found")

    RANK_PATH.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    update_data()
    update_ui()
    print("Backfilled official annual ranking data from 1980 through 2019")
