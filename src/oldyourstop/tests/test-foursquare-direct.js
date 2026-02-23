// Direct test of Foursquare Client Secret
// Using proper authentication method for Foursquare Places API v3
const API_KEY = 'fsq3LKhR90hXrY+F1hMSMJd8VlbVlWdwgEfP/+FNfKObRA4='; // Your correct Foursquare API key

async function testFoursquareAPI() {
  console.log('🔍 Testing Foursquare API Key...');
  console.log('🔑 API Key:', API_KEY);
  console.log('🔑 API Key length:', API_KEY.length);
  console.log('🔑 Starts with fsq3:', API_KEY.startsWith('fsq3'));
  
  try {
    console.log('🌐 Making API call to Foursquare Places API v3...');
    
    // Using Authorization header as specified
    console.log('🔧 Using Authorization header method...');
    // Use the new Foursquare Places API endpoint
    const url = 'https://api.foursquare.com/v3/places/nearby?ll=51.5074%2C-0.1278&radius=1000&categories=13000&limit=5';
    
    const headers = {
      'Accept': 'application/json',
      'Authorization': API_KEY // Use the complete API key directly
    };
    
    console.log('📡 Headers:', headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Response body:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Foursquare API key is working!');
      console.log(`📊 Found ${data.results?.length || 0} restaurants`);
      
      if (data.results && data.results.length > 0) {
        console.log('🏪 Sample restaurants:');
        data.results.forEach((restaurant, index) => {
          console.log(`  ${index + 1}. ${restaurant.name}`);
          console.log(`     📍 ${restaurant.location?.formatted_address || 'No address'}`);
          console.log(`     🏷️ ${restaurant.categories?.map(c => c.name).join(', ') || 'No categories'}`);
        });
      }
    } else {
      console.log('❌ API call failed');
      try {
        const error = JSON.parse(responseText);
        console.log('Error details:', error);
      } catch (e) {
        console.log('Raw error response:', responseText);
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testFoursquareAPI();
