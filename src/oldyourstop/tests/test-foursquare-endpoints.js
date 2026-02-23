// Test Different Foursquare API Endpoints
const API_KEY = '440NCDFOJ3W4PNMCZELKXYDVA4HAYZDDJXED';
const API_VERSION = '2023-06-15';

async function testFoursquareEndpoints() {
  console.log('🔍 Testing Different Foursquare API Endpoints');
  console.log('==============================================');
  
  const endpoints = [
    {
      name: 'Places API v1 - search',
      url: 'https://places-api.foursquare.com/v1/places/search'
    },
    {
      name: 'Places API v1 - nearby',
      url: 'https://places-api.foursquare.com/v1/places/nearby'
    },
    {
      name: 'Main API v3 - search',
      url: 'https://api.foursquare.com/v3/places/search'
    },
    {
      name: 'Main API v3 - nearby',
      url: 'https://api.foursquare.com/v3/places/nearby'
    },
    {
      name: 'Places API root',
      url: 'https://places-api.foursquare.com/v1/places'
    }
  ];
  
  const params = new URLSearchParams({
    ll: '51.5074,-0.1278',
    radius: '1000',
    limit: '3'
  });
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`📡 URL: ${endpoint.url}?${params.toString()}`);
    
    try {
      const response = await fetch(`${endpoint.url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-Places-Api-Version': API_VERSION
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      const responseText = await response.text();
      console.log(`📄 Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
      
      if (response.ok) {
        console.log('✅ SUCCESS! This endpoint works!');
        try {
          const data = JSON.parse(responseText);
          console.log(`🏪 Found ${data.results?.length || data.length || 0} results`);
        } catch (e) {
          console.log('📄 Response is not JSON');
        }
        break; // Stop on first success
      }
      
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Conclusion:');
  console.log('If no endpoints worked, the API key might need different authentication or the API structure has changed.');
  console.log('Check Foursquare developer documentation for the latest API format.');
}

testFoursquareEndpoints().catch(console.error);
