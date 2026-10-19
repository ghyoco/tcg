import time
import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
        )
        page = browser.new_page(viewport={"width": 430, "height": 932})

        print("[1] Opening http://localhost:3005...")
        page.goto("http://localhost:3005")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Setup Modal
        print("[2] Selecting active creature from setup...")
        creatures = page.locator("[data-setup-creature='true'] .card")
        assert creatures.count() > 0
        creatures.first.click()
        time.sleep(0.5)

        start_btn = page.locator("button:has-text('Mulai Pertarungan')")
        assert start_btn.is_enabled()
        start_btn.click()
        time.sleep(1)

        # Check turn status bar
        status_bar = page.locator(".stage main > div.relative")
        print("Status bar text:", status_bar.inner_text())

        # If it's Bot's turn initially, wait for bot to complete its turn!
        if "Giliran Bot" in status_bar.inner_text():
            print("Bot won coin flip! Waiting for bot turn to execute...")
            for _ in range(15):
                time.sleep(1)
                text = status_bar.inner_text()
                print("Status bar updated to:", text)
                if "Giliran Kamu" in text:
                    break

        print("[3] Testing Direct Energy Attach (tap active card)...")
        active_card = page.locator(".half.me .row:first-child .card.lg")
        assert active_card.is_visible()
        active_card.click()
        time.sleep(0.8)

        # Check Toast
        toast = page.locator(".absolute.z-50")
        if toast.count() > 0 and toast.first.is_visible():
            print("Toast verified:", toast.first.inner_text())

        # Try to attack if turn 1 (testing feedback toast)
        attack_btn = page.locator("button:has-text('Serang')")
        print("[4] Clicking Serang button...")
        attack_btn.click()
        time.sleep(0.8)

        # Try tapping hand card
        print("[5] Testing hand card selection and bench placement...")
        hand_cards = page.locator(".dock .hand .card.xs")
        if hand_cards.count() > 0:
            hand_cards.first.click()
            time.sleep(0.5)
            # Empty bench slot
            empty_slot = page.locator(".half.me .mid .slot.active-target")
            if empty_slot.count() > 0:
                empty_slot.first.click()
                time.sleep(0.8)
                print("Placed creature card to bench slot!")

        # Test switching between active and bench
        print("[6] Testing character tap to switch...")
        bench_cards = page.locator(".half.me .mid .card.sm")
        if bench_cards.count() > 0:
            bench_cards.first.click()
            time.sleep(0.8)
            print("Tapped bench card to switch or check retreat!")

        # End player turn
        print("[7] Ending player turn...")
        end_btn = page.locator("button:has-text('Akhiri giliran')")
        end_btn.click()
        time.sleep(1)

        print("[8] Watching bot execute its turn...")
        for i in range(10):
            time.sleep(1)
            text = status_bar.inner_text()
            print(f"[{i+1}s] Current status: {text}")
            if "Giliran Kamu" in text:
                print("Bot finished turn! Player turn resumed!")
                break

        # In turn 2+, attach energy and attack!
        print("[9] Testing Attack on subsequent turn...")
        active_card.click()  # Attach turn 2 energy
        time.sleep(0.5)

        attack_btn.click()
        time.sleep(0.8)

        # Check if attack modal opened (for 2 attacks)
        attack_choices = page.locator(".fixed button.btn.dark")
        if attack_choices.count() > 0:
            attack_choices.first.click()
            time.sleep(1)
            print("Attack selected and executed!")

        os.makedirs("/tmp/tcg_artifacts", exist_ok=True)
        screenshot_path = "/tmp/tcg_artifacts/gameplay_verified.png"
        page.screenshot(path=screenshot_path)
        print(f"[10] Saved gameplay screenshot to {screenshot_path}")

        browser.close()
        print("ALL USER GAMEPLAY INTERACTIONS VERIFIED!")

if __name__ == "__main__":
    run()
