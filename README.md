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

### Main Setup Guides
| Guide | Description |
|-------|-------------|
| **[FINAL_SETUP_INSTRUCTIONS.md](./FINAL_SETUP_INSTRUCTIONS.md)** | 🎯 **START HERE** - Complete setup walkthrough |
| **[QUICK_START.md](./QUICK_START.md)** | ⚡ Fast setup guide (you have .env ready) |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | 📚 Complete setup from scratch |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | ✅ Production deployment checklist |
| **[DOCUMENT_SETUP.md](./DOCUMENT_SETUP.md)** | 📄 Document processing guide |
| **[UPLOAD_DOCUMENTS_GUIDE.md](./UPLOAD_DOCUMENTS_GUIDE.md)** | ⬆️ S3 upload instructions |
| **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** | 📋 Current implementation details |

### Admin Panel Documentation
📁 **[docs/](./docs/)** - All admin panel documentation

| Document | Description |
|----------|-------------|
| **[docs/ADMIN_QUICK_START.md](./docs/ADMIN_QUICK_START.md)** | 🚀 Admin panel setup (5 minutes) |
| **[docs/admin-seed-quick-reference.md](./docs/admin-seed-quick-reference.md)** | 📋 Admin seed scripts quick reference |
| **[docs/ADMIN_PANEL_README.md](./docs/ADMIN_PANEL_README.md)** | 📋 Admin panel overview |
| **[docs/PHASE_2_COMPLETE.md](./docs/PHASE_2_COMPLETE.md)** | ✅ AI Instructions Editor guide |
| **[docs/GEMINI_RAG_INTEGRATION.md](./docs/GEMINI_RAG_INTEGRATION.md)** | ✨ **Gemini File Search RAG setup & migration** |
| **[docs/README.md](./docs/README.md)** | 📚 Complete documentation index |

### Scripts Documentation
📁 **[scripts/](./scripts/)** - Database seeding and setup scripts

| Document | Description |
|----------|-------------|
| **[scripts/README.md](./scripts/README.md)** | 📚 Complete guide to seed scripts |

## ✨ Features

### User-Facing
- 🎯 **22 Appeal Types** - Comprehensive coverage of all Amazon suspension reasons
- 🤖 **AI-Powered** - Uses GPT-4o-mini with **Gemini 2.5 Flash RAG** for template retrieval
- 📝 **Multi-Step Form** - Intuitive, conditional logic based on your situation
- 📄 **Document Processing** - Converts DOCX to TXT for optimal AI embedding
- 💾 **Cloud Storage** - AWS S3 + DynamoDB for secure data management
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- ✨ **NEW: Gemini RAG** - Advanced retrieval-augmented generation with Gemini File Search

### Admin Panel (NEW! ✨)
- ⚙️ **AI Instructions Editor** - Customize all 5 sections of appeal generation
- 📝 **Monaco Code Editor** - Professional editor with variable highlighting
- 🎚️ **Token Limits** - Visual sliders with character/word estimates
- 🔤 **Variable System** - 16+ variables for dynamic content
- 💾 **Draft & Activate** - Test changes before going live
- 📊 **Version Control** - Track all configuration changes
- 🎯 **Global Settings** - Model, temperature, retries, timeout

**Admin Panel Status**: Phase 2 Complete (~20% of total plan)
- ✅ Foundation & Database
- ✅ AI Instructions Editor
- 🔜 Form Fields Editor (Coming Next)

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **AI:** OpenAI GPT-4o-mini + **Google Gemini 2.5 Flash RAG**
- **Backend:** Next.js API Routes
- **Storage:** AWS S3 (documents) + DynamoDB (data)
- **Document Processing:** Mammoth.js
- **RAG:** Google Gemini File API for template retrieval
- **Deployment:** AWS Amplify

## 📋 Prerequisites

- Node.js 18+
- AWS Account (S3, DynamoDB, IAM)
- OpenAI API Key (with GPT-4 access)
- **Google Gemini API Key** (for RAG - get free at [Google AI Studio](https://makersuite.google.com/app/apikey))

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
| `npm run create-admin-tables` | 🗄️ Create DynamoDB tables for admin panel |
| `npm run seed-admin` | 🌱 Seed initial admin configurations |
| `npm run setup-admin` | 🚀 Create tables + seed (one command) |
| **`npm run migrate-to-gemini`** | ✨ **Migrate templates to Gemini File Search RAG** |
| **`npm run verify-gemini`** | 🔍 **Verify Gemini migration status** |

## 📝 Configuration

Create `.env.local`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key

# AWS Configuration
NEXT_AWS_ACCESS_KEY_ID=your-key
NEXT_AWS_SECRET_ACCESS_KEY=your-secret
NEXT_PUBLIC_AWS_S3_BUCKET=your-bucket

# Google Gemini Configuration (NEW!)
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Feature Flags
NEXT_PUBLIC_USE_GEMINI_RAG=false  # Set to true after migration
```

See `.env.example` for all variables.

### Gemini RAG Migration

After setting up AWS and OpenAI, migrate to Gemini File Search RAG:

```bash
# 1. Add Gemini API key to .env.local
# Get free key at: https://makersuite.google.com/app/apikey

# 2. Run migration
npm run migrate-to-gemini

# 3. Verify migration
npm run verify-gemini

# 4. Enable Gemini RAG
# Set NEXT_PUBLIC_USE_GEMINI_RAG=true in .env.local

# 5. Test appeal generation
npm run dev
```

See **[docs/GEMINI_RAG_INTEGRATION.md](./docs/GEMINI_RAG_INTEGRATION.md)** for detailed migration guide.

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
