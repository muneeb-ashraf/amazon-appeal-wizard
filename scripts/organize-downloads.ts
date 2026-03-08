import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as readline from 'readline';

interface FileMetadata {
  fullPath: string;
  name: string;
  extension: string;
  size: number;
  created: Date;
  modified: Date;
  hash: string;
  category: string;
}

interface CategoryStats {
  count: number;
  totalSize: number;
  files: FileMetadata[];
}

const DOWNLOADS_PATH = 'C:\\Users\\Tayyab Computer\\Downloads';
const ORGANIZED_PATH = path.join(DOWNLOADS_PATH, 'Downloads_Organized');
const REPORT_PATH = path.join(DOWNLOADS_PATH, 'cleanup_report.txt');
const LOG_PATH = path.join(DOWNLOADS_PATH, 'organization.log');

// File extension categorization
const CATEGORIES = {
  Images: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.svg', '.ico', '.heic', '.jfif', '.avif'],
  Videos: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'],
  Documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.md', '.csv'],
  Archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  Software_Installers: ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.apk', '.msix'],
  Design_Files: ['.fig', '.psd', '.ai', '.xd', '.sketch', '.eps'],
  Code_Files: ['.js', '.ts', '.py', '.php', '.html', '.css', '.json', '.yaml', '.yml', '.sql', '.xml'],
  Audio: ['.mp3', '.wav', '.aac', '.flac', '.m4a', '.ogg'],
  Temp_Files: ['.crdownload', '.tmp', '.part', '.download']
};

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB
const OLD_FILE_THRESHOLD = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months
const SMALL_FILE_THRESHOLD = 1 * 1024 * 1024; // 1MB

let logStream: fs.WriteStream;

function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  if (logStream) {
    logStream.write(logMessage);
  }
}

function calculateHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function isScreenshot(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.includes('screenshot') ||
         lower.includes('screen shot') ||
         lower.includes('capture') ||
         lower.match(/^scr[_-]?\d+/i) !== null;
}

function hasGenericName(filename: string): boolean {
  const patterns = [
    /^image\(\d+\)/i,
    /^download\(\d+\)/i,
    /^file\(\d+\)/i,
    /^document\(\d+\)/i,
    /^unnamed/i,
    /^untitled/i,
    /^\d{8,}_\d+/  // timestamp-based names
  ];

  return patterns.some(pattern => pattern.test(filename));
}

function getCategoryForFile(file: FileMetadata): string {
  const ext = file.extension.toLowerCase();

  // Check temp files first
  if (CATEGORIES.Temp_Files.includes(ext)) {
    return 'Temp_Files';
  }

  // Check other categories
  for (const [category, extensions] of Object.entries(CATEGORIES)) {
    if (extensions.includes(ext)) {
      // Special handling for images
      if (category === 'Images' && isScreenshot(file.name)) {
        return 'Images/Screenshots';
      }
      return category;
    }
  }

  return 'Unknown';
}

async function scanDirectory(dirPath: string, files: FileMetadata[] = []): Promise<FileMetadata[]> {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // Skip hidden files, system files, and our organized folder
    if (entry.name.startsWith('.') ||
        entry.name === 'Downloads_Organized' ||
        entry.name === 'desktop.ini' ||
        entry.name === 'thumbs.db') {
      continue;
    }

    try {
      if (entry.isDirectory()) {
        await scanDirectory(fullPath, files);
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        const ext = path.extname(entry.name);

        log(`Scanning: ${entry.name}`);

        const hash = await calculateHash(fullPath);

        const fileMetadata: FileMetadata = {
          fullPath,
          name: entry.name,
          extension: ext,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          hash,
          category: '' // Will be set later
        };

        fileMetadata.category = getCategoryForFile(fileMetadata);
        files.push(fileMetadata);
      }
    } catch (error) {
      log(`Error processing ${fullPath}: ${error}`);
    }
  }

  return files;
}

