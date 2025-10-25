# Amazon Appeal Wizard - Complete Setup Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [AWS Setup](#aws-setup)
5. [Local Development Setup](#local-development-setup)
6. [Document Processing](#document-processing)
7. [Deployment to AWS Amplify](#deployment-to-aws-amplify)
8. [Configuration](#configuration)
9. [Usage](#usage)
10. [API Documentation](#api-documentation)

---

## 🎯 Overview

Amazon Appeal Wizard is an AI-powered application that helps Amazon sellers generate professional Plan of Action (POA) appeals based on their specific situation. The application:

- Uses a comprehensive multi-step form based on analysis of 38 successful appeals
- Processes DOCX documents and converts them to TXT for better embedding
- Uses OpenAI embeddings and GPT-4 to generate contextual, professional appeals
- Stores all data in AWS DynamoDB
- Stores documents in AWS S3
- Provides an admin dashboard for monitoring

---

## 🏗️ Architecture

### Tech Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **AI:** OpenAI API (GPT-4 + Embeddings)
- **Document Processing:** Mammoth.js (DOCX to TXT conversion)
- **Storage:** AWS S3 (documents), AWS DynamoDB (data)
- **Deployment:** AWS Amplify
- **PDF Generation:** jsPDF

### Data Flow
```
User Input → Multi-Step Form → API Route → Document Processing → 
OpenAI Embedding → Find Relevant Docs → GPT-4 Generation → 
Store in DynamoDB → Return Appeal → User Downloads
```

---

## ✅ Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **AWS Account** with:
   - S3 bucket access
   - DynamoDB access
   - IAM credentials
4. **OpenAI API Key** (with GPT-4 access)
5. **Git** (for version control)

---

## ☁️ AWS Setup

### Step 1: Create S3 Bucket

1. Go to AWS S3 Console
2. Click "Create bucket"
3. Name: `amazon-appeal-documents` (or your preferred name)
4. Region: `us-east-1` (or your preferred region)
5. **Important:** Enable CORS for file uploads
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
6. Create the following folder structure in your bucket:
   ```
   documents/          # Your 38 reference documents (DOCX)
   documents-txt/      # Converted TXT versions
   user-uploads/       # User uploaded documents
   ```

### Step 2: Upload Your 38 Reference Documents

1. Navigate to the `documents/` folder in your S3 bucket
2. Upload all 38 DOCX appeal documents
3. Ensure they are named systematically (e.g., `appeal-001.docx`, `appeal-002.docx`, etc.)

### Step 3: Create DynamoDB Tables

#### Table 1: amazon-appeals
- **Table name:** `amazon-appeals`
- **Primary key:** `id` (String)
- **Settings:** On-demand billing

#### Table 2: amazon-documents
- **Table name:** `amazon-documents`
- **Primary key:** `id` (String)
- **Settings:** On-demand billing

### Step 4: Create IAM User for Application

1. Go to IAM Console → Users → Add User
2. Name: `amazon-appeal-app`
3. Access type: Programmatic access
4. Attach policies:
   - `AmazonS3FullAccess` (or create custom policy for your bucket)
   - `AmazonDynamoDBFullAccess` (or create custom policy for your tables)
5. **Save the Access Key ID and Secret Access Key**

---

## 💻 Local Development Setup

### Step 1: Clone and Install

```bash
# Navigate to your project directory
cd b:\amazon-appeal-wizard

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_AWS_ACCESS_KEY_ID=your-aws-access-key-id
NEXT_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
NEXT_PUBLIC_AWS_S3_BUCKET=amazon-appeal-documents

# DynamoDB Tables
NEXT_PUBLIC_DYNAMODB_APPEALS_TABLE=amazon-appeals
NEXT_PUBLIC_DYNAMODB_DOCUMENTS_TABLE=amazon-documents

# Admin Password
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-admin-password

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 3: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## 📄 Document Processing

### Converting DOCX Documents to TXT

You have two options:

#### Option 1: Automated Batch Processing (Recommended)

Create a script `scripts/process-documents.ts`:

```typescript
import { processDocument } from '@/lib/document-processor';

async function processAllDocuments() {
  const documentKeys = [
    'documents/appeal-001.docx',
    'documents/appeal-002.docx',
    // ... add all 38 documents
  ];

  for (const key of documentKeys) {
    try {
      console.log(`Processing ${key}...`);
      await processDocument(key);
      console.log(`✓ Processed ${key}`);
    } catch (error) {
      console.error(`✗ Failed to process ${key}:`, error);
    }
  }
}

processAllDocuments();
```

Run it:
```bash
npx ts-node scripts/process-documents.ts
```

#### Option 2: Use the Admin Dashboard

1. Navigate to `/dashboard` (will be added to routing)
2. Log in with admin password
3. Use the document upload interface
4. Documents will be automatically processed and embedded

### Creating Embeddings for Documents

After converting to TXT, create embeddings:

```typescript
// This happens automatically in the process-document API route
// But you can also run a batch script:

import { getAllDocumentTexts } from '@/lib/document-processor';
import { createBatchEmbeddings } from '@/lib/openai-utils';
import { dynamoDbClient, DOCUMENTS_TABLE } from '@/lib/aws-config';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

async function createAllEmbeddings() {
  // Get all document TXT keys from S3
  const documentKeys = [
    'documents-txt/appeal-001.txt',
    'documents-txt/appeal-002.txt',
    // ... all 38
  ];

  const texts = await getAllDocumentTexts(documentKeys);
  const embeddings = await createBatchEmbeddings(texts);

  // Store embeddings in DynamoDB
  for (let i = 0; i < documentKeys.length; i++) {
    await dynamoDbClient.send(
      new UpdateCommand({
        TableName: DOCUMENTS_TABLE,
        Key: { id: documentKeys[i] },
        UpdateExpression: 'SET embedding = :embedding, embeddingStatus = :status',
        ExpressionAttributeValues: {
          ':embedding': embeddings[i],
          ':status': 'completed',
        },
      })
    );
  }
}
```

---

## 🚀 Deployment to AWS Amplify

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/amazon-appeal-wizard.git
git push -u origin main
```

### Step 2: Connect to AWS Amplify

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Choose "GitHub" and authorize
4. Select your repository: `amazon-appeal-wizard`
5. Choose branch: `main`

### Step 3: Configure Build Settings

Amplify should auto-detect Next.js, but verify the build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 4: Add Environment Variables in Amplify

1. Go to App Settings → Environment variables
2. Add all variables from your `.env.local` (except NEXT_PUBLIC_APP_URL)
3. **Important:** Don't prefix server-side variables with NEXT_PUBLIC in production

### Step 5: Deploy

Click "Save and deploy"

Your app will be available at: `https://main.xxxxxx.amplifyapp.com`

---

## ⚙️ Configuration

### Updating the Document List in API

Edit `src/app/api/generate-appeal/route.ts`:

```typescript
const documentKeys = [
  'documents-txt/appeal-001.txt',
  'documents-txt/appeal-002.txt',
  'documents-txt/appeal-003.txt',
  // ... add all 38 document keys here
];
```

### Customizing Appeal Types

Edit `src/lib/constants.ts` to modify:
- Appeal categories
- Root cause options
- Corrective actions
- Preventive measures

### Admin Access

The admin password is set in environment variables:
```env
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

Access admin at: `/dashboard`

---

## 📖 Usage

### For Users

1. **Start Appeal:** Click "Start Your Appeal" button
2. **Select Issue Type:** Choose the primary reason for account action
3. **Enter Account Details:** Provide name, email, seller ID, ASINs
4. **Identify Root Causes:** Select applicable root causes
5. **List Corrective Actions:** Check actions already taken
6. **Choose Preventive Measures:** Select long-term preventive steps
7. **Upload Documents:** Add supporting documentation
8. **Review & Generate:** Review all information and generate appeal
9. **Download:** Copy or download the generated appeal letter

### For Admins

1. Navigate to `/dashboard`
2. Log in with admin password
3. View statistics and all appeal submissions
4. Manage documents
5. View individual appeal details

---

## 🔌 API Documentation

### POST /api/generate-appeal

Generate an appeal letter based on form data.

**Request Body:**
```json
{
  "formData": {
    "appealType": "inauthenticity-supply-chain",
    "fullName": "John Smith",
    "storeName": "My Store",
    "email": "john@example.com",
    "sellerId": "A123456789",
    "asins": ["B08CRSYCQS"],
    "rootCauses": ["Operating Retail Arbitrage model"],
    "correctiveActionsTaken": ["Ceased sourcing from unverified suppliers"],
    "preventiveMeasures": ["Source only from verified distributors"],
    "uploadedDocuments": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "appealId": "uuid-here",
  "appealText": "Dear Amazon Seller Performance Team..."
}
```

### POST /api/process-document

Process a DOCX document (convert to TXT and create embedding).

**Request Body:**
```json
{
  "s3Key": "documents/appeal-001.docx",
  "documentName": "Appeal Example 1"
}
```

**Response:**
```json
{
  "success": true,
  "documentId": "uuid-here",
  "textS3Key": "documents-txt/appeal-001.txt"
}
```

---

## 🗄️ Database Schema

### appeals Table
```typescript
{
  id: string;              // UUID
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  formData: {              // Complete form data
    appealType: string;
    fullName: string;
    // ... all fields
  };
  appealText: string;      // Generated appeal
  status: string;          // 'draft' | 'generating' | 'completed' | 'failed'
}
```

### documents Table
```typescript
{
  id: string;              // UUID
  documentName: string;
  s3Key: string;
  s3Bucket: string;
  fileType: string;        // 'docx' | 'txt'
  uploadedAt: string;
  processedAt: string;
  embeddingStatus: string; // 'pending' | 'processing' | 'completed' | 'failed'
  textContent: string;     // First 5000 characters
  embedding: number[];     // Vector embedding
}
```

---

## 🛡️ Security Considerations

1. **API Keys:** Never commit `.env.local` to Git
2. **Admin Password:** Use a strong, unique password
3. **AWS Credentials:** Use IAM roles with minimum required permissions
4. **CORS:** Restrict S3 CORS to your domain in production
5. **Rate Limiting:** Implement rate limiting for API routes in production
6. **Input Validation:** All form inputs are validated client-side and should be validated server-side

---

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors
**Solution:** Run `npm install` to install all dependencies

### Issue: OpenAI API errors
**Solution:** 
- Verify your API key is correct
- Ensure you have GPT-4 access
- Check your OpenAI account has credits

### Issue: AWS S3 permission errors
**Solution:**
- Verify IAM user has S3 access
- Check bucket CORS configuration
- Ensure bucket name in .env matches actual bucket

### Issue: Documents not processing
**Solution:**
- Check document format (must be .docx)
- Verify documents are in the correct S3 folder
- Check CloudWatch logs for errors

---

## 📝 File Structure

```
amazon-appeal-wizard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-appeal/
│   │   │   │   └── route.ts
│   │   │   └── process-document/
│   │   │       └── route.ts
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AdminDashboardNew.tsx
│   │   ├── HomePage.tsx
│   │   ├── UpdatedMultiStepForm.tsx
│   │   └── PasswordProtection.tsx
│   ├── lib/
│   │   ├── aws-config.ts
│   │   ├── constants.ts
│   │   ├── document-processor.ts
│   │   └── openai-utils.ts
│   └── types/
│       └── index.ts
├── public/
├── .env.local (create this)
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── README.md
```

---

## 🎯 Next Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set Up AWS Resources:**
   - Create S3 bucket
   - Create DynamoDB tables
   - Create IAM user
   - Upload your 38 documents

3. **Configure Environment:**
   - Copy `.env.example` to `.env.local`
   - Fill in all required values

4. **Process Documents:**
   - Convert DOCX to TXT
   - Create embeddings
   - Store in DynamoDB

5. **Test Locally:**
   ```bash
   npm run dev
   ```

6. **Deploy to Amplify:**
   - Push to GitHub
   - Connect Amplify
   - Configure environment variables
   - Deploy

---

## 📞 Support

For questions or issues:
1. Check this documentation
2. Review AWS CloudWatch logs
3. Check OpenAI API status
4. Verify all environment variables are set correctly

---

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ for Amazon Sellers**
