// Test script for Foursquare API key validation
// Run this to check if your Foursquare API key is working: node test-foursquare-api.js

// Check if environment variables are loaded
require('dotenv').config({ path: './frontend/.env.local' });

const API_KEY = process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY || 'fsq3LKhR90hXrY+F1hMSMJd8VlbVlWdwg';

async function testFoursquareAPI() {
  console.log('🔍 Testing Foursquare API key...');
  console.log('🔑 API Key found:', API_KEY ? 'YES' : 'NO');
  console.log('🔑 API Key length:', API_KEY ? API_KEY.length : 0);
  console.log('🔑 API Key preview:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Not found');
  
  if (!API_KEY || API_KEY === 'your_foursquare_api_key_here') {
    console.log('❌ Foursquare API key not configured or still has placeholder value');
    console.log('📝 Please add your real Foursquare API key to .env.local:');
    console.log('   NEXT_PUBLIC_FOURSQUARE_API_KEY=your_actual_foursquare_api_key');
    return;
  }

  try {
    console.log('🌐 Testing API call to Foursquare...');
    const url = 'https://api.foursquare.com/v3/places/search?ll=51.5074,-0.1278&radius=1000&categories=13000&limit=5';
    
    const response = await fetch(url, {
      headers: {
        'Authorization': API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Foursquare API key is working!');
      console.log(`📊 Found ${data.results?.length || 0} restaurants`);
      
      if (data.results && data.results.length > 0) {
        console.log('🏪 Sample restaurant:', data.results[0].name);
        console.log('📍 Sample location:', data.results[0].location?.formatted_address);
        console.log('🏷️ Sample categories:', data.results[0].categories?.map(c => c.name).join(', '));
      }
    } else {
      const error = await response.json();
      console.log('❌ API key test failed:');
      console.log('Status:', response.status);
      console.log('Error:', error);
      
      if (response.status === 401) {
        console.log('🔑 This usually means the API key is invalid or expired');
      } else if (response.status === 403) {
        console.log('🚫 This usually means the API key doesn\'t have permission for this endpoint');
      } else if (response.status === 429) {
        console.log('⏰ Rate limit exceeded - try again later');
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the test
testFoursquareAPI();
