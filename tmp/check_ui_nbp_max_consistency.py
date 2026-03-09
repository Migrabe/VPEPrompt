import json
from playwright.sync_api import sync_playwright

URL = "http://localhost:3000"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, wait_until="domcontentloaded")
    page.wait_for_load_state("networkidle")

    setup_result = page.evaluate(
        """
        () => {
          if (!window.state) return { ok: false, reason: 'window.state is missing' };

          window.state.aiModel = 'nano-banana-pro';
          window.state.promptFormat = 'flat';
          window.state.mainSubject = 'portrait of a person';
          window.state.maxConsistency = true;
          window.state.referenceImages = [{
            url: 'https://example.com/reference.jpg',
            width: 1024,
            height: 1024,
            description: 'reference face'
          }];

          const subjectInput = document.getElementById('mainSubject');
          if (subjectInput) subjectInput.value = 'portrait of a person';

          const maxConsistency = document.getElementById('maxConsistency');
          if (maxConsistency) maxConsistency.checked = true;

          if (typeof window.updateAll === 'function') {
            window.updateAll();
          } else if (typeof window.handleInput === 'function') {
            window.handleInput();
          }

          return { ok: true };
        }
        """
    )

    prompt_text = page.locator('#promptOutput').inner_text(timeout=10000)
    json_text = page.locator('#jsonOutput').inner_text(timeout=10000)

    print('SETUP_RESULT=' + json.dumps(setup_result, ensure_ascii=False))
    print('PROMPT_OUTPUT_START=' + prompt_text[:280].replace('\n', ' '))

    try:
      payload = json.loads(json_text)
      print('PAYLOAD_MODEL=' + str(payload.get('model')))
      print('PAYLOAD_TYPE=' + str(payload.get('type')))
      print('PAYLOAD_HAS_FACE_CONSTRAINTS=' + str('face_constraints' in payload))
      print('PAYLOAD_PROMPT_START=' + str(payload.get('prompt', ''))[:280])
    except Exception as e:
      print('JSON_PARSE_ERROR=' + str(e))
      print('JSON_RAW_START=' + json_text[:400].replace('\n', ' '))

    browser.close()
