from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright


BASE_URL = "http://127.0.0.1:3001"
OUTPUT_DIR = Path("output/playwright")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def wait_for_prompt(page, needle: str) -> dict:
    page.locator("#promptSection").scroll_into_view_if_needed()
    prompt_locator = page.locator("#promptOutput")
    json_locator = page.locator("#jsonOutput")

    for _ in range(8):
        page.wait_for_timeout(350)
        prompt_text = (prompt_locator.text_content() or "").strip()
        json_text = (json_locator.text_content() or "").strip()
        if needle.lower() in prompt_text.lower() and json_text.strip():
            payload = json.loads(json_text)
            return {"prompt": prompt_text, "json": payload}

    prompt_text = (prompt_locator.text_content() or "").strip()
    json_text = (json_locator.text_content() or "").strip()
    if needle.lower() not in prompt_text.lower():
        raise AssertionError(f"Prompt output does not contain '{needle}': {prompt_text[:240]}")
    payload = json.loads(json_text)
    return {"prompt": prompt_text, "json": payload}


def assert_no_console_errors(errors: list[str], label: str) -> None:
    if errors:
        joined = "\n".join(errors[:20])
        raise AssertionError(f"{label}: console/page errors detected\n{joined}")


def attach_error_listeners(page, errors: list[str]) -> None:
    page.on("pageerror", lambda exc: errors.append(f"pageerror: {exc}"))
    page.on(
        "console",
        lambda msg: errors.append(f"console:{msg.type}: {msg.text}") if msg.type == "error" else None,
    )


def audit_desktop(browser) -> dict:
    errors: list[str] = []
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    attach_error_listeners(page, errors)

    page.goto(f"{BASE_URL}/", wait_until="networkidle")
    if "/mobile" in page.url:
        raise AssertionError(f"Desktop route unexpectedly redirected: {page.url}")

    chooser = page.locator("dialog.vpe-version-dialog")
    chooser.wait_for(state="visible", timeout=5000)
    page.locator('button[data-version-choice="current"]').click()

    page.locator("#mainSubject").fill("astronaut portrait with reflective visor and rain")
    result = wait_for_prompt(page, "astronaut")

    if result["json"].get("subject") != "astronaut portrait with reflective visor and rain":
        raise AssertionError("Desktop JSON subject did not sync with the input field")

    page.screenshot(path=str(OUTPUT_DIR / "desktop-audit.png"), full_page=True)
    assert_no_console_errors(errors, "desktop")
    context.close()
    return {
        "url": page.url,
        "prompt_excerpt": result["prompt"][:180],
        "json_subject": result["json"].get("subject"),
    }


def audit_mobile(browser, iphone_device: dict) -> dict:
    errors: list[str] = []
    context = browser.new_context(**iphone_device)
    page = context.new_page()
    attach_error_listeners(page, errors)

    page.goto(f"{BASE_URL}/", wait_until="networkidle")
    if "/mobile" not in page.url:
        raise AssertionError(f"Mobile device did not redirect to /mobile/: {page.url}")

    page.locator(".mobile-intro").wait_for(state="visible", timeout=5000)
    page.locator(".mobile-bottom-bar").wait_for(state="visible", timeout=5000)

    chooser = page.locator("dialog.vpe-version-dialog")
    chooser.wait_for(state="visible", timeout=5000)
    page.locator('button[data-version-choice="current"]').click()

    page.locator("#mainSubject").fill("mobile hero card for a cinematic travel poster")
    result = wait_for_prompt(page, "travel")

    if result["json"].get("subject") != "mobile hero card for a cinematic travel poster":
        raise AssertionError("Mobile JSON subject did not sync with the input field")

    page.screenshot(path=str(OUTPUT_DIR / "mobile-audit.png"), full_page=True)

    page.locator('[data-mobile-action="desktop"]').click()
    page.wait_for_url(f"{BASE_URL}/", timeout=5000)

    page.goto(f"{BASE_URL}/", wait_until="networkidle")
    if "/mobile" in page.url:
        raise AssertionError("Desktop preference was not preserved after switching from mobile")

    page.screenshot(path=str(OUTPUT_DIR / "mobile-to-desktop-audit.png"), full_page=True)
    assert_no_console_errors(errors, "mobile")
    context.close()
    return {
        "mobile_url": f"{BASE_URL}/mobile/",
        "post_switch_url": page.url,
        "prompt_excerpt": result["prompt"][:180],
        "json_subject": result["json"].get("subject"),
    }


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            desktop_result = audit_desktop(browser)
            mobile_result = audit_mobile(browser, playwright.devices["iPhone 15"])
        finally:
            browser.close()

    report = {
        "desktop": desktop_result,
        "mobile": mobile_result,
        "artifacts": [
            str(OUTPUT_DIR / "desktop-audit.png"),
            str(OUTPUT_DIR / "mobile-audit.png"),
            str(OUTPUT_DIR / "mobile-to-desktop-audit.png"),
        ],
    }
    (OUTPUT_DIR / "live-version-audit.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Error as exc:
        raise SystemExit(f"Playwright audit failed: {exc}")
