from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(r"C:\Users\TOT\Documents\MOVEVPE")
REF1 = ROOT / "tmp" / "ref_test.png"
REF2 = ROOT / "tmp" / "ref_test_2.png"
URL = "http://127.0.0.1:3006"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1400})
    page.goto(URL, wait_until="networkidle")

    page.locator('button[data-group="aiModel"][data-value="stable-diffusion"]').click()
    page.locator('#mainSubject').fill('multi reference upload test')
    page.locator('#referencesSection .section-header').click()

    page.locator('#referenceImages').set_input_files(str(REF1))
    page.wait_for_function("() => document.querySelectorAll('#imagePreviews .image-preview-card').length === 1")

    page.locator('#referenceImages').set_input_files(str(REF2))
    page.wait_for_function("() => document.querySelectorAll('#imagePreviews .image-preview-card').length === 2")

    page.evaluate(
        """
        () => {
          const setExtract = (imgIndex, optIndex) => {
            const el = document.querySelector(`input[data-ext-img="${imgIndex}"][data-ext-opt="${optIndex}"]`);
            el.checked = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          };
          setExtract(0, 0);
          setExtract(1, 3);
        }
        """
    )
    page.locator('textarea[data-desc-index="0"]').fill('keep this background only')
    page.locator('textarea[data-desc-index="1"]').fill('keep this single person only')

    page.wait_for_function(
        """
        () => {
          const jsonRaw = document.querySelector('#jsonOutput')?.textContent || '{}';
          const prompt = document.querySelector('#promptOutput')?.textContent || '';
          return jsonRaw.includes('"count": 2')
            && prompt.includes('Reference 1: extract face / identity, keep this background only.')
            && prompt.includes('Reference 2: extract style, keep this single person only.');
        }
        """,
        timeout=15000,
    )

    json_text = page.locator('#jsonOutput').text_content() or '{}'
    prompt_text = page.locator('#promptOutput').text_content() or ''
    payload = json.loads(json_text)
    refs = (payload.get('references') or {}).get('images') or []

    assert len(refs) == 2, refs
    assert refs[0].get('extract') == ['Лицо', 'keep this background only'], refs
    assert refs[1].get('extract') == ['Стиль', 'keep this single person only'], refs
    assert 'Reference 1: extract face / identity, keep this background only.' in prompt_text, prompt_text
    assert 'Reference 2: extract style, keep this single person only.' in prompt_text, prompt_text

    print(json.dumps({
        'cards': 2,
        'references_count': (payload.get('references') or {}).get('count'),
        'first_extract': refs[0].get('extract'),
        'second_extract': refs[1].get('extract')
    }, ensure_ascii=False))
    browser.close()
