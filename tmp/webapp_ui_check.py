from playwright.sync_api import sync_playwright


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 980})
        page.goto('http://127.0.0.1:3000', wait_until='domcontentloaded')
        page.wait_for_load_state('networkidle')

        reset_text = page.locator('#headerResetBtn').inner_text().strip()
        notif = page.locator('#notification')
        notif_role = notif.get_attribute('role') or ''
        notif_live = notif.get_attribute('aria-live') or ''

        page_mobile = browser.new_page(viewport={"width": 390, "height": 844})
        page_mobile.goto('http://127.0.0.1:3000', wait_until='domcontentloaded')
        page_mobile.wait_for_load_state('networkidle')
        header_btn_height = page_mobile.eval_on_selector(
            '#headerResetBtn',
            'el => getComputedStyle(el).minHeight'
        )

        page_mobile.screenshot(path='/tmp/vpe_ui_check_mobile.png', full_page=True)

        checks = [
            (reset_text == 'Сброс', f"header reset text: {reset_text!r}"),
            (notif_role in ('status', 'alert'), f"notification role: {notif_role!r}"),
            (notif_live in ('polite', 'assertive'), f"notification aria-live: {notif_live!r}"),
            (header_btn_height in ('44px', '44.0px'), f"mobile header reset min-height: {header_btn_height!r}"),
        ]

        failed = [msg for ok, msg in checks if not ok]
        for ok, msg in checks:
            print(('PASS' if ok else 'FAIL') + ' - ' + msg)

        browser.close()
        if failed:
            print('SUMMARY: FAIL')
            return 1

        print('SUMMARY: PASS')
        return 0


if __name__ == '__main__':
    raise SystemExit(run())