function createFolderStructure(dryRun: boolean): void {
  const folders = [
    'Images/Screenshots',
    'Images/Photos',
    'Images/Design_Assets',
    'Videos/Recordings',
    'Videos/Downloads',
    'Documents/Contracts',
    'Documents/Receipts',
    'Documents/Notes',
    'Documents/Other',
    'Archives',
    'Software_Installers',
    'Design_Files',
    'Code_Files',
    'Audio',
    'Temp_Files',
    'Duplicates',
    'Large_Files',
    'Unknown',
    'Review_Later'
  ];

  if (!dryRun) {
    if (!fs.existsSync(ORGANIZED_PATH)) {
      fs.mkdirSync(ORGANIZED_PATH);
    }

    for (const folder of folders) {
      const folderPath = path.join(ORGANIZED_PATH, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    }
    log('Folder structure created successfully');
  } else {
    log('[DRY RUN] Would create folder structure');
  }
}

function findDuplicates(files: FileMetadata[]): Map<string, FileMetadata[]> {
  const hashMap = new Map<string, FileMetadata[]>();

  for (const file of files) {
    if (!hashMap.has(file.hash)) {
      hashMap.set(file.hash, []);
    }
    hashMap.get(file.hash)!.push(file);
  }

  // Filter to only duplicates (more than one file with same hash)
  const duplicates = new Map<string, FileMetadata[]>();
  for (const [hash, fileList] of hashMap.entries()) {
    if (fileList.length > 1) {
      duplicates.set(hash, fileList);
    }
  }

  return duplicates;
}

function shouldReview(file: FileMetadata): boolean {
  const isOld = Date.now() - file.modified.getTime() > OLD_FILE_THRESHOLD;
  const isSmall = file.size < SMALL_FILE_THRESHOLD;
  const hasGeneric = hasGenericName(file.name);

  return (isOld && isSmall) || hasGeneric;
}

function organizeFiles(files: FileMetadata[], duplicates: Map<string, FileMetadata[]>, dryRun: boolean): Map<string, CategoryStats> {
  const stats = new Map<string, CategoryStats>();
  const processedHashes = new Set<string>();

  for (const file of files) {
    let targetCategory = file.category;
    let targetPath = '';

    // Check if it's a duplicate
    const duplicateGroup = duplicates.get(file.hash);
    if (duplicateGroup && duplicateGroup.length > 1) {
      // Keep the first one in its category, move others to Duplicates
      const isFirstOccurrence = !processedHashes.has(file.hash);

      if (!isFirstOccurrence) {
        targetCategory = 'Duplicates';
      }

      processedHashes.add(file.hash);
    }

    // Check if should be reviewed
    if (targetCategory !== 'Duplicates' && targetCategory !== 'Temp_Files' && shouldReview(file)) {
      targetCategory = 'Review_Later';
    }

    targetPath = path.join(ORGANIZED_PATH, targetCategory, file.name);

    // Handle naming conflicts
    if (!dryRun && fs.existsSync(targetPath)) {
      const nameWithoutExt = path.parse(file.name).name;
      const ext = file.extension;
      let counter = 1;

      while (fs.existsSync(targetPath)) {
        targetPath = path.join(ORGANIZED_PATH, targetCategory, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
      }
    }

    // Update stats
    if (!stats.has(targetCategory)) {
      stats.set(targetCategory, { count: 0, totalSize: 0, files: [] });
    }

    const categoryStat = stats.get(targetCategory)!;
    categoryStat.count++;
    categoryStat.totalSize += file.size;
    categoryStat.files.push(file);

    // Move file
    if (!dryRun) {
      try {
        fs.copyFileSync(file.fullPath, targetPath);
        fs.unlinkSync(file.fullPath);
        log(`Moved: ${file.name} -> ${targetCategory}`);
      } catch (error) {
        log(`Error moving ${file.name}: ${error}`);
      }
    } else {
      log(`[DRY RUN] Would move: ${file.name} -> ${targetCategory}`);
    }
  }

  return stats;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateReport(
  files: FileMetadata[],
  stats: Map<string, CategoryStats>,
  duplicates: Map<string, FileMetadata[]>,
  dryRun: boolean
): string {
  let report = '=' .repeat(80) + '\n';
  report += 'DOWNLOADS FOLDER ORGANIZATION REPORT\n';
  report += '='.repeat(80) + '\n\n';

  if (dryRun) {
    report += '⚠️  DRY RUN MODE - No files were actually moved\n\n';
  }

  report += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Summary
  report += 'SUMMARY\n';
  report += '-'.repeat(80) + '\n';
  report += `Total files scanned: ${files.length}\n`;
  report += `Total size: ${formatBytes(files.reduce((sum, f) => sum + f.size, 0))}\n\n`;

  // Files by category
  report += 'FILES ORGANIZED BY CATEGORY\n';
  report += '-'.repeat(80) + '\n';

  const sortedCategories = Array.from(stats.entries()).sort((a, b) => b[1].count - a[1].count);

  for (const [category, categoryStat] of sortedCategories) {
    report += `\n${category}:\n`;
    report += `  Files: ${categoryStat.count}\n`;
    report += `  Total size: ${formatBytes(categoryStat.totalSize)}\n`;
  }

  // Duplicates
  report += '\n\nDUPLICATES FOUND\n';
  report += '-'.repeat(80) + '\n';
  report += `Duplicate groups: ${duplicates.size}\n`;

  let totalDuplicateSize = 0;
  let duplicateFileCount = 0;

  for (const [hash, fileList] of duplicates) {
    duplicateFileCount += fileList.length - 1; // Don't count the original
    const fileSize = fileList[0].size;
    totalDuplicateSize += fileSize * (fileList.length - 1);
  }

  report += `Duplicate files: ${duplicateFileCount}\n`;
  report += `Space that could be saved: ${formatBytes(totalDuplicateSize)}\n\n`;

  if (duplicates.size > 0) {
    report += 'Top duplicate groups:\n';
    const sortedDuplicates = Array.from(duplicates.values())
      .sort((a, b) => (b.length * b[0].size) - (a.length * a[0].size))
      .slice(0, 10);

    for (const fileList of sortedDuplicates) {
      report += `  ${fileList[0].name} (${fileList.length} copies, ${formatBytes(fileList[0].size)} each)\n`;
    }
  }

  // Large files
  report += '\n\nLARGE FILES (>100MB)\n';
  report += '-'.repeat(80) + '\n';

  const largeFiles = files
    .filter(f => f.size > LARGE_FILE_THRESHOLD)
    .sort((a, b) => b.size - a.size);

  report += `Total large files: ${largeFiles.length}\n`;
  report += `Total size: ${formatBytes(largeFiles.reduce((sum, f) => sum + f.size, 0))}\n\n`;

  for (const file of largeFiles) {
    report += `  ${file.name} - ${formatBytes(file.size)} (${file.category})\n`;
  }

  // Temporary files
  const tempStats = stats.get('Temp_Files');
  report += '\n\nTEMPORARY FILES\n';
  report += '-'.repeat(80) + '\n';
  report += `Count: ${tempStats ? tempStats.count : 0}\n`;
  report += `Total size: ${tempStats ? formatBytes(tempStats.totalSize) : '0 Bytes'}\n`;

  // Review candidates
  const reviewStats = stats.get('Review_Later');
  report += '\n\nREVIEW CANDIDATES\n';
  report += '-'.repeat(80) + '\n';
  report += `Count: ${reviewStats ? reviewStats.count : 0}\n`;
  report += `Total size: ${reviewStats ? formatBytes(reviewStats.totalSize) : '0 Bytes'}\n`;
  report += 'Criteria: Old files (>6 months) that are small (<1MB) or have generic names\n';

  // Unknown file types
  const unknownStats = stats.get('Unknown');
  report += '\n\nUNKNOWN FILE TYPES\n';
  report += '-'.repeat(80) + '\n';
  report += `Count: ${unknownStats ? unknownStats.count : 0}\n`;

  if (unknownStats && unknownStats.files.length > 0) {
    const extensionCounts = new Map<string, number>();
    for (const file of unknownStats.files) {
      const ext = file.extension || '(no extension)';
      extensionCounts.set(ext, (extensionCounts.get(ext) || 0) + 1);
    }

    report += '\nExtensions found:\n';
    for (const [ext, count] of Array.from(extensionCounts.entries()).sort((a, b) => b[1] - a[1])) {
      report += `  ${ext}: ${count} files\n`;
    }
  }

  // Storage breakdown
  report += '\n\nSTORAGE BREAKDOWN BY CATEGORY\n';
  report += '-'.repeat(80) + '\n';

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  for (const [category, categoryStat] of sortedCategories) {
    const percentage = ((categoryStat.totalSize / totalSize) * 100).toFixed(1);
    report += `${category}: ${formatBytes(categoryStat.totalSize)} (${percentage}%)\n`;
  }

  report += '\n' + '='.repeat(80) + '\n';
  report += 'END OF REPORT\n';
  report += '='.repeat(80) + '\n';

  return report;
}

async function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main(): Promise<void> {
  console.log('Downloads Folder Organization Tool');
  console.log('=' .repeat(80));
  console.log();

  // Check if downloads folder exists
  if (!fs.existsSync(DOWNLOADS_PATH)) {
    console.error(`Error: Downloads folder not found at ${DOWNLOADS_PATH}`);
    process.exit(1);
  }

  // Initialize log
  logStream = fs.createWriteStream(LOG_PATH, { flags: 'w' });

  try {
    // Phase 1: Scan & Analyze
    log('Phase 1: Scanning Downloads folder...');
    const files = await scanDirectory(DOWNLOADS_PATH);
    log(`Found ${files.length} files (${formatBytes(files.reduce((sum, f) => sum + f.size, 0))})`);

    // Phase 2: Detect duplicates
    log('\nPhase 2: Detecting duplicates...');
    const duplicates = findDuplicates(files);
    log(`Found ${duplicates.size} duplicate groups`);

    // Dry run first
    log('\n=== DRY RUN MODE ===');
    createFolderStructure(true);
    const dryRunStats = organizeFiles(files, duplicates, true);
    const dryRunReport = generateReport(files, dryRunStats, duplicates, true);

    console.log('\n' + dryRunReport);
    console.log('\nDry run report saved to:', REPORT_PATH);
    fs.writeFileSync(REPORT_PATH, dryRunReport);

    // Ask for confirmation
    console.log('\n' + '='.repeat(80));
    const proceed = await promptUser('\nProceed with actual file organization? (y/n): ');

    if (!proceed) {
      log('Operation cancelled by user');
      console.log('Operation cancelled. No files were moved.');
      logStream.end();
      return;
    }

    // Actual organization
    log('\n=== ACTUAL ORGANIZATION ===');
    log('Phase 3: Creating folder structure...');
    createFolderStructure(false);

    log('\nPhase 4: Organizing files...');
    const actualStats = organizeFiles(files, duplicates, false);

    log('\nPhase 5: Generating final report...');
    const finalReport = generateReport(files, actualStats, duplicates, false);

    fs.writeFileSync(REPORT_PATH, finalReport);

    console.log('\n' + '='.repeat(80));
    console.log('Organization complete!');
    console.log('='.repeat(80));
    console.log(`\nOrganized files: ${files.length}`);
    console.log(`Report saved to: ${REPORT_PATH}`);
    console.log(`Log saved to: ${LOG_PATH}`);
    console.log(`Organized folder: ${ORGANIZED_PATH}`);

  } catch (error) {
    log(`Fatal error: ${error}`);
    console.error('An error occurred:', error);
  } finally {
    logStream.end();
  }
}

// Run the script
main().catch(console.error);
