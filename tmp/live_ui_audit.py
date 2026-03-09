from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(r"C:\Users\TOT\Documents\MOVEVPE")
REF = ROOT / "tmp" / "ref_test.png"
URL = "http://127.0.0.1:3004"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1200})
    page.goto(URL, wait_until="networkidle")

    page.locator('button[data-group="aiModel"][data-value="stable-diffusion"]').click()
    page.locator('#mainSubject').fill('reference metadata test')
    page.locator('#referenceImages').set_input_files(str(REF))

    page.wait_for_function(
        """
        () => {
          const raw = document.querySelector('#jsonOutput')?.textContent || '';
          return raw.includes('"references"') && raw.includes('"width": 1') && raw.includes('"height": 1');
        }
        """,
        timeout=15000,
    )

    raw = page.locator('#jsonOutput').text_content() or '{}'
    payload = json.loads(raw)
    img = ((payload.get('references') or {}).get('images') or [{}])[0]
    assert img.get('width') == 1, f"width mismatch: {img}"
    assert img.get('height') == 1, f"height mismatch: {img}"
    print(json.dumps({
        'title': page.title(),
        'width': img.get('width'),
        'height': img.get('height'),
        'json_synced': True
    }, ensure_ascii=False))
    browser.close()
