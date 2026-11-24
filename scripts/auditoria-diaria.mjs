import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const reportDirectory = resolve(root, process.env.REPORT_DIRECTORY ?? "reports/diarios");
const now = new Date();
const date = now.toISOString().slice(0, 10);
const reportPath = resolve(reportDirectory, `auditoria-${date}.md`);
const logPath = resolve(reportDirectory, `auditoria-${date}.log`);
const results = [];
const corrections = [];

mkdirSync(reportDirectory, { recursive: true });

function run(label, command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: options.timeout ?? 15 * 60 * 1000,
    maxBuffer: 10 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  appendFileSync(logPath, `\n## ${label}\n${output}\n`);
  results.push({
    label,
    ok: result.status === 0,
    duration: `${((Date.now() - started) / 1000).toFixed(1)} s`,
    output: output.slice(-2000),
  });
  return result.status === 0;
}

function readSpecs() {
  const specsDirectory = resolve(root, "specs");
  let entries = [];
  try {
    entries = readFileSync(resolve(specsDirectory, ".gitkeep"), "utf8") ? [] : [];
  } catch {
    // La lectura de las carpetas se realiza de forma segura mediante git.
  }
  const listing = spawnSync("git", ["ls-files", "specs/*/spec.md"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const paths = (listing.stdout ?? "").split(/\r?\n/).filter(Boolean);
  return paths.map((path) => {
    const content = readFileSync(resolve(root, path), "utf8");
    const folder = path.split("/")[1] ?? path.split("\\")[1] ?? path;
    const tasksPath = resolve(root, "specs", folder, "tasks.md");
    let pending = 0;
    try {
      pending = (readFileSync(tasksPath, "utf8").match(/^- \[ \]/gm) ?? []).length;
    } catch {
      pending = -1;
    }
    return {
      folder,
      approved: /^estado:\s*Aprobado\b/im.test(content),
      pending,
    };
  });
}

writeFileSync(logPath, `Auditoría diaria ${now.toISOString()}\n`);

const checks = [
  ["Tests", "pnpm", ["test"]],
  ["Lint", "pnpm", ["lint"]],
  ["TypeScript", "pnpm", ["typecheck"]],
  ["Build", "pnpm", ["build"], { timeout: 20 * 60 * 1000 }],
  ["E2E", "pnpm", ["test:e2e"], { timeout: 20 * 60 * 1000 }],
];

for (const [label, command, args, options] of checks) {
  if (!run(label, command, args, options)) {
    if (label === "Lint") {
      const fixed = run("Corrección automática de lint", "pnpm", ["exec", "eslint", ".", "--fix"]);
      if (fixed) {
        corrections.push("Se ejecutó ESLint con --fix.");
        const lintAfterFix = run("Lint después de la corrección", "pnpm", ["lint"]);
        if (lintAfterFix) {
          const initialLint = results.find((result) => result.label === "Lint");
          if (initialLint) {
            initialLint.ok = true;
            initialLint.output += "\nSe corrigió automáticamente con ESLint.";
          }
        }
      } else {
        corrections.push("La corrección automática de lint falló.");
      }
    }
  }
}

const specs = readSpecs();
const failed = results.filter((result) => !result.ok);
const status = failed.length === 0 ? "✅ Correcto" : "❌ Requiere intervención";
const report = [
  `# Reporte de auditoría diaria — ${date}`,
  "",
  `## Estado general`,
  status,
  "",
  "## Validaciones",
  ...results.map((result) => `- ${result.ok ? "✅" : "❌"} ${result.label} (${result.duration})`),
  "",
  "## Correcciones realizadas",
  ...(corrections.length ? corrections.map((item) => `- ${item}`) : ["- No fue necesario corregir nada."]),
  "",
  "## Specs",
  ...(specs.length
    ? specs.map(
        (spec) =>
          `- ${spec.approved ? "✅" : "⚠️"} \`${spec.folder}\`: ${
            spec.approved ? "aprobada" : "no aprobada"
          }, tareas pendientes: ${spec.pending < 0 ? "sin tasks.md" : spec.pending}`,
      )
    : ["- No se encontraron specs versionadas."]),
  "",
  "## Errores y posibles mejoras",
  ...(failed.length
    ? failed.map((result) => `- **${result.label}**: revisar el log de la ejecución.`)
    : ["- No se detectaron errores. Mantener la ejecución diaria."]),
  "",
  "## Seguridad",
  "- No se modificaron secretos, archivos `.env`, configuración raíz ni se realizó deploy.",
  "",
  `Log detallado: \`${logPath.replace(`${root}\\`, "").replaceAll("\\", "/")}\``,
  "",
].join("\n");

writeFileSync(reportPath, report);
console.log(report);
console.log(`Reporte escrito en ${reportPath}`);

process.exitCode = failed.length === 0 ? 0 : 1;
