console.log('JavaScript test works!');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('Region:', process.env.NEXT_PUBLIC_AWS_REGION);
console.log('Config table:', process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE);
