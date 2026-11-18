import { expect, test } from "@playwright/test";

test.describe("Flujos críticos de Mundo River", () => {
  test("la home muestra el próximo partido y las novedades", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Viví River");
    await expect(page.getByRole("link", { name: /Ver el próximo partido|Seguir en vivo/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Abrir Match Center/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lo último de River" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Lo que viene/ })).toBeVisible();
  });

  test("novedades filtra por categoría y sincroniza la URL", async ({ page }) => {
    await page.goto("/novedades");

    const filters = page.getByRole("group", { name: "Filtrar por categoría" });
    await filters.getByRole("button", { name: /Plantel Profesional/ }).click();

    await expect(page).toHaveURL(/cat=plantel-profesional/);
    await expect(filters.getByRole("button", { name: /Plantel Profesional/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByText(/Limpiar filtros/)).toBeVisible();

    await page.getByRole("button", { name: "Limpiar filtros" }).click();
    await expect(page).not.toHaveURL(/cat=/);
  });

  test("calendario cambia a agenda y filtra por competición", async ({ page }) => {
    await page.goto("/calendario");

    const monthHeading = page.locator("h2").filter({ hasText: /2026|2027/ }).first();
    const initialMonth = await monthHeading.innerText();
    await page.getByRole("button", { name: "Mes siguiente" }).click();
    await expect(monthHeading).not.toHaveText(initialMonth);
    await expect(page).toHaveURL(/mes=\d{4}-\d{2}/);
    await expect(page.getByText("Cargando el calendario")).toBeHidden();

    await page.getByRole("button", { name: "Agenda", exact: true }).click();
    await expect(page).toHaveURL(/vista=agenda/);
    await expect(page.getByRole("heading", { name: "Agenda de la temporada" })).toBeVisible();

    const competitionFilters = page.getByRole("group", { name: "Filtrar por competición" });
    await competitionFilters.getByRole("button", { name: "Libertadores", exact: true }).click();
    await expect(page).toHaveURL(/comp=libertadores-2026/);
  });

  test("calendario abre el detalle contextual y sincroniza el partido", async ({ page }) => {
    await page.goto("/calendario?vista=agenda");

    await page.getByRole("button", { name: /River Plate.*Boca Juniors/ }).first().click();

    await expect(page).toHaveURL(/partido=vs-boca-liga/);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /Partidos del/ })).toBeVisible();
    await expect(dialog.getByText("Más Monumental").first()).toBeVisible();
    await expect(dialog.getByText("2 - 1")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/partido=/);
  });

  test("calendario muestra el motivo de un partido aplazado", async ({ page }) => {
    await page.goto("/calendario?vista=agenda");

    await page.getByRole("button", { name: /River Plate.*Gimnasia/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Aplazado")).toBeVisible();
    await expect(dialog.getByText("Reprogramado por la organización del torneo.")).toBeVisible();
  });

  test("Match Center abre calificaciones y ordena por puesto", async ({ page }) => {
    await page.goto("/partidos/vs-boca-liga");

    await page.getByRole("tab", { name: "Calificaciones" }).click();
    await expect(page).toHaveURL(/tab=calificaciones/);
    await expect(page.getByRole("heading", { name: /Calificaciones de/ })).toBeVisible();
    await expect(page.getByText("MVP del partido").first()).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    await page.getByRole("button", { name: "Por puesto" }).click();
    await expect(page.getByRole("button", { name: "Por puesto" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("temporada filtra por copa y abre el panel del jugador", async ({ page }) => {
    await page.goto("/temporada");

    await page.getByRole("button", { name: "Libertadores", exact: true }).click();
    await expect(page.getByText(/Mostrando CONMEBOL Libertadores/)).toBeVisible();

    await page.getByRole("button", { name: /Ver panel de/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 2 })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("Liga Profesional muestra tabla anual y grupo de River", async ({ page }) => {
    await page.goto("/liga-profesional");

    await expect(page.getByRole("heading", { name: "Liga Profesional" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tabla anual" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Grupo de River/ })).toBeVisible();
    await expect(page.getByRole("table", { name: "Tabla anual" })).toBeVisible();
    await expect(page.getByRole("table", { name: /Grupo de River/ })).toBeVisible();
    await expect(page.getByText("River Plate").first()).toBeVisible();
  });

  test("plantel muestra puntajes y permite elegir un Match Center evaluado", async ({ page }) => {
    await page.goto("/plantel");

    await expect(page.getByRole("heading", { name: "El plantel", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Puntaje del plantel" })).toBeVisible();
    await expect(page.getByText("Puntaje").first()).toBeVisible();
    await expect(page.getByText(/\/10|SC/).first()).toBeVisible();

    const firstRatedPlayer = page.locator("article").filter({ hasText: "Ver partidos" }).first();
    await firstRatedPlayer.getByText("Ver partidos").click();
    await expect(firstRatedPlayer.getByText(/Fecha \d+/).first()).toBeVisible();
    await expect(firstRatedPlayer.getByText(/ vs /).first()).toBeVisible();
    await expect(firstRatedPlayer.getByRole("link").first()).toBeVisible();
  });

  test("una ruta inexistente muestra el estado 404 con accesos", async ({ page }) => {
    await page.goto("/partidos/no-existe");

    await expect(page.getByRole("heading", { name: /Esta página no está en la cancha/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ir al inicio" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver novedades" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver calendario" })).toBeVisible();
  });

  test("alterna el modo oscuro y persiste la preferencia", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");
    const darkToggle = page.getByRole("button", { name: "Activar modo oscuro" });

    await expect(darkToggle).toBeVisible();
    await darkToggle.click();

    await expect(html).toHaveClass(/dark/);
    await expect(page.getByRole("button", { name: "Activar modo claro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.reload();
    await expect(html).toHaveClass(/dark/);

    await page.getByRole("button", { name: "Activar modo claro" }).click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test("el modo claro usa acentos rojos y superficies blancas", async ({ page }) => {
    await page.goto("/calendario");

    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await expect(page.locator("body")).toHaveCSS("color", "rgb(90, 11, 23)");
    await expect(page.getByRole("button", { name: "Mes siguiente" })).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
  });

  test("la ficha de novedades usa superficies y texto del tema oscuro", async ({ page }) => {
    await page.goto("/novedades/river-practica-ezeiza-previa-estudiantes");

    await page.getByRole("button", { name: "Activar modo oscuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await expect(page.locator("article > header")).toHaveCSS(
      "background-color",
      "rgb(21, 21, 27)",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS(
      "color",
      "rgb(244, 242, 236)",
    );
  });
});
