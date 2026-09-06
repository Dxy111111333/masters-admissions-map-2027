from pathlib import Path
from urllib.parse import unquote

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:52837"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCREENSHOT_DIR = PROJECT_ROOT / "artifacts"
SCREENSHOT_DIR.mkdir(exist_ok=True)


def assert_no_horizontal_overflow(page) -> None:
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1"), "Page has horizontal overflow"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)
    console_errors: list[str] = []
    failed_responses: list[str] = []

    def attach(page):
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        page.on("response", lambda response: failed_responses.append(f"{response.status} {response.url}") if response.status >= 400 else None)

    desktop = browser.new_page(viewport={"width": 1600, "height": 900}, device_scale_factor=1)
    attach(desktop)
    desktop.goto(BASE_URL, wait_until="networkidle")
    assert "探索适合你的" in desktop.locator("h1").inner_text()
    assert desktop.get_by_role("button", name="开始探索").is_visible()
    assert_no_horizontal_overflow(desktop)
    desktop.screenshot(path=SCREENSHOT_DIR / "home-desktop.png", full_page=False)

    desktop.get_by_role("button", name="开始探索").click()
    desktop.wait_for_timeout(700)
    assert desktop.locator(".globe-map").is_visible()
    assert desktop.get_by_text("个性化筛选", exact=True).is_visible()
    discovery_box = desktop.locator(".discovery-section").bounding_box()
    filter_box = desktop.locator(".filter-panel").bounding_box()
    assert discovery_box and discovery_box["height"] >= 824, discovery_box
    assert filter_box and filter_box["height"] <= discovery_box["height"], filter_box
    assert discovery_box["y"] >= 68, discovery_box
    desktop.locator(".map-loading").wait_for(state="hidden", timeout=10000)
    desktop.wait_for_timeout(1200)
    desktop.screenshot(path=SCREENSHOT_DIR / "filter-desktop-globe.png", full_page=False)
    page_scroll_before_map = desktop.evaluate("window.scrollY")
    zoom_before = desktop.locator(".map-status strong").inner_text()
    desktop.locator(".globe-map").hover()
    for _ in range(6):
        desktop.mouse.wheel(0, -900)
        desktop.wait_for_timeout(160)
    desktop.wait_for_timeout(900)
    assert desktop.locator(".map-status strong").inner_text() != zoom_before
    assert abs(desktop.evaluate("window.scrollY") - page_scroll_before_map) <= 2, "Map wheel must zoom without scrolling the page"
    assert desktop.get_by_text("地区平面视图", exact=True).is_visible()
    assert desktop.locator(".university-map-marker.is-visible").count() > 0
    desktop.locator(".filter-panel-heading").hover()
    desktop.mouse.wheel(0, 700)
    desktop.wait_for_timeout(400)
    assert desktop.evaluate("window.scrollY") > page_scroll_before_map + 40, "Wheel outside the map must scroll the page"
    desktop.evaluate("document.querySelector('#filters').scrollIntoView({block: 'start'})")
    desktop.wait_for_timeout(350)
    desktop.locator(".globe-accessible-points button", has_text="英国").click()
    desktop.wait_for_timeout(1500)
    desktop.screenshot(path=SCREENSHOT_DIR / "filter-desktop.png", full_page=False)
    desktop.locator(".region-options [role='option']", has_text="英国").click()

    desktop.locator(".region-options [role='option']", has_text="中国香港").click()
    desktop.wait_for_timeout(450)
    assert "中国香港" in unquote(desktop.url)
    assert desktop.locator(".results-tools > strong").inner_text().startswith("6 ")

    desktop.get_by_text("暂未取得语言成绩", exact=True).click()
    desktop.wait_for_timeout(350)
    assert desktop.locator(".signal-pill", has_text="需补语言").count() > 0

    desktop.locator("#budget-high").fill("40")
    desktop.wait_for_timeout(350)
    assert "budgetmax=40" in desktop.url

    desktop.get_by_role("button", name="重置", exact=True).click()
    desktop.wait_for_timeout(450)
    desktop.locator("#results").scroll_into_view_if_needed()
    desktop.wait_for_timeout(350)
    assert desktop.locator(".university-result-row").count() > 0
    desktop.screenshot(path=SCREENSHOT_DIR / "results-desktop.png", full_page=False)

    detail_href = desktop.locator(".detail-button").first.get_attribute("href")
    assert detail_href and "/university/" in detail_href and "budgetmin=" in detail_href and "qsmax=" in detail_href
    desktop.locator(".detail-button").first.click()
    desktop.wait_for_load_state("networkidle")
    assert desktop.get_by_role("heading", name="选择你感兴趣的专业", exact=True).is_visible()
    assert desktop.locator(".university-program-card").count() > 0
    program_href = desktop.locator(".university-program-card .program-card-bottom a").first.get_attribute("href")
    assert program_href and "/program/" in program_href
    desktop.locator(".university-program-card .program-card-bottom a").first.click()
    desktop.wait_for_load_state("networkidle")
    assert desktop.get_by_role("heading", name="入学要求", exact=True).is_visible()
    assert desktop.get_by_role("heading", name="预算明细", exact=True).is_visible()
    assert desktop.get_by_text("毕业要求", exact=True).is_visible()
    assert desktop.locator(".budget-donut").is_visible()
    assert desktop.locator(".detail-subnav a").count() == 3
    aligned_sections = [desktop.locator(selector).bounding_box() for selector in [".program-hero", ".study-structure", ".core-facts", ".detail-subnav", ".budget-section"]]
    assert all(box for box in aligned_sections)
    detail_left = aligned_sections[0]["x"]
    detail_width = aligned_sections[0]["width"]
    assert all(abs(box["x"] - detail_left) <= 1 and abs(box["width"] - detail_width) <= 1 for box in aligned_sections[1:]), aligned_sections
    assert float(desktop.locator(".requirement-panel summary span").first.evaluate("element => getComputedStyle(element).fontSize.replace('px', '')")) >= 17
    assert float(desktop.locator(".requirement-body > p").first.evaluate("element => getComputedStyle(element).fontSize.replace('px', '')")) >= 14
    assert desktop.get_by_text("数据可信度", exact=True).count() == 0
    assert desktop.get_by_text("申请入口待核实", exact=True).count() == 0
    for link in desktop.locator(".official-links a").all():
        rel = link.get_attribute("rel") or ""
        assert "noopener" in rel and "noreferrer" in rel
    assert_no_horizontal_overflow(desktop)
    desktop.screenshot(path=SCREENSHOT_DIR / "program-detail-desktop.png", full_page=True)

    desktop.get_by_role("button", name="返回筛选结果").click()
    desktop.wait_for_load_state("networkidle")
    assert desktop.locator(".university-result-row").count() > 0

    laptop = browser.new_page(viewport={"width": 1366, "height": 768}, device_scale_factor=1)
    attach(laptop)
    laptop.goto(BASE_URL, wait_until="domcontentloaded", timeout=60000)
    laptop.wait_for_timeout(1200)
    laptop.get_by_role("button", name="开始探索").click()
    laptop.wait_for_timeout(700)
    laptop_box = laptop.locator(".discovery-section").bounding_box()
    assert laptop_box and laptop_box["y"] >= 68, laptop_box
    assert laptop_box["height"] >= 690, laptop_box
    assert laptop.locator(".filter-panel-heading").is_visible()
    assert_no_horizontal_overflow(laptop)
    laptop.locator(".map-loading").wait_for(state="hidden", timeout=10000)
    laptop.wait_for_timeout(700)
    laptop.screenshot(path=SCREENSHOT_DIR / "filter-laptop-1366x768.png", full_page=False)

    mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    attach(mobile)
    mobile.goto(BASE_URL, wait_until="domcontentloaded", timeout=60000)
    mobile.wait_for_timeout(800)
    assert mobile.get_by_role("button", name="开始探索").is_visible()
    assert_no_horizontal_overflow(mobile)
    mobile.screenshot(path=SCREENSHOT_DIR / "home-mobile.png", full_page=False)
    mobile.get_by_role("button", name="开始探索").click()
    mobile.wait_for_timeout(650)
    assert mobile.locator(".globe-card").is_visible()
    assert_no_horizontal_overflow(mobile)
    mobile.screenshot(path=SCREENSHOT_DIR / "filter-mobile.png", full_page=False)

    browser.close()
    assert not console_errors, f"Browser console errors: {console_errors}"
    assert not failed_responses, f"Failed network responses: {failed_responses}"

print(f"UI checks passed. Screenshots saved to {SCREENSHOT_DIR}")
