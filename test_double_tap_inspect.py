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

        # Setup
        print("[2] Selecting active creature from setup...")
        creatures = page.locator("[data-setup-creature='true'] .card")
        creatures.first.click()
        time.sleep(0.5)
        page.locator("button:has-text('Mulai Pertarungan')").click()
        time.sleep(1.5)

        modal = page.locator("[data-testid='card-detail-modal']")

        # 1. VERIFY HOVER DOES NOT TRIGGER MODAL
        print("[3] Testing that HOVER does NOT trigger modal anymore...")
        bot_active = page.locator(".half.top .row:last-child .card.lg")
        assert bot_active.is_visible()
        bot_active.hover()
        time.sleep(1.2)  # Wait longer than previous 450ms
        assert not modal.is_visible(), "Modal must NOT appear on hover!"
        print("Hover test passed: No modal appeared on hover!")

        # 2. TEST DOUBLE CLICK ON BOT ACTIVE CARD
        print("[4] Testing DOUBLE CLICK on Bot Active Card...")
        bot_active.dblclick()
        time.sleep(0.5)
        assert modal.is_visible(), "Modal must appear on double click of Bot Active card!"
        print("Bot active modal opened on double click! Title snippet:", modal.inner_text()[:50])
        # Close modal
        page.locator("button[aria-label='Tutup']").click()
        time.sleep(0.3)
        assert not modal.is_visible()
        print("Modal closed cleanly!")

        # 3. TEST DOUBLE CLICK ON BOT BENCH CARD (if any)
        print("[5] Testing DOUBLE CLICK on Bot Bench Card...")
        bot_bench = page.locator(".half.top .mid .card.sm")
        if bot_bench.count() > 0:
            bot_bench.first.dblclick()
            time.sleep(0.5)
            assert modal.is_visible(), "Modal must appear on double click of Bot Bench card!"
            print("Bot bench card modal opened on double click!")
            page.locator("button[aria-label='Tutup']").click()
            time.sleep(0.3)

        # 4. TEST DOUBLE CLICK ON BOT HAND (Must NOT show modal)
        print("[6] Testing DOUBLE CLICK on Bot Hand (Secrecy check)...")
        bot_hand_chip = page.locator(".half.top .chip")
        if bot_hand_chip.is_visible():
            bot_hand_chip.dblclick()
            time.sleep(0.5)
            assert not modal.is_visible(), "Bot hand must NEVER open inspection modal!"
            print("Bot hand secrecy verified!")

        # 5. TEST DOUBLE CLICK ON PLAYER ACTIVE CARD
        print("[7] Testing DOUBLE CLICK on Player Active Card...")
        player_active = page.locator(".half.me .row:first-child .card.lg")
        assert player_active.is_visible()
        player_active.dblclick()
        time.sleep(0.5)
        assert modal.is_visible(), "Modal must appear on double click of Player Active card!"
        print("Player active modal opened on double click!")
        page.locator("button[aria-label='Tutup']").click()
        time.sleep(0.3)

        # 6. TEST DOUBLE CLICK ON PLAYER HAND CARD
        print("[8] Testing DOUBLE CLICK on Player Hand Card...")
        hand_cards = page.locator(".dock .hand .card.xs")
        assert hand_cards.count() > 0
        hand_cards.first.dblclick()
        time.sleep(0.5)
        assert modal.is_visible(), "Modal must appear on double click of Player Hand card!"
        print("Player hand modal opened on double click!")

        os.makedirs("/tmp/tcg_artifacts", exist_ok=True)
        shot_path = "/tmp/tcg_artifacts/double_tap_verified.png"
        page.screenshot(path=shot_path)
        print(f"Saved screenshot to {shot_path}")

        # Close via Escape
        page.keyboard.press("Escape")
        time.sleep(0.3)
        assert not modal.is_visible()

        browser.close()
        print("ALL DOUBLE TAP INSPECTION REQUIREMENTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
