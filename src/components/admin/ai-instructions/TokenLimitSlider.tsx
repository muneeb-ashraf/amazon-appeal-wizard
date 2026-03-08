'use client';

// ============================================================================
// TOKEN LIMIT SLIDER COMPONENT
// Slider for adjusting max tokens (100-2000 range)
// ============================================================================

interface TokenLimitSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function TokenLimitSlider({ value, onChange }: TokenLimitSliderProps) {
  const getEstimatedCharacters = (tokens: number) => {
    // Rough estimate: 1 token ≈ 0.75 characters
    return Math.round(tokens * 0.75);
  };

  const getEstimatedWords = (tokens: number) => {
    // Rough estimate: 1 token ≈ 0.75 words
    return Math.round(tokens * 0.75);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Max Tokens: {value}
      </label>

      <input
        type="range"
        min="100"
        max="2000"
        step="50"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>100</span>
        <span>2000</span>
      </div>

      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>~{getEstimatedCharacters(value)} characters</span>
        </div>
        <div className="flex items-center space-x-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span>~{getEstimatedWords(value)} words</span>
        </div>
      </div>

      {/* Warning if too low or too high */}
      {value < 200 && (
        <p className="text-xs text-orange-600 mt-2">
          ⚠️ Low token limit may result in incomplete output
        </p>
      )}
      {value > 1500 && (
        <p className="text-xs text-blue-600 mt-2">
          💡 High token limits increase API costs
        </p>
      )}
    </div>
  );
}
