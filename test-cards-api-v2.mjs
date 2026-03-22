import https from 'https';

const apiUrl = process.env.PROPERFY_API_URL || 'https://adm.baggioimoveis.com.br/api';
const token = process.env.PROPERFY_API_TOKEN;

if (!token) {
  console.error('PROPERFY_API_TOKEN not set');
  process.exit(1);
}

console.log('Testing Properfy Cards API...');
console.log('API URL:', apiUrl);

// Test: Get cards with pagination
const cardUrl = new URL(`${apiUrl}/crm/card?page=1&size=10`);

const options = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
};

console.log('\n=== Testing GET /crm/card ===');
console.log('URL:', cardUrl.toString());

https.get(cardUrl, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    
    try {
      const parsed = JSON.parse(data);
      console.log('\n=== Response Structure ===');
      console.log(JSON.stringify(parsed, null, 2).substring(0, 3000));
      
      if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
        console.log('\n\n=== First Card Full Structure ===');
        console.log(JSON.stringify(parsed.data[0], null, 2));
      }
    } catch (e) {
      console.log('Raw response (first 3000 chars):');
      console.log(data.substring(0, 3000));
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

// Timeout after 60 seconds
setTimeout(() => {
  console.error('\nTimeout: API took too long to respond');
  process.exit(1);
}, 60000);
