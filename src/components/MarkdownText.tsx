import ReactMarkdown from 'react-markdown';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

export function MarkdownText({ text }: MarkdownTextProps) {
  return (
    <ReactMarkdown
      components={{
        strong: ({ children }) => (
          <span className="font-medium text-sm">{children}</span>
        ),
        h2: ({ children }) => (
          <span className="block font-medium text-base pt-2">{children}</span>
        ),
        h3: ({ children }) => (
          <span className="block font-medium pt-1.5">{children}</span>
        ),
        ul: ({ children }) => (
          <span className="block">{children}</span>
        ),
        li: ({ children }) => (
          <span className="flex gap-2">
            <span className="text-gray-500"> - </span>
            <span>{children}</span>
          </span>
        ),
        p: ({ children }) => (
          <span className="inline">{children}</span>
        ),
        hr: () => (
          <div className="my-2 border-t border-gray-200 dark:border-gray-800" />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
