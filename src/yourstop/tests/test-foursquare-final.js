// Final Foursquare API test with the correct key
const API_KEY = 'fsq3LKhR90hXrY+F1hMSMJd8VlbVlWdwgEfP/+FNfKObRA4=';

async function testFoursquareAPI() {
  console.log('🔥 FINAL Foursquare API Test');
  console.log('============================');
  console.log('🔑 API Key:', API_KEY.substring(0, 20) + '...');
  console.log('🔑 Key length:', API_KEY.length);
  console.log('🔑 Starts with fsq3:', API_KEY.startsWith('fsq3'));
  
  // Test different endpoints and methods
  const tests = [
    {
      name: 'Places Search (v3)',
      url: 'https://api.foursquare.com/v3/places/search?ll=51.5074,-0.1278&categories=13000&limit=5',
      headers: { 'Authorization': API_KEY, 'Accept': 'application/json' }
    },
    {
      name: 'Places Nearby (v3)',
      url: 'https://api.foursquare.com/v3/places/nearby?ll=51.5074,-0.1278&categories=13000&limit=5',
      headers: { 'Authorization': API_KEY, 'Accept': 'application/json' }
    },
    {
      name: 'Places Search with Bearer',
      url: 'https://api.foursquare.com/v3/places/search?ll=51.5074,-0.1278&categories=13000&limit=5',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
    }
  ];

  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📡 URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: test.headers
      });

      console.log(`📊 Status: ${response.status}`);
      
      const responseText = await response.text();
      console.log(`📄 Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      if (response.ok) {
        console.log('✅ SUCCESS! This method works!');
        try {
          const data = JSON.parse(responseText);
          console.log(`🏪 Found ${data.results?.length || 0} places`);
          if (data.results?.[0]) {
            console.log(`📍 Sample: ${data.results[0].name}`);
          }
        } catch (e) {
          console.log('📄 Response is not JSON');
        }
        break; // Stop on first success
      } else {
        console.log('❌ Failed');
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Conclusion:');
  console.log('If all tests failed, the API key might be invalid or Foursquare API has changed.');
  console.log('Your system will continue working with Google Places + OpenStreetMap data.');
}

testFoursquareAPI().catch(console.error);
