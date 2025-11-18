// ============================================================================
// DOCUMENT PROCESSING UTILITIES
// ============================================================================

import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, getS3Bucket } from './aws-config';

/**
 * Convert DOCX file to plain text using Mammoth
 */
export async function convertDocxToText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error converting DOCX to text:', error);
    throw new Error('Failed to convert DOCX file to text');
  }
}

/**
 * Convert Excel file (XLSX/XLS) to plain text
 */
export async function convertExcelToText(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let textContent = '';

    // Process each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];

      // Add sheet name as header
      if (workbook.SheetNames.length > 1) {
        textContent += `\n=== Sheet: ${sheetName} ===\n`;
      }

      // Convert to CSV format first, then clean up
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      textContent += csvData + '\n';
    });

    return textContent.trim();
  } catch (error) {
    console.error('Error converting Excel to text:', error);
    throw new Error('Failed to convert Excel file to text');
  }
}

/**
 * Convert CSV file to plain text (with better formatting)
 */
export async function convertCsvToText(buffer: Buffer): Promise<string> {
  try {
    const csvString = buffer.toString('utf-8');

    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        complete: (results) => {
          try {
            // Convert parsed data back to readable text format
            const rows = results.data as string[][];
            const textContent = rows
              .map(row => row.join(', '))
              .join('\n');
            resolve(textContent);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(error.message));
        }
      });
    });
  } catch (error) {
    console.error('Error converting CSV to text:', error);
    throw new Error('Failed to convert CSV file to text');
  }
}

/**
 * Download file from S3
 */
export async function downloadFromS3(s3Key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: s3Key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No file content received from S3');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error downloading from S3:', error);
    throw new Error('Failed to download file from S3');
  }
}

/**
 * Upload file to S3
 */
export async function uploadToS3(
  key: string,
  body: Buffer | string,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    
    return `https://${getS3Bucket()}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Process a document: download from S3, convert to text based on file type, upload text version
 * Supports: DOCX, XLSX, XLS, CSV, TXT
 */
export async function processDocument(s3Key: string): Promise<{
  textContent: string;
  textS3Key: string;
}> {
  try {
    // Download the file
    const fileBuffer = await downloadFromS3(s3Key);

    // Determine file type from extension
    const extension = s3Key.toLowerCase().split('.').pop() || '';
    let textContent = '';
    let outputExtension = '.txt';

    // Convert based on file type
    switch (extension) {
      case 'docx':
        textContent = await convertDocxToText(fileBuffer);
        break;
      case 'xlsx':
      case 'xls':
        textContent = await convertExcelToText(fileBuffer);
        break;
      case 'csv':
        textContent = await convertCsvToText(fileBuffer);
        break;
      case 'txt':
        textContent = fileBuffer.toString('utf-8');
        break;
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }

    // Create the TXT S3 key - replace 'documents/' with 'documents-txt/' and change extension to .txt
    const textS3Key = s3Key
      .replace('documents/', 'documents-txt/')
      .replace(new RegExp(`\\.${extension}$`), '.txt');

    // Upload text version to S3
    await uploadToS3(textS3Key, textContent, 'text/plain');

    return {
      textContent,
      textS3Key,
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

/**
 * Get all document texts for embedding
 * Handles multiple file types: DOCX, XLSX, XLS, CSV, TXT
 */
export async function getAllDocumentTexts(documentKeys: string[]): Promise<string[]> {
  const texts: string[] = [];

  for (const key of documentKeys) {
    try {
      // Determine the extension
      const extension = key.toLowerCase().split('.').pop() || '';

      // Convert to TXT path: documents/ -> documents-txt/ and change extension to .txt
      const txtKey = key
        .replace('documents/', 'documents-txt/')
        .replace(new RegExp(`\\.${extension}$`), '.txt');

      const buffer = await downloadFromS3(txtKey);
      texts.push(buffer.toString('utf-8'));
    } catch (error) {
      console.error(`Error processing document ${key}:`, error);
      // Continue with other documents
    }
  }

  return texts;
}
