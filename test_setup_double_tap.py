import time
import os
from playwright.sync_api import sync_playwright

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        )
        page = browser.new_page(viewport={"width": 430, "height": 932})

        print("[1] Opening http://localhost:3005...")
        page.goto("http://localhost:3005")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Check SetupModal is open
        assert page.locator("h2:has-text('Pilih Kartu Aktif')").is_visible()
        setup_cards = page.locator("[data-setup-creature='true'] .card")
        assert setup_cards.count() > 0

        # 1. Test Double Click on Card during Setup
        print("[2] Testing DOUBLE CLICK on card in SetupModal...")
        first_card = setup_cards.first
        first_card.dblclick()
        time.sleep(0.5)

        detail_modal = page.locator("[data-testid='card-detail-modal']")
        assert detail_modal.is_visible(), "CardDetailModal must appear on double click during setup!"
        print("Card preview appeared during setup! Title snippet:", detail_modal.inner_text()[:60])

        # Save screenshot of preview open over SetupModal
        os.makedirs("/tmp/tcg_artifacts", exist_ok=True)
        shot_path = "/tmp/tcg_artifacts/setup_double_tap_verified.png"
        page.screenshot(path=shot_path)
        print(f"[3] Screenshot saved to {shot_path}")

        # 2. Close preview
        print("[4] Closing preview modal...")
        page.locator("button[aria-label='Tutup']").click()
        time.sleep(0.3)
        assert not detail_modal.is_visible(), "CardDetailModal should close"
        assert page.locator("h2:has-text('Pilih Kartu Aktif')").is_visible(), "SetupModal should remain open"
        print("SetupModal still active!")

        # 3. Select active card via single click and start battle
        print("[5] Selecting active creature via single click and starting battle...")
        first_card.click()
        time.sleep(0.4)
        start_btn = page.locator("button:has-text('Mulai Pertarungan')")
        assert start_btn.is_enabled()
        start_btn.click()
        time.sleep(1)

        # Verify battle started
        status_bar = page.locator(".stage main > div.relative")
        assert status_bar.is_visible()
        print("Battle started smoothly! Status:", status_bar.inner_text())

        browser.close()
        print("SETUP DOUBLE TAP INSPECTION FULLY VERIFIED!")

if __name__ == "__main__":
    run_test()
