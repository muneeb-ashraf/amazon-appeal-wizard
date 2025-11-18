const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const feedbackDir = path.join(__dirname, '..', 'client-feedback');
const outputDir = path.join(__dirname, '..', 'client-feedback-txt');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all DOCX files
const files = fs.readdirSync(feedbackDir).filter(f => f.endsWith('.docx'));

console.log(`Found ${files.length} DOCX files to process`);

async function processFiles() {
  for (const file of files) {
    try {
      const inputPath = path.join(feedbackDir, file);
      const outputPath = path.join(outputDir, file.replace('.docx', '.txt'));

      console.log(`Processing: ${file}`);

      const result = await mammoth.extractRawText({ path: inputPath });
      fs.writeFileSync(outputPath, result.value, 'utf-8');

      console.log(`  ✓ Saved to: ${path.basename(outputPath)}`);
    } catch (error) {
      console.error(`  ✗ Error processing ${file}:`, error.message);
    }
  }

  console.log('\n✅ All files processed!');
}

processFiles().catch(console.error);
