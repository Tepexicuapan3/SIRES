const { chromium } = require("playwright");

(async () => {
  console.log("🚀 Iniciando prueba de filtros en el navegador...\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down para poder ver qué pasa
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Escuchar requests a la API
  const apiRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/users")) {
      const url = request.url();
      apiRequests.push(url);
      console.log("📡 API Request:", url);
    }
  });

  try {
    // 1. Ir a login
    console.log("1️⃣ Navegando a login...");
    await page.goto("http://localhost:5173/login");
    await page.waitForLoadState("networkidle");

    // 2. Hacer login
    console.log("2️⃣ Haciendo login con usuario 40488...");
    await page.fill('input[name="usuario"]', "40488");
    await page.fill('input[type="password"]', "STC2024#");
    await page.click('button[type="submit"]');

    // Esperar a que redirija
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    console.log("✅ Login exitoso\n");

    // 3. Navegar a usuarios
    console.log("3️⃣ Navegando a página de usuarios...");
    await page.goto("http://localhost:5173/admin/usuarios");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    console.log("✅ Página de usuarios cargada\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Limpiar array de requests
    apiRequests.length = 0;

    // 4. TEST: Búsqueda por texto
    console.log('📝 TEST 1: Búsqueda por texto "test"');
    console.log("   Escribiendo en el input de búsqueda...");

    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill("test");

    console.log("   Esperando debounce (500ms)...");
    await page.waitForTimeout(500);

    // Verificar URL
    const currentUrl = page.url();
    console.log("   📍 URL actual:", currentUrl);

    if (currentUrl.includes("search=test")) {
      console.log("   ✅ URL actualizada con parámetro search=test");
    } else {
      console.log("   ❌ URL NO se actualizó con search=test");
    }

    // Verificar requests
    const searchRequests = apiRequests.filter((r) =>
      r.includes("search_query=test"),
    );
    if (searchRequests.length > 0) {
      console.log("   ✅ Request enviado con search_query=test");
    } else {
      console.log("   ❌ NO se envió request con search_query");
    }

    await page.waitForTimeout(1000);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 5. TEST: Filtro de Estado
    console.log('📊 TEST 2: Filtro por Estado "Activo"');
    console.log("   Haciendo click en dropdown Estado...");

    apiRequests.length = 0;

    // Buscar el select de Estado
    const estadoSelect = page
      .locator('button[aria-label="Filtrar por estado"]')
      .first();
    await estadoSelect.click();
    await page.waitForTimeout(300);

    // Seleccionar "Activo"
    console.log('   Seleccionando "Activo"...');
    await page.locator("text=Activo").first().click();
    await page.waitForTimeout(500);

    // Verificar URL
    const urlAfterEstado = page.url();
    console.log("   📍 URL actual:", urlAfterEstado);

    if (urlAfterEstado.includes("estado=A")) {
      console.log("   ✅ URL actualizada con parámetro estado=A");
    } else {
      console.log("   ❌ URL NO se actualizó con estado=A");
    }

    // Verificar requests
    const estadoRequests = apiRequests.filter((r) => r.includes("estado=A"));
    if (estadoRequests.length > 0) {
      console.log("   ✅ Request enviado con estado=A");
    } else {
      console.log("   ❌ NO se envió request con estado");
    }

    await page.waitForTimeout(1000);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 6. TEST: Limpiar filtros
    console.log("🧹 TEST 3: Limpiar filtros");
    console.log('   Buscando botón "Limpiar"...');

    apiRequests.length = 0;

    const clearButton = page.locator("button", { hasText: "Limpiar" }).first();
    const clearExists = (await clearButton.count()) > 0;

    if (clearExists) {
      console.log('   Haciendo click en "Limpiar"...');
      await clearButton.click();
      await page.waitForTimeout(500);

      const urlAfterClear = page.url();
      console.log("   📍 URL actual:", urlAfterClear);

      if (
        !urlAfterClear.includes("search=") &&
        !urlAfterClear.includes("estado=")
      ) {
        console.log("   ✅ Filtros limpiados de la URL");
      } else {
        console.log("   ❌ Filtros aún presentes en URL");
      }

      const clearRequests = apiRequests.filter(
        (r) => !r.includes("search_query") && !r.includes("estado"),
      );
      if (clearRequests.length > 0) {
        console.log("   ✅ Request enviado sin filtros");
      } else {
        console.log("   ⚠️ No se detectó request de limpieza");
      }
    } else {
      console.log(
        '   ⚠️ Botón "Limpiar" no visible (puede ser que no haya filtros activos)',
      );
    }

    await page.waitForTimeout(2000);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 7. Captura de pantalla final
    console.log("📸 Tomando captura de pantalla...");
    await page.screenshot({
      path: "test-filters-screenshot.png",
      fullPage: true,
    });
    console.log("   ✅ Captura guardada en: test-filters-screenshot.png\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ PRUEBAS COMPLETADAS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📊 Resumen de requests API capturados:");
    console.log(`   Total de requests: ${apiRequests.length}`);
    apiRequests.forEach((req, idx) => {
      console.log(`   ${idx + 1}. ${req}`);
    });

    // Mantener navegador abierto por 5 segundos para que puedas ver
    console.log("\n⏱️ Manteniendo navegador abierto por 5 segundos...");
    await page.waitForTimeout(5000);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    await page.screenshot({ path: "test-filters-error.png" });
    console.log("📸 Captura de error guardada en: test-filters-error.png");
  } finally {
    await browser.close();
    console.log("\n👋 Navegador cerrado");
  }
})();
