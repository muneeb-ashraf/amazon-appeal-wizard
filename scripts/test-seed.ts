import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('Starting test...');
console.log('AWS Region:', process.env.NEXT_PUBLIC_AWS_REGION);
console.log('Config Table:', process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE);

import {
  APPEAL_TYPES,
  ROOT_CAUSES,
  CORRECTIVE_ACTIONS,
  PREVENTIVE_MEASURES,
  SUPPORTING_DOCUMENT_TYPES,
} from '../src/lib/constants';

console.log('APPEAL_TYPES count:', APPEAL_TYPES.length);
console.log('ROOT_CAUSES keys:', Object.keys(ROOT_CAUSES));
console.log('CORRECTIVE_ACTIONS keys:', Object.keys(CORRECTIVE_ACTIONS));
console.log('PREVENTIVE_MEASURES keys:', Object.keys(PREVENTIVE_MEASURES));
console.log('SUPPORTING_DOCUMENT_TYPES count:', SUPPORTING_DOCUMENT_TYPES.length);

console.log('Test complete!');
