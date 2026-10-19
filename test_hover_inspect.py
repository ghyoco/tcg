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
        page.mouse.move(0, 0)
        time.sleep(1)

        # 1. Test Hover on Bot Active Card
        print("[3] Testing Hover on Bot Active Card...")
        bot_active = page.locator(".half.top .row:last-child .card.lg")
        assert bot_active.is_visible(), "Bot active card must be visible"

        modal = page.locator("[data-testid='card-detail-modal']")
        assert not modal.is_visible(), "Modal should not be visible before hover"

        bot_active.hover()
        time.sleep(0.6)  # Wait for 400ms delay to elapse
        assert modal.is_visible(), "Modal must be visible after hovering bot active card"
        print("Bot active modal text snippet:", modal.inner_text()[:60])

        # Move mouse away to close
        page.mouse.move(10, 10)
        time.sleep(0.3)
        # Close via button if still open
        if modal.is_visible():
            page.locator("button[aria-label='Tutup']").click()
            time.sleep(0.3)
        assert not modal.is_visible(), "Modal should be closed"
        print("Bot active inspection verified!")

        # 2. Test Hover on Bot Bench Card (if any on bench)
        print("[4] Testing Hover on Bot Bench Card...")
        bot_bench = page.locator(".half.top .mid .card.sm")
        if bot_bench.count() > 0:
            bot_bench.first.hover()
            time.sleep(0.6)
            assert modal.is_visible(), "Modal must be visible after hovering bot bench card"
            print("Bot bench card inspection verified!")
            page.locator("button[aria-label='Tutup']").click()
            time.sleep(0.3)

        # 3. Test Hover on Bot Hand (Should NOT inspect!)
        print("[5] Testing Hover on Bot Hand Chip (must NOT inspect)...")
        bot_hand_chip = page.locator(".half.top .chip")
        if bot_hand_chip.is_visible():
            bot_hand_chip.hover()
            time.sleep(0.8)
            assert not modal.is_visible(), "Bot hand must NEVER show inspect modal!"
            print("Bot hand secrecy verified!")

        # 4. Test Hover on Player Active Card
        print("[6] Testing Hover on Player Active Card...")
        player_active = page.locator(".half.me .row:first-child .card.lg")
        assert player_active.is_visible()
        player_active.hover()
        time.sleep(0.6)
        assert modal.is_visible(), "Modal must be visible after hovering player active card"
        print("Player active inspection verified!")
        page.locator("button[aria-label='Tutup']").click()
        time.sleep(0.3)

        # 5. Test Hover on Player Hand Card
        print("[7] Testing Hover on Player Hand Card...")
        hand_cards = page.locator(".dock .hand .card.xs")
        assert hand_cards.count() > 0
        hand_cards.first.hover()
        time.sleep(0.6)
        assert modal.is_visible(), "Modal must be visible after hovering player hand card"
        print("Player hand inspection verified!")

        # Capture screenshot of the inspection modal!
        os.makedirs("/tmp/tcg_artifacts", exist_ok=True)
        inspect_shot = "/tmp/tcg_artifacts/card_inspection_preview.png"
        page.screenshot(path=inspect_shot)
        print(f"[8] Saved inspection screenshot to {inspect_shot}")

        # Close via ESC key
        page.keyboard.press("Escape")
        time.sleep(0.3)
        assert not modal.is_visible(), "Escape key should close inspection modal"
        print("Escape key dismissal verified!")

        browser.close()
        print("ALL CARD HOVER INSPECTION REQUIREMENTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
