'use client';

// ============================================================================
// PROMPT EDITOR COMPONENT
// Monaco code editor with syntax highlighting for {variables}
// ============================================================================

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export default function PromptEditor({
  value,
  onChange,
  placeholder = 'Enter prompt...',
  height = '200px',
}: PromptEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register custom language for prompt templates with variable highlighting
    monaco.languages.register({ id: 'prompt-template' });

    monaco.languages.setMonarchTokensProvider('prompt-template', {
      tokenizer: {
        root: [
          // Highlight {variables} in blue
          [/\{[a-zA-Z_][a-zA-Z0-9_]*\}/, 'variable'],
        ],
      },
    });

    monaco.editor.defineTheme('prompt-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'variable', foreground: '0066CC', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
      },
    });

    monaco.editor.setTheme('prompt-theme');
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language="prompt-template"
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          fontSize: 13,
          lineHeight: 20,
          padding: { top: 8, bottom: 8 },
          suggestOnTriggerCharacters: false,
          quickSuggestions: false,
          parameterHints: { enabled: false },
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
