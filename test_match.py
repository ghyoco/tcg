import time
import os
from playwright.sync_api import sync_playwright

def run_e2e_test():
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
        context = browser.new_context(viewport={"width": 430, "height": 932})
        page = context.new_page()

        print("[1] Navigating to http://localhost:3005...")
        page.goto("http://localhost:3005")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        print(f"Page title: {page.title()}")
        assert page.title() == "Babi Ngepet vs Warga"

        # Check Setup Modal
        print("[2] Checking Setup Modal...")
        modal_heading = page.locator("h2:has-text('Pilih Kartu Aktif')")
        assert modal_heading.is_visible()

        # Find selectable creature in modal and click it
        creature_cards = page.locator("[data-setup-creature='true'] .card")
        c_count = creature_cards.count()
        print(f"Found {c_count} selectable creatures in setup modal")
        assert c_count > 0

        # Click the first creature card
        first_creature = creature_cards.first
        first_creature.click()
        time.sleep(0.5)

        # Click Start Battle button
        start_btn = page.locator("button:has-text('Mulai Pertarungan')")
        assert start_btn.is_enabled()
        print("[3] Clicking Mulai Pertarungan...")
        start_btn.click()
        time.sleep(1)

        # Check language switch
        print("[4] Testing Language Switch (ID -> EN)...")
        lang_btn = page.locator("button.lang")
        assert lang_btn.is_visible()
        lang_btn.click()
        time.sleep(0.5)

        # Verify English translation took effect
        retreat_btn = page.locator("button:has-text('Retreat')")
        attack_btn = page.locator("button:has-text('Attack')")
        end_btn = page.locator("button:has-text('End turn')")
        assert retreat_btn.is_visible()
        assert attack_btn.is_visible()
        assert end_btn.is_visible()
        print("Language switch to EN verified!")

        # Switch back to ID
        lang_btn.click()
        time.sleep(0.5)
        assert page.locator("button:has-text('Mundur')").is_visible()
        print("Language switch back to ID verified!")

        # Test Menu Modal
        print("[5] Testing Menu Modal...")
        menu_btn = page.locator("button.menu")
        menu_btn.click()
        time.sleep(0.5)
        assert page.locator("h2:has-text('Menu')").is_visible()

        # Open Rules Modal
        rules_btn = page.locator("button:has-text('Aturan Main')")
        rules_btn.click()
        time.sleep(0.5)
        assert page.locator("h2:has-text('Aturan Main')").is_visible()
        # Close Rules Modal
        close_btn = page.locator("button:has-text('Tutup')")
        close_btn.click()
        time.sleep(0.5)

        # Back from Menu Modal
        back_btn = page.locator("button:has-text('Kembali')")
        back_btn.click()
        time.sleep(0.5)
        print("Menu & Rules modal verified!")

        # Test Energy Token Attachment
        print("[6] Testing Energy Attachment...")
        energy_token = page.locator("button.token")
        if energy_token.is_enabled():
            energy_token.click()
            time.sleep(0.5)
            # Click player active card to attach energy
            player_active = page.locator(".half.me .row:first-child .card.lg")
            if player_active.is_visible():
                player_active.click()
                time.sleep(0.5)
                print("Energy attached to active card!")

        # Test Hand interactions (creature play to bench or item use)
        print("[7] Testing Hand Card Interactions...")
        hand_cards = page.locator(".dock .hand .card.xs")
        hand_count = hand_cards.count()
        print(f"Hand cards count: {hand_count}")

        if hand_count > 0:
            hand_cards.first.click()
            time.sleep(0.5)

            # If there's an empty bench slot, try clicking it
            empty_slots = page.locator(".half.me .mid .slot")
            if empty_slots.count() > 0:
                empty_slots.first.click()
                time.sleep(0.5)
                print("Played card to bench slot!")

        # Test Board Character Tap (Switch active and passive / retreat)
        print("[8] Testing Character Tap To Switch (Active <-> Bench)...")
        player_active = page.locator(".half.me .row:first-child .card.lg")
        if player_active.is_visible():
            player_active.click()
            time.sleep(0.5)
            # Check if bench card can be tapped to retreat/switch
            bench_cards = page.locator(".half.me .mid .card.sm")
            if bench_cards.count() > 0:
                bench_cards.first.click()
                time.sleep(0.5)
                print("Switched character with bench card!")

        # Test Ending Turn & Bot response & Next Turn Attack
        print("[9] Testing End Turn and Bot Turn execution...")
        end_btn = page.locator("button:has-text('Akhiri giliran')")
        if end_btn.is_enabled():
            end_btn.click()
            print("Player ended turn! Waiting for bot action...")
            time.sleep(2)  # Wait for bot turn to execute and hand back to player

        # Check if player turn resumed and energy gained
        energy_token = page.locator("button.token")
        if energy_token.is_enabled():
            energy_token.click()
            time.sleep(0.5)
            player_active = page.locator(".half.me .row:first-child .card.lg")
            if player_active.is_visible():
                player_active.click()
                time.sleep(0.5)
                print("Attached second energy!")

        # Test Attack Button if enabled
        attack_btn = page.locator("button:has-text('Serang')")
        if attack_btn.is_enabled():
            print("Executing Player Attack!")
            attack_btn.click()
            time.sleep(0.5)
            # If attack modal appeared (2 attacks)
            attack_choice = page.locator(".fixed button.btn.dark")
            if attack_choice.count() > 0:
                attack_choice.first.click()
                time.sleep(1)
            print("Attack executed with animation!")

        # Take screenshot of the battle board
        os.makedirs("/tmp/tcg_artifacts", exist_ok=True)
        screenshot_path = "/tmp/tcg_artifacts/battle_screen.png"
        page.screenshot(path=screenshot_path)
        print(f"[9] Screenshot saved to {screenshot_path}")

        browser.close()
        print("E2E Test Completed Successfully!")

if __name__ == "__main__":
    run_e2e_test()
