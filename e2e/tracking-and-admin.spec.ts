import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("E2E - Public Tracking & LIE Cargo Workflows", () => {
  test("1. Homepage tracking form should load correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LIE Cargo/i);

    // Form pelacakan publik
    const resiInput = page.locator('input[placeholder*="Nomor Resi"]');
    await expect(resiInput).toBeVisible();
    const trackBtn = page.getByRole("button", { name: /lacak/i });
    await expect(trackBtn).toBeVisible();
  });

  test("2. Tracking detail page should display shipment progress and items", async ({ page }) => {
    // Kunjungi langsung halaman tracking resi KG-JKO-001
    await page.goto("/track/KG-JKO-001");

    // Header Resi & Rute
    await expect(page.getByText("KG-JKO-001")).toBeVisible();
    await expect(page.getByText(/Semarang/i).first()).toBeVisible();

    // Rincian Muatan Kargo (memastikan tidak ada kolom nilai barang)
    await expect(page.getByText(/Rincian Barang Muatan/i)).toBeVisible();
    await expect(page.getByText(/Nama Barang/i)).toBeVisible();
    await expect(page.getByText(/Nilai Barang/i)).not.toBeVisible();
  });

  test("3. Admin Login & Dashboard Navigation", async ({ page }) => {
    await page.goto("/admin/login");

    // Mengisi form login admin
    await page.locator('input[type="text"]').fill("admin");
    await page.locator('input[type="password"]').fill("admin123");
    await page.getByRole("button", { name: /masuk ke dashboard/i }).click();

    // Tunggu URL pindah ke /admin
    await page.waitForURL("/admin");
    await expect(page.getByText(/Dashboard Ringkasan/i)).toBeVisible();
  });

  test("4. Admin History Page with Month Filter", async ({ page }) => {
    // Login ke admin
    await page.goto("/admin/login");
    await page.locator('input[type="text"]').fill("admin");
    await page.locator('input[type="password"]').fill("admin123");
    await page.getByRole("button", { name: /masuk ke dashboard/i }).click();
    await page.waitForURL("/admin");

    // Klik menu Histori Pengiriman dari sidebar
    await page.getByRole("link", { name: /Histori Pengiriman/i }).first().click();
    await page.waitForURL("/admin/history");

    // Judul & Kalender / Periode Selector Combobox
    await expect(page.getByText(/Histori Pengiriman & Bukti Serah Terima/i)).toBeVisible();
    const periodSelect = page.getByRole("combobox");
    await expect(periodSelect).toBeVisible();
  });
});
