"use client";

import { IconCheck, IconCode, IconCopy } from "@tabler/icons-react";
import Prism from "prismjs";
import { useState } from "react";
import "prismjs/components/prism-json";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface JsonViewerProps {
  title: string;
  content: string;
}

export function JsonViewer({ title, content }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatJson(content));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <IconCode className="h-4 w-4 text-muted-foreground" />
          {title}
        </h3>
        {copied ? (
          <span className="inline-flex items-center h-8 px-3 text-xs gap-1.5 font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 rounded-md">
            <IconCheck className="h-3.5 w-3.5" />
            Copied!
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 text-xs gap-1.5 transition-all"
          >
            <IconCopy className="h-3.5 w-3.5" />
            Copy JSON
          </Button>
        )}
      </div>
      <div className="relative rounded-lg border bg-muted/10 overflow-hidden">
        <ScrollArea className="max-h-80">
          <div className="p-1">
            <JsonHighlight content={content} />
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
}

// JSON highlighting component
function JsonHighlight({ content }: { content: string }) {
  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const formatted = formatJson(content);
  const tokens = Prism.tokenize(formatted, Prism.languages.json);

  const renderToken = (
    token: string | Prism.Token,
    index: number,
  ): React.ReactNode => {
    if (typeof token === "string") {
      return token;
    }

    const tokenClass = Array.isArray(token.type) ? token.type[0] : token.type;
    const content = Array.isArray(token.content)
      ? token.content.map((t, i) => renderToken(t, i))
      : typeof token.content === "string"
        ? token.content
        : renderToken(token.content as Prism.Token, 0);

    const colorClassMap: Record<string, string> = {
      string: "text-green-700 dark:text-green-400",
      number: "text-blue-700 dark:text-blue-400",
      boolean: "text-amber-700 dark:text-amber-400",
      null: "text-gray-600 dark:text-gray-500",
      property: "text-purple-700 dark:text-purple-400",
      punctuation: "text-gray-600 dark:text-gray-500",
      operator: "text-gray-600 dark:text-gray-500",
    };

    const colorClasses = colorClassMap[tokenClass] || "";

    return (
      <span key={index} className={colorClasses}>
        {content}
      </span>
    );
  };

  return (
    <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
      {tokens.map((token, index) => renderToken(token, index))}
    </pre>
  );
}
