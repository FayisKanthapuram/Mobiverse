import fs from "fs";
import path from "path";

export const renderEmailTemplate = (templateName, variables = {}) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      "src",
      "shared",
      "templates",
      templateName
    );

    let html = fs.readFileSync(templatePath, "utf-8");

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, value);
    }

    return html;
  } catch (error) {
    console.error("Email template rendering failed:", error);
    return null; // ⬅️ IMPORTANT
  }
};

