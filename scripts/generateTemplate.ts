const decoder = new TextDecoder("utf-8");

// Read HTML template
const templatePath = "./supabase/functions/_shared/templates/signature-request.html";
const templateBytes = await Deno.readFile(templatePath);
const templateContent = decoder.decode(templateBytes);

// Escape backticks and dollar signs inside template
const escapedTemplate = templateContent
  .replace(/`/g, "\\`")
  .replace(/\$\{/g, "\\${");

// Output TypeScript file
const outputPath = "./supabase/functions/_shared/templates/signature-request.ts";
const tsContent = `export const signatureRequestTemplate = \`\n${escapedTemplate}\n\`;\n`;

await Deno.writeTextFile(outputPath, tsContent);

console.log(`✅ Template generated: ${outputPath}`);
