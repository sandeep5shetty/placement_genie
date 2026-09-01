"use client";

import type { ReactNode } from "react";

function inlineMarkdown(value: string) {
  return value
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={part}>{part.slice(2, -2)}</strong>
      ) : (
        part
      )
    );
}

export function MarkdownAnswer({ content }: { content: string }) {
  const rows = content.split("\n");
  const output: ReactNode[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    if (/^#{1,3}\s/.test(row)) {
      output.push(
        <h3 className="mt-4 font-semibold text-base" key={`heading-${index}`}>
          {inlineMarkdown(row.replace(/^#{1,3}\s/, ""))}
        </h3>
      );
      continue;
    }

    if (/^\s*[-*•]\s+/.test(row)) {
      output.push(
        <div
          className="mt-2 flex gap-2 text-[13px] leading-relaxed"
          key={`list-${index}`}
        >
          <span className="text-primary">•</span>
          <span>{inlineMarkdown(row.replace(/^\s*[-*•]\s+/, ""))}</span>
        </div>
      );
      continue;
    }

    if (!row.trim()) {
      output.push(<div className="h-2" key={`space-${index}`} />);
      continue;
    }

    output.push(
      <p
        className="text-[13px] leading-relaxed text-muted-foreground"
        key={`p-${index}`}
      >
        {inlineMarkdown(row)}
      </p>
    );
  }

  return <div className="flex flex-col gap-1">{output}</div>;
}
