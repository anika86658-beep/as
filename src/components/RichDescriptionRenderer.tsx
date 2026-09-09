import React from 'react';

interface RichDescriptionRendererProps {
  content: string;
  className?: string;
}

/**
 * Safely renders rich formatted product descriptions, supporting:
 * - HTML content (e.g. <p>, <br>, <b>, <strong>, <i>, <u>, <ul>, <ol>, <li>, <h1>, <h2>, <h3>, <blockquote>)
 * - Markdown formatted text (e.g. **bold**, *italic*, # H1, ## H2, - lists, 1. lists, > quotes, ---)
 * - Plain text with natural spacing, newlines, and bullet points
 */
export const RichDescriptionRenderer: React.FC<RichDescriptionRendererProps> = ({
  content,
  className = ''
}) => {
  if (!content || !content.trim()) {
    return <p className="text-xs sm:text-sm text-gray-500 italic">কোনো বিবরণ প্রদান করা হয়নি।</p>;
  }

  const trimmed = content.trim();

  // Check if string contains HTML tags
  const containsHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);

  if (containsHtml) {
    // Sanitize basic dangerous tags for security
    const sanitizedHtml = trimmed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:[^"']*/gi, '');

    return (
      <div
        className={`rich-description-html text-xs sm:text-sm text-gray-700 leading-relaxed space-y-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1 [&_li]:text-gray-700 [&_h1]:text-lg [&_h1]:font-black [&_h1]:text-gray-900 [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-2.5 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-2 [&_h3]:mb-1 [&_b]:font-bold [&_b]:text-gray-900 [&_strong]:font-bold [&_strong]:text-gray-900 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-600 [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:bg-emerald-50/60 [&_blockquote]:rounded-r-lg [&_hr]:my-3 [&_hr]:border-gray-200 [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:p-2 [&_th]:font-bold [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Parse Markdown or Multiline Text with preserve whitespace & structure
  const lines = trimmed.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1 text-gray-700">
            {currentList.items.map((item, idx) => (
              <li key={idx}>{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 my-2 space-y-1 text-gray-700">
            {currentList.items.map((item, idx) => (
              <li key={idx}>{renderInlineMarkdown(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    // Empty line -> paragraph separator
    if (!line) {
      flushList();
      elements.push(<div key={`spacer-${index}`} className="h-2" />);
      return;
    }

    // Horizontal Rule
    if (/^---$|^\*\*\*$|^___$/.test(line)) {
      flushList();
      elements.push(<hr key={`hr-${index}`} className="my-3 border-gray-200" />);
      return;
    }

    // Headings
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${index}`} className="text-sm font-bold text-gray-900 mt-2 mb-1">
          {renderInlineMarkdown(line.replace(/^###\s+/, ''))}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${index}`} className="text-base font-bold text-gray-900 mt-2.5 mb-1">
          {renderInlineMarkdown(line.replace(/^##\s+/, ''))}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${index}`} className="text-lg font-black text-gray-900 mt-3 mb-1.5">
          {renderInlineMarkdown(line.replace(/^#\s+/, ''))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-emerald-600 pl-3 py-1.5 italic bg-emerald-50/60 rounded-r-lg my-2 text-emerald-950">
          {renderInlineMarkdown(line.replace(/^>\s+/, ''))}
        </blockquote>
      );
      return;
    }

    // Unordered List (-, *, •)
    if (/^[-*•]\s+/.test(line)) {
      const itemText = line.replace(/^[-*•]\s+/, '');
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ul', items: [itemText] };
      }
      return;
    }

    // Ordered List (1. , 2. )
    if (/^\d+\.\s+/.test(line)) {
      const itemText = line.replace(/^\d+\.\s+/, '');
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: 'ol', items: [itemText] };
      }
      return;
    }

    // Regular paragraph line (preserves line-breaks and formatting)
    flushList();
    elements.push(
      <p key={`p-${index}`} className="text-xs sm:text-sm text-gray-700 leading-relaxed">
        {renderInlineMarkdown(rawLine)}
      </p>
    );
  });

  flushList();

  return (
    <div className={`rich-description-markdown space-y-1.5 ${className}`}>
      {elements}
    </div>
  );
};

/**
 * Parses inline markdown: **bold**, *italic*, <u>underline</u>, `code`, and [links](url)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold (**bold**), italic (*italic*), underline (<u>text</u>), code (`code`), or link ([text](url))
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // 1. Bold (**text**)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // 2. Underline (<u>text</u>)
    const underlineMatch = remaining.match(/<u>(.+?)<\/u>/i);
    // 3. Italic (*text*)
    const italicMatch = remaining.match(/\*(.+?)\*/);
    // 4. Code (`text`)
    const codeMatch = remaining.match(/`(.+?)`/);
    // 5. Link ([text](url))
    const linkMatch = remaining.match(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/);

    // Find the earliest match
    const matches = [
      boldMatch ? { type: 'bold', index: boldMatch.index!, length: boldMatch[0].length, content: boldMatch[1] } : null,
      underlineMatch ? { type: 'underline', index: underlineMatch.index!, length: underlineMatch[0].length, content: underlineMatch[1] } : null,
      italicMatch ? { type: 'italic', index: italicMatch.index!, length: italicMatch[0].length, content: italicMatch[1] } : null,
      codeMatch ? { type: 'code', index: codeMatch.index!, length: codeMatch[0].length, content: codeMatch[1] } : null,
      linkMatch ? { type: 'link', index: linkMatch.index!, length: linkMatch[0].length, text: linkMatch[1], url: linkMatch[2] } : null,
    ].filter(Boolean) as { type: string; index: number; length: number; content?: string; text?: string; url?: string }[];

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    // Sort by earliest occurrence
    matches.sort((a, b) => a.index - b.index);
    const earliest = matches[0];

    // Push preceding text
    if (earliest.index > 0) {
      parts.push(remaining.substring(0, earliest.index));
    }

    if (earliest.type === 'bold') {
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-bold text-gray-900">
          {earliest.content}
        </strong>
      );
    } else if (earliest.type === 'underline') {
      parts.push(
        <span key={`u-${keyIdx++}`} className="underline text-gray-900">
          {earliest.content}
        </span>
      );
    } else if (earliest.type === 'italic') {
      parts.push(
        <em key={`i-${keyIdx++}`} className="italic text-gray-800">
          {earliest.content}
        </em>
      );
    } else if (earliest.type === 'code') {
      parts.push(
        <code key={`c-${keyIdx++}`} className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600">
          {earliest.content}
        </code>
      );
    } else if (earliest.type === 'link') {
      parts.push(
        <a
          key={`a-${keyIdx++}`}
          href={earliest.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 hover:text-emerald-800 underline font-semibold"
        >
          {earliest.text}
        </a>
      );
    }

    remaining = remaining.substring(earliest.index + earliest.length);
  }

  return <>{parts}</>;
}
