// ============================================================================
// DOCUMENT PROCESSING UTILITIES
// ============================================================================

import mammoth from 'mammoth';
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
 * Process a DOCX document: download from S3, convert to text, upload text version
 */
export async function processDocument(s3Key: string): Promise<{
  textContent: string;
  textS3Key: string;
}> {
  try {
    // Download the DOCX file
    const docxBuffer = await downloadFromS3(s3Key);
    
    // Convert to text
    const textContent = await convertDocxToText(docxBuffer);
    
    // Create the TXT S3 key - replace 'documents/' with 'documents-txt/' and .docx with .txt
    const textS3Key = s3Key
      .replace('documents/', 'documents-txt/')
      .replace('.docx', '.txt');
    
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
 */
export async function getAllDocumentTexts(documentKeys: string[]): Promise<string[]> {
  const texts: string[] = [];
  
  for (const key of documentKeys) {
    try {
      // Convert to TXT path: documents/ -> documents-txt/ and .docx -> .txt
      const txtKey = key
        .replace('documents/', 'documents-txt/')
        .replace('.docx', '.txt');
      const buffer = await downloadFromS3(txtKey);
      texts.push(buffer.toString('utf-8'));
    } catch (error) {
      console.error(`Error processing document ${key}:`, error);
      // Continue with other documents
    }
  }
  
  return texts;
}
