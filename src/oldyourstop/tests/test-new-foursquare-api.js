// Test NEW Foursquare Places API
const NEW_API_KEY = '440NCDFOJ3W4PNMCZELKXYDVA4HAYZDDJXED';
const NEW_BASE_URL = 'https://places-api.foursquare.com/v1/places/search';
const API_VERSION = '2023-06-15';

async function testNewFoursquareAPI() {
  console.log('🔥 Testing NEW Foursquare Places API');
  console.log('=====================================');
  console.log('🔑 API Key:', NEW_API_KEY.substring(0, 10) + '...');
  console.log('🌐 Base URL:', NEW_BASE_URL);
  console.log('📅 API Version:', API_VERSION);
  
  // Test the new API endpoint
  const params = new URLSearchParams({
    ll: '51.5074,-0.1278', // London coordinates
    radius: '10000',
    limit: '5',
    categories: '13000' // Restaurant category
  });
  
  const url = `${NEW_BASE_URL}?${params.toString()}`;
  console.log('\n📡 Testing URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${NEW_API_KEY}`,
        'X-Places-Api-Version': API_VERSION
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Status Text: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📄 Response Length: ${responseText.length} characters`);
    
    if (response.ok) {
      console.log('✅ SUCCESS! New Foursquare API is working!');
      
      try {
        const data = JSON.parse(responseText);
        console.log(`🏪 Found ${data.results?.length || 0} restaurants`);
        
        if (data.results && data.results.length > 0) {
          console.log('\n📋 Sample Restaurant:');
          const restaurant = data.results[0];
          console.log(`   🏪 Name: ${restaurant.name}`);
          console.log(`   📍 Address: ${restaurant.location?.formatted_address || 'N/A'}`);
          console.log(`   🏷️ Categories: ${restaurant.categories?.map(c => c.name).join(', ') || 'N/A'}`);
          console.log(`   ⭐ Rating: ${restaurant.rating || 'N/A'}`);
          console.log(`   🔗 FSQ ID: ${restaurant.fsq_id}`);
        }
        
        console.log('\n🎉 NEW FOURSQUARE API IS WORKING!');
        console.log('✅ Your enhancement layer can now be fully activated!');
        
      } catch (parseError) {
        console.log('⚠️ Response is not JSON, but API responded successfully');
        console.log('📄 Raw response:', responseText.substring(0, 200) + '...');
      }
    } else {
      console.log('❌ API Error');
      console.log('📄 Error Response:', responseText.substring(0, 300));
      
      if (response.status === 401) {
        console.log('🔑 Authentication issue - check API key');
      } else if (response.status === 403) {
        console.log('🚫 Permission issue - check API permissions');
      } else if (response.status === 404) {
        console.log('🔍 Endpoint not found - check URL');
      }
    }
    
  } catch (error) {
    console.log('💥 Network Error:', error.message);
  }
  
  console.log('\n🎯 Next Steps:');
  if (response && response.ok) {
    console.log('1. ✅ Update your API route with new endpoint');
    console.log('2. ✅ Test the enhanced restaurant display');
    console.log('3. ✅ Activate Foursquare enhancement layer');
  } else {
    console.log('1. 🔍 Verify API key is correct');
    console.log('2. 🔍 Check Foursquare developer console');
    console.log('3. 🔍 Ensure API permissions are set');
  }
}

testNewFoursquareAPI().catch(console.error);
