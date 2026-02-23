// Test script for Yelp API key validation
// Run this after getting your API key: node test-yelp-api.js

const API_KEY = 'YOUR_YELP_API_KEY_HERE'; // Replace with your actual API key

async function testYelpAPI() {
  console.log('🔍 Testing Yelp API key...');
  
  try {
    const response = await fetch('https://api.yelp.com/v3/businesses/search?location=London,UK&categories=restaurants&limit=5', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Yelp API key is working!');
      console.log(`📊 Found ${data.businesses?.length || 0} restaurants`);
      console.log('🏪 Sample restaurant:', data.businesses?.[0]?.name || 'None');
      console.log('⭐ Sample rating:', data.businesses?.[0]?.rating || 'N/A');
    } else {
      const error = await response.json();
      console.log('❌ API key test failed:');
      console.log('Status:', response.status);
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Only run if API key is provided
if (API_KEY && API_KEY !== 'YOUR_YELP_API_KEY_HERE') {
  testYelpAPI();
} else {
  console.log('⚠️  Please replace YOUR_YELP_API_KEY_HERE with your actual Yelp API key');
  console.log('📝 Edit this file and add your API key, then run: node test-yelp-api.js');
}
