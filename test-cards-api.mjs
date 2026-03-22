const PROPERFY_API_URL = process.env.PROPERFY_API_URL || "https://adm.baggioimoveis.com.br/api";
const PROPERFY_API_TOKEN = process.env.PROPERFY_API_TOKEN || "";

console.log("=== Testing Properfy Cards API ===");
console.log("API URL:", PROPERFY_API_URL);
console.log("Token length:", PROPERFY_API_TOKEN?.length || 0);

async function testAPI() {
  try {
    const url = `${PROPERFY_API_URL}/crm/card?page=1&size=100`;
    console.log("\nFetching:", url);
    console.log("Timeout: 60 seconds");
    
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      console.log("Timeout reached, aborting...");
      controller.abort();
    }, 60000);
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PROPERFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    console.log("Status:", response.status);
    console.log("Response received!");
    
    const data = await response.json();
    console.log("Response keys:", Object.keys(data).join(", "));
    
    if (data.data) {
      console.log(`Total cards in response: ${data.data.length}`);
      if (data.data.length > 0) {
        console.log("First card:", JSON.stringify(data.data[0], null, 2));
      }
    } else {
      console.log("Full response:", JSON.stringify(data, null, 2).substring(0, 500));
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("Request timeout!");
    } else {
      console.error("Error:", error.message);
    }
  }
}

testAPI();
