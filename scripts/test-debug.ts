console.log('Script started');
console.error('Error output test');
process.stdout.write('stdout test\n');
process.stderr.write('stderr test\n');

import * as path from 'path';
import * as dotenv from 'dotenv';

console.log('After imports');

const envPath = path.join(__dirname, '..', '.env.local');
console.log('Env path:', envPath);

dotenv.config({ path: envPath });
console.log('After dotenv.config');

console.log('AWS_REGION:', process.env.NEXT_PUBLIC_AWS_REGION);
console.log('DynamoDB table:', process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE);

console.log('Script complete');
