from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3001"


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(**p.devices["iPhone 15"])
    page = context.new_page()

    page.on("pageerror", lambda exc: print("PAGEERROR:", exc))
    page.on("console", lambda msg: print(f"CONSOLE:{msg.type}: {msg.text}"))

    page.goto(f"{BASE_URL}/", wait_until="networkidle")
    print("URL:", page.url)
    print("PROMPT0:", page.locator("#promptOutput").inner_text())
    print("JSON0:", page.locator("#jsonOutput").inner_text()[:200])
    page.locator('button[data-version-choice="current"]').click()
    page.locator("#mainSubject").fill("mobile hero card for a cinematic travel poster")
    page.wait_for_timeout(2500)
    print("PROMPT1:", page.locator("#promptOutput").inner_text())
    print("JSON1:", page.locator("#jsonOutput").inner_text()[:400])
    print("READY:", page.evaluate("document.readyState"))
    print("HAS_HANDLE_INPUT:", page.evaluate("typeof window.handleInput"))
    print("HAS_UPDATE_PROMPT:", page.evaluate("typeof window.updatePrompt"))
    print("STATE:", page.evaluate("JSON.stringify({promptFormat: window.state?.promptFormat, aiModel: window.state?.aiModel, mainSubject: window.state?.mainSubject})"))
    print("BUILDFLAT:", page.evaluate("typeof window.buildFlatPrompt"))
    print("BUILDJSON:", page.evaluate("typeof window.buildJson"))
    print("MANUAL_PROMPT:", page.evaluate("(() => { try { return String(window.buildFlatPrompt ? window.buildFlatPrompt() : 'no-flat'); } catch (e) { return 'ERR:' + e.message; } })()"))
    print("MANUAL_JSON:", page.evaluate("(() => { try { const out = window.buildJson ? window.buildJson() : null; return out ? JSON.stringify(out).slice(0, 250) : String(out); } catch (e) { return 'ERR:' + e.message; } })()"))
    print("MANUAL_UPDATE:", page.evaluate("(() => { try { window.updatePrompt(); return document.getElementById('promptOutput').textContent.slice(0, 250); } catch (e) { return 'ERR:' + e.message; } })()"))
    print("MANUAL_JSON_AFTER_UPDATE:", page.evaluate("document.getElementById('jsonOutput').textContent.slice(0, 250)"))
    print("MAIN_SUBJECT:", page.locator("#mainSubject").input_value())
    page.screenshot(path="output/playwright/mobile-debug.png", full_page=True)

    context.close()
    browser.close()
