/**
 * Format appeal text with markdown-style formatting to HTML
 */
export function formatAppealText(text: string): string {
  if (!text) return '';

  return text
    // Bold text: **text** -> <strong>text</strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

/**
 * Convert appeal text to formatted HTML structure
 */
export function appealToHTML(appealText: string): string {
  const formatted = formatAppealText(appealText);
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto;">
      <p style="margin-bottom: 1.5rem;">${formatted}</p>
    </div>
  `;
}

/**
 * Parse appeal text into structured sections
 */
export function parseAppealSections(appealText: string): {
  subject: string;
  greeting: string;
  introduction: string;
  rootCauses: string;
  correctiveActions: string;
  preventiveMeasures: string;
  conclusion: string;
  signature: string;
} {
  const sections = {
    subject: '',
    greeting: '',
    introduction: '',
    rootCauses: '',
    correctiveActions: '',
    preventiveMeasures: '',
    conclusion: '',
    signature: '',
  };

  // Extract subject
  const subjectMatch = appealText.match(/Subject:\s*(.+?)(?:\n|$)/);
  if (subjectMatch) sections.subject = subjectMatch[1].trim();

  // Extract greeting
  const greetingMatch = appealText.match(/Dear\s+.+?,/);
  if (greetingMatch) sections.greeting = greetingMatch[0];

  // Extract sections by headers
  const rootCausesMatch = appealText.match(/\*\*A\.\s*Root Causes[^*]*\*\*([\s\S]*?)(?=\*\*B\.|$)/);
  if (rootCausesMatch) sections.rootCauses = rootCausesMatch[1].trim();

  const correctiveMatch = appealText.match(/\*\*B\.\s*Corrective Actions[^*]*\*\*([\s\S]*?)(?=\*\*C\.|$)/);
  if (correctiveMatch) sections.correctiveActions = correctiveMatch[1].trim();

  const preventiveMatch = appealText.match(/\*\*C\.\s*Preventive Measures[^*]*\*\*([\s\S]*?)(?=\n\n[A-Z]|Sincerely|Thank you|$)/);
  if (preventiveMatch) sections.preventiveMeasures = preventiveMatch[1].trim();

  return sections;
}
