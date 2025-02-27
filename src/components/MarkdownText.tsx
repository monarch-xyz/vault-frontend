import ReactMarkdown from 'react-markdown';

type MarkdownTextProps = {
  text: string;
  className?: string;
}

export function MarkdownText({ text }: MarkdownTextProps) {
  return (
    <ReactMarkdown
      components={{
        strong: ({ children }) => <span className="text-sm font-medium">{children}</span>,
        h1: ({ children }) => <span className="block pt-2 text-base font-medium">{children}</span>,
        h2: ({ children }) => <span className="block pt-2 text-base font-medium">{children}</span>,
        h3: ({ children }) => <span className="block pt-1.5 font-medium">{children}</span>,
        ul: ({ children }) => <span className="block">{children}</span>,
        li: ({ children }) => (
          <span className="flex gap-2">
            <span className="text-gray-500"> - </span>
            <span>{children}</span>
          </span>
        ),
        p: ({ children }) => <span className="inline">{children}</span>,
        hr: () => <div className="my-2 border-t border-gray-200 dark:border-gray-800" />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
