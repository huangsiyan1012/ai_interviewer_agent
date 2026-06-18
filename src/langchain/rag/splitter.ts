import type { DocumentChunk, MarkdownDocument } from "./types";

/**
 * 切片器：把一篇 Markdown 按「二级标题 ##」切成多个块
 *
 * 示例：
 *   # Vue3 基础        → 文档标题
 *   ## 响应式原理      → 第 1 块
 *   ## 组合式 API      → 第 2 块
 */
export function splitMarkdown(doc: MarkdownDocument): DocumentChunk[] {
  const lines = doc.content.split("\n");
  const docTitle = extractDocTitle(lines) || doc.fileName.replace(/\.md$/, "");
  const sections = splitByHeading(lines, "## ");

  if (sections.length === 0) {
    return [
      {
        id: `${doc.knowledgeBase}/${doc.fileName}/0`,
        knowledgeBase: doc.knowledgeBase,
        sourceFile: doc.fileName,
        title: docTitle,
        content: doc.content,
      },
    ];
  }

  return sections.map((section, index) => ({
    id: `${doc.knowledgeBase}/${doc.fileName}/${index}`,
    knowledgeBase: doc.knowledgeBase,
    sourceFile: doc.fileName,
    title: `${docTitle} - ${section.heading}`,
    content: section.body.trim(),
  }));
}

function extractDocTitle(lines: string[]): string {
  const titleLine = lines.find((line) => line.startsWith("# "));
  return titleLine ? titleLine.replace(/^#\s+/, "").trim() : "";
}

function splitByHeading(
  lines: string[],
  prefix: string,
): Array<{ heading: string; body: string }> {
  const sections: Array<{ heading: string; body: string }> = [];
  let current: { heading: string; body: string } | null = null;

  for (const line of lines) {
    if (line.startsWith(prefix)) {
      if (current) sections.push(current);
      current = {
        heading: line.replace(/^##\s+/, "").trim(),
        body: "",
      };
      continue;
    }

    if (current) {
      current.body += `${line}\n`;
    }
  }

  if (current) sections.push(current);
  return sections;
}
