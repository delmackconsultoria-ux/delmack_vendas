// A URL está configurada errada - está apontando para /auth/token
// Precisamos usar a URL base correta

const PROPERFY_EMAIL = process.env.PROPERFY_EMAIL;
const PROPERFY_PASSWORD = process.env.PROPERFY_PASSWORD;
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN;

console.log('Email:', PROPERFY_EMAIL);
console.log('Password exists:', !!PROPERFY_PASSWORD);
console.log('Token:', PROPERFY_API_TOKEN);

// Primeiro, fazer login para obter token
const BASE_URL = 'https://sandbox.properfy.com.br/api';

async function login() {
  console.log('\\nTentando login...');
  const response = await fetch(BASE_URL + '/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: PROPERFY_EMAIL,
      password: PROPERFY_PASSWORD
    })
  });
  
  console.log('Login status:', response.status);
  const data = await response.json();
  console.log('Login response:', JSON.stringify(data, null, 2));
  return data;
}

async function searchProperties(token) {
  console.log('\\nBuscando imóveis com token:', token?.substring(0, 20) + '...');
  const response = await fetch(BASE_URL + '/property/property?page=1&size=10', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Search status:', response.status);
  const data = await response.json();
  console.log('Data count:', data.data?.length);
  
  if (data.data?.length > 0) {
    console.log('\\nPrimeiros imóveis:');
    data.data.slice(0, 5).forEach((p, i) => {
      console.log(`${i+1}. Ref: ${p.chrReference || 'N/A'}, Inner: ${p.chrInnerReference || 'N/A'}`);
    });
  }
  
  return data;
}

try {
  // Tentar com token existente primeiro
  if (PROPERFY_API_TOKEN) {
    console.log('\\nUsando token existente...');
    await searchProperties(PROPERFY_API_TOKEN);
  }
  
  // Fazer login para obter novo token
  const loginResult = await login();
  if (loginResult.access_token || loginResult.token) {
    const newToken = loginResult.access_token || loginResult.token;
    console.log('\\nNovo token obtido!');
    await searchProperties(newToken);
  }
} catch (e) {
  console.error('Error:', e.message);
}
