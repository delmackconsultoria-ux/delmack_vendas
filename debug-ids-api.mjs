// Usar fetch nativo do Node.js 18+

const API_URL = process.env.PROPERFY_API_URL || "https://adm.baggioimoveis.com.br/api";
const API_TOKEN = process.env.PROPERFY_API_TOKEN || "";

async function testCardsAPI() {
  console.log("🔍 Testing Properfy Cards IDs API...");
  console.log(`API URL: ${API_URL}`);
  
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
    
    const text = await response.text();
    console.log(`\n📝 Response length: ${text.length} chars`);
    console.log(`First 500 chars:\n${text.substring(0, 500)}`);
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      console.log(`\n✅ Valid JSON!`);
      console.log(`Type: ${typeof data}`);
      console.log(`Is array: ${Array.isArray(data)}`);
      
      if (Array.isArray(data)) {
        console.log(`\n📊 Array length: ${data.length}`);
        console.log(`First 5 items:`);
        for (let i = 0; i < Math.min(5, data.length); i++) {
          console.log(`  [${i}]: ${JSON.stringify(data[i])} (type: ${typeof data[i]})`);
        }
      } else {
        console.log(`\n📊 Object keys: ${Object.keys(data).join(", ")}`);
        console.log(`Full structure:\n${JSON.stringify(data, null, 2).substring(0, 1000)}`);
      }
    } catch (parseError) {
      console.log(`\n❌ Not valid JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

testCardsAPI();
