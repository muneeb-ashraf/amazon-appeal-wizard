// ============================================================================
// TEST APPEAL GENERATION
// ============================================================================

import { config } from 'dotenv';
config({ path: '.env.local' });

import { AppealFormData } from '../src/types';

// Sample form data for testing
const testFormData: AppealFormData = {
  fullName: 'Test Seller LLC',
  storeName: 'Premium Electronics Store',
  email: 'test@example.com',
  sellerId: 'A1234567890ABC',
  asins: ['B08N5WRWNW', 'B09MTBZSQ7'],
  appealType: 'inauthenticity-supply-chain',
  rootCauses: [
    'Sourcing from unauthorized distributor',
    'Inadequate supplier verification process',
    'Lack of proper documentation tracking'
  ],
  rootCauseDetails: 'We discovered that one of our suppliers was not properly vetted and may have provided products that did not meet Amazon\'s authenticity standards. Our verification process was not thorough enough to catch this issue.',
  unauthorizedSupplier: '',
  relatedAccountReason: '',
  categoryRejectionReason: '',
  detailPageAbuseArea: [],
  correctiveActionsTaken: [
    'Removed all inventory from suspended listings',
    'Terminated relationship with problematic supplier',
    'Obtained invoices and authorization letters from manufacturer',
    'Conducted full inventory audit'
  ],
  correctiveActionsDetails: 'We have immediately removed all potentially inauthentic inventory from our FBA warehouse and disposed of it properly. We have also obtained direct authorization from the brand manufacturer.',
  preventiveMeasures: [
    'Implement strict supplier vetting with authorization verification',
    'Require purchase invoices for all products before listing',
    'Monthly audits of supplier documentation',
    'Staff training on authenticity requirements',
    'Direct relationships with brand manufacturers only'
  ],
  preventiveMeasuresDetails: 'We are implementing a comprehensive supplier verification system that requires authorization letters, invoices, and regular compliance audits. All staff will undergo training on Amazon\'s authenticity policies.',
  uploadedDocuments: [
    { 
      id: 'doc1',
      type: 'invoice', 
      fileName: 'supplier-invoice-2024.pdf',
      fileSize: 150000,
      uploadedAt: new Date()
    },
    { 
      id: 'doc2',
      type: 'loa', 
      fileName: 'brand-authorization.pdf',
      fileSize: 200000,
      uploadedAt: new Date()
    }
  ]
};

async function testAppealGeneration() {
  console.log('🧪 Testing Appeal Generation...\n');
  console.log('📋 Test Form Data:');
  console.log(`   Store: ${testFormData.storeName}`);
  console.log(`   Issue: ${testFormData.appealType}`);
  console.log(`   ASINs: ${testFormData.asins.join(', ')}\n`);

  try {
    console.log('📡 Sending request to API...');
    
    const response = await fetch('http://localhost:3000/api/generate-appeal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testFormData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    console.log('\n✅ SUCCESS! Appeal generated:\n');
    console.log('═'.repeat(80));
    console.log(data.appeal);
    console.log('═'.repeat(80));
    
    console.log(`\n📊 Appeal Length: ${data.appeal.length} characters`);
    console.log(`⏱️  Generation Time: ~${Math.round(data.appeal.length / 100)}s estimated`);
    
    if (data.appealId) {
      console.log(`🆔 Appeal ID: ${data.appealId}`);
    }

    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAppealGeneration();
