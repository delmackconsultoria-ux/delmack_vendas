// Usar fetch nativo do Node.js 18+

const API_URL = process.env.PROPERFY_API_URL || "https://adm.baggioimoveis.com.br/api";
const API_TOKEN = process.env.PROPERFY_API_TOKEN || "";

async function testCardsAPI() {
  console.log("🔍 Testing Properfy Cards API...");
  console.log(`API URL: ${API_URL}`);
  console.log(`Token length: ${API_TOKEN.length}`);
  
  try {
    const url = `${API_URL}/crm/card?page=1&size=10`;
    console.log(`\n📡 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
    
    console.log(`\n✅ Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log(`\n📝 Response length: ${text.length} chars`);
    console.log(`First 1000 chars:\n${text.substring(0, 1000)}`);
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log(`\n✅ Valid JSON!`);
      console.log(`Top-level keys: ${Object.keys(data).join(", ")}`);
      console.log(`Full structure (first 2000 chars):\n${JSON.stringify(data, null, 2).substring(0, 2000)}`);
      
      if (data.data) {
        console.log(`\n📊 data.data type: ${typeof data.data}`);
        console.log(`data.data is array: ${Array.isArray(data.data)}`);
        if (Array.isArray(data.data)) {
          console.log(`data.data length: ${data.data.length}`);
          if (data.data.length > 0) {
            console.log(`First item keys: ${Object.keys(data.data[0]).join(", ")}`);
            console.log(`First item:\n${JSON.stringify(data.data[0], null, 2)}`);
          }
        }
      } else {
        console.log(`\n⚠️ No 'data' field in response!`);
        console.log(`Available fields: ${Object.keys(data).join(", ")}`);
      }
    } catch (parseError) {
      console.log(`\n❌ Not valid JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

testCardsAPI();
