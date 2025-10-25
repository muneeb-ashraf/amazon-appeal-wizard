# Amazon Appeal Wizard

> **AI-Powered Amazon Seller Appeal Generator** - Transform your suspension into a professional Plan of Action in minutes.

## 🚀 Quick Start

**Ready to get started?**

👉 **[FINAL_SETUP_INSTRUCTIONS.md](./FINAL_SETUP_INSTRUCTIONS.md)** - Complete setup guide (20 minutes)

**Already have .env configured?**

👉 **[QUICK_START.md](./QUICK_START.md)** - Fast-track setup (5 minutes)

**Starting from scratch?**

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your AWS and OpenAI credentials

# 3. Validate your configuration
npm run validate-env

# 4. Upload documents to S3 (see UPLOAD_DOCUMENTS_GUIDE.md)
# Then process them:
npm run process-documents

# 5. Run development server
npm run dev
```

Visit `http://localhost:3000`

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| **[FINAL_SETUP_INSTRUCTIONS.md](./FINAL_SETUP_INSTRUCTIONS.md)** | 🎯 **START HERE** - Complete setup walkthrough |
| **[QUICK_START.md](./QUICK_START.md)** | ⚡ Fast setup guide (you have .env ready) |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | 📚 Complete setup from scratch |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | ✅ Production deployment checklist |
| **[DOCUMENT_SETUP.md](./DOCUMENT_SETUP.md)** | 📄 Document processing guide |
| **[UPLOAD_DOCUMENTS_GUIDE.md](./UPLOAD_DOCUMENTS_GUIDE.md)** | ⬆️ S3 upload instructions |
| **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** | 📋 Current implementation details |

## ✨ Features

- 🎯 **18 Appeal Types** - Comprehensive coverage of all Amazon suspension reasons
- 🤖 **AI-Powered** - Uses GPT-4 and embeddings from 38 successful appeals
- 📝 **Multi-Step Form** - Intuitive, conditional logic based on your situation
- 📄 **Document Processing** - Converts DOCX to TXT for optimal AI embedding
- 💾 **Cloud Storage** - AWS S3 + DynamoDB for secure data management
- 📊 **Admin Dashboard** - Monitor all appeals and manage documents
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **AI:** OpenAI GPT-4 + Embeddings
- **Backend:** Next.js API Routes
- **Storage:** AWS S3 (documents) + DynamoDB (data)
- **Document Processing:** Mammoth.js
- **Deployment:** AWS Amplify

## 📋 Prerequisites

- Node.js 18+
- AWS Account (S3, DynamoDB, IAM)
- OpenAI API Key (with GPT-4 access)

## 🎯 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── generate-appeal/
│   │   └── process-document/
│   ├── dashboard/         # Admin dashboard
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── UpdatedMultiStepForm.tsx
│   ├── AdminDashboardNew.tsx
│   └── HomePage.tsx
├── lib/                   # Utility functions
│   ├── aws-config.ts
│   ├── constants.ts
│   ├── document-processor.ts
│   └── openai-utils.ts
└── types/                 # TypeScript types
    └── index.ts
```

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## 🌐 Deployment to AWS Amplify

1. Push to GitHub
2. Connect AWS Amplify to your repository
3. Add environment variables in Amplify Console
4. Deploy!

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed deployment instructions.

## 🛠️ Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Validate environment configuration
npm run validate-env

# Process all template documents (DOCX → TXT + embeddings)
npm run process-documents

# Lint code
npm run lint
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run validate-env` | ✅ Verify all environment variables and AWS connections |
| `npm run process-documents` | 🔄 Convert all 38 DOCX files to TXT and create embeddings |

## 📝 Configuration

Create `.env.local`:

```env
OPENAI_API_KEY=sk-your-key
NEXT_AWS_ACCESS_KEY_ID=your-key
NEXT_AWS_SECRET_ACCESS_KEY=your-secret
NEXT_PUBLIC_AWS_S3_BUCKET=your-bucket
```

See `.env.example` for all variables.

## 🎯 Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Set up AWS (S3 bucket, DynamoDB tables)
3. ✅ Configure environment variables (`.env.local`)
4. ✅ Upload your 38 reference documents to S3
5. ✅ Process documents (convert DOCX to TXT, create embeddings)
6. ✅ Test locally (`npm run dev`)
7. ✅ Deploy to AWS Amplify

**See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for comprehensive step-by-step instructions!**

---

**Made with ❤️ for Amazon Sellers**
