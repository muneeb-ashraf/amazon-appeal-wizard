'use client';

// ============================================================================
// DIFF VIEWER
// Text comparison with line-by-line highlighting
// ============================================================================

import { useMemo } from 'react';

interface DiffViewerProps {
  text1: string;
  text2: string;
  title1: string;
  title2: string;
  subtitle1?: string;
  subtitle2?: string;
}

interface DiffLine {
  type: 'same' | 'added' | 'removed' | 'changed';
  line1?: string;
  line2?: string;
  lineNumber: number;
}

export default function DiffViewer({
  text1,
  text2,
  title1,
  title2,
  subtitle1,
  subtitle2,
}: DiffViewerProps) {
  const diff = useMemo(() => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    const result: DiffLine[] = [];

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === undefined && line2 !== undefined) {
        // Line added
        result.push({
          type: 'added',
          line2,
          lineNumber: i + 1,
        });
      } else if (line1 !== undefined && line2 === undefined) {
        // Line removed
        result.push({
          type: 'removed',
          line1,
          lineNumber: i + 1,
        });
      } else if (line1 !== line2) {
        // Line changed
        result.push({
          type: 'changed',
          line1,
          line2,
          lineNumber: i + 1,
        });
      } else {
        // Line same
        result.push({
          type: 'same',
          line1,
          line2,
          lineNumber: i + 1,
        });
      }
    }

    return result;
  }, [text1, text2]);

  const getLineStyle = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'removed':
        return 'bg-red-50 border-l-4 border-red-400';
      case 'changed':
        return 'bg-yellow-50 border-l-4 border-yellow-400';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left side */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <h3 className="font-semibold text-blue-900">{title1}</h3>
          {subtitle1 && <div className="text-xs text-blue-700 mt-1">{subtitle1}</div>}
        </div>
        <div className="p-0 bg-white max-h-[600px] overflow-y-auto">
          {diff.map((line, index) => (
            <div
              key={index}
              className={`flex ${getLineStyle(line.type === 'added' ? 'same' : line.type)} min-h-[24px]`}
            >
              <div className="w-12 flex-shrink-0 text-xs text-gray-400 text-right pr-2 py-1 select-none">
                {line.line1 !== undefined && line.lineNumber}
              </div>
              <div className="flex-1 px-2 py-1 font-mono text-sm whitespace-pre-wrap break-all">
                {line.line1 || (line.type === 'added' ? '' : '')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-green-50 border-b border-green-200 p-4">
          <h3 className="font-semibold text-green-900">{title2}</h3>
          {subtitle2 && <div className="text-xs text-green-700 mt-1">{subtitle2}</div>}
        </div>
        <div className="p-0 bg-white max-h-[600px] overflow-y-auto">
          {diff.map((line, index) => (
            <div
              key={index}
              className={`flex ${getLineStyle(line.type === 'removed' ? 'same' : line.type)} min-h-[24px]`}
            >
              <div className="w-12 flex-shrink-0 text-xs text-gray-400 text-right pr-2 py-1 select-none">
                {line.line2 !== undefined && line.lineNumber}
              </div>
              <div className="flex-1 px-2 py-1 font-mono text-sm whitespace-pre-wrap break-all">
                {line.line2 || (line.type === 'removed' ? '' : '')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
