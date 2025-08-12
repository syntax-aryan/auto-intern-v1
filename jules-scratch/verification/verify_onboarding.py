import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Sign up a new user
        await page.goto("http://localhost:3001/sign-up")
        await page.wait_for_load_state()
        try:
            await page.get_by_label("Email").fill("testuser@example.com")
            await page.get_by_label("Password").fill("password123")
            await page.get_by_role("button", name="Create account").click()
        except Exception as e:
            print(f"Error during sign-up: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
            await browser.close()
            return

        # The app should redirect to the onboarding page, but since we can't
        # check email for the verification link, we'll navigate there directly.
        await page.goto("http://localhost:3001/onboarding")

        # Complete the onboarding process
        await page.get_by_role("button", name="Internships").click()
        await page.get_by_role("button", name="Next").click()

        await page.get_by_role("button", name="Technology").click()
        await page.get_by_role("button", name="Next").click()

        await page.get_by_role("button", name="Beginner").click()
        await page.get_by_role("button", name="Next").click()

        await page.get_by_role("button", name="FAANG (Meta, Apple, Amazon, Netflix, Google)").click()
        await page.get_by_role("button", name="Next").click()

        await page.get_by_role("button", name="LinkedIn Profile URL").click()
        await page.get_by_label("LinkedIn Profile URL").fill("https://www.linkedin.com/in/testuser")
        await page.get_by_role("button", name="Generate Email").click()

        # Approve and continue
        await page.get_by_role("button", name="Approve & Continue").click()

        # Verify that the user is redirected to the dashboard
        await expect(page).to_have_url("http://localhost:3001/dashboard")

        # Verify that the onboarding data is displayed correctly
        await expect(page.get_by_text("Internships")).to_be_visible()
        await expect(page.get_by_text("Technology")).to_be_visible()
        await expect(page.get_by_text("Beginner")).to_be_visible()
        await expect(page.get_by_text("LinkedIn")).to_be_visible()

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
