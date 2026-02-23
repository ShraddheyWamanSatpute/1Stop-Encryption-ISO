// Test Yelp API Integration
const BASE_URL = 'http://localhost:9002';

async function testYelpIntegration() {
  console.log('🔥 Testing Yelp API Integration');
  console.log('================================\n');

  // Test 1: Direct Yelp API Route
  console.log('1️⃣ Testing Direct Yelp API Route:');
  try {
    const response = await fetch(`${BASE_URL}/api/yelp/search?limit=3&categories=restaurants`);
    const data = await response.json();
    
    if (response.ok && data.results) {
      console.log(`✅ Yelp API working: ${data.results.length} restaurants found`);
      console.log(`📊 Total available: ${data.total}`);
      console.log(`📍 Sample restaurant: ${data.results[0]?.name || 'N/A'}`);
      console.log(`⭐ Sample rating: ${data.results[0]?.rating || 'N/A'}`);
      console.log(`💬 Sample reviews: ${data.results[0]?.reviewCount || 'N/A'}`);
    } else {
      console.log('⚠️ Yelp API not configured or having issues');
      console.log(`📄 Response: ${JSON.stringify(data).substring(0, 200)}...`);
    }
  } catch (error) {
    console.error('❌ Error testing Yelp API:', error.message);
  }

  // Test 2: Enhanced Restaurant API with Yelp
  console.log('\n2️⃣ Testing Enhanced Restaurant API (with Yelp):');
  try {
    const response = await fetch(`${BASE_URL}/api/enhanced-restaurants?limit=5`);
    const data = await response.json();
    
    console.log(`✅ Enhanced API Response Time: ${data.searchTime || 0}ms`);
    console.log(`🔧 Active Services: ${Object.keys(data.enhancements || {}).join(', ')}`);
    
    if (data.restaurants && data.restaurants.length > 0) {
      const yelpRestaurants = data.restaurants.filter(r => r.dataSource?.primary === 'yelp');
      console.log(`🔥 Yelp-sourced restaurants: ${yelpRestaurants.length}`);
      
      if (yelpRestaurants.length > 0) {
        const sample = yelpRestaurants[0];
        console.log(`\n📋 Sample Yelp Restaurant:`);
        console.log(`   🏪 Name: ${sample.name}`);
        console.log(`   ⭐ Rating: ${sample.rating}`);
        console.log(`   💬 Reviews: ${sample.reviewCount || 0}`);
        console.log(`   💰 Price: ${sample.priceRange || 'N/A'}`);
        console.log(`   🔗 Yelp Enhanced: ${sample.yelpData ? 'YES' : 'NO'}`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing enhanced API:', error.message);
  }

  // Test 3: Multi-Source Data Integration
  console.log('\n3️⃣ Testing Multi-Source Data Integration:');
  try {
    const response = await fetch(`${BASE_URL}/api/restaurants?limit=10`);
    const data = await response.json();
    
    if (data.restaurants) {
      const sources = {};
      data.restaurants.forEach(restaurant => {
        const source = restaurant.dataSource?.primary || 'unknown';
        sources[source] = (sources[source] || 0) + 1;
      });
      
      console.log('📊 Data Sources Distribution:');
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} restaurants`);
      });
      
      const yelpCount = sources['yelp'] || 0;
      if (yelpCount > 0) {
        console.log(`\n🎉 SUCCESS: Yelp integration working! ${yelpCount} restaurants from Yelp`);
      } else {
        console.log(`\n⚠️ No Yelp restaurants found - check API key configuration`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing multi-source integration:', error.message);
  }

  // Test 4: Yelp-specific Features
  console.log('\n4️⃣ Testing Yelp-specific Features:');
  try {
    const response = await fetch(`${BASE_URL}/api/yelp/search?limit=1&open_now=true&price=2`);
    const data = await response.json();
    
    if (response.ok && data.results && data.results.length > 0) {
      const restaurant = data.results[0];
      console.log('✅ Yelp advanced features working:');
      console.log(`   🏪 Name: ${restaurant.name}`);
      console.log(`   🕐 Open Now: ${restaurant.isOpen ? 'YES' : 'NO'}`);
      console.log(`   💰 Price Level: ${restaurant.priceRange}`);
      console.log(`   📍 Distance: ${restaurant.distance}m`);
      console.log(`   🏷️ Categories: ${restaurant.categories?.map(c => c.title).join(', ') || 'N/A'}`);
    } else {
      console.log('⚠️ Yelp advanced features not available');
    }
  } catch (error) {
    console.error('❌ Error testing Yelp features:', error.message);
  }

  console.log('\n🎯 Summary:');
  console.log('✅ If Yelp API key is configured, you now have:');
  console.log('   • Enhanced review data from Yelp');
  console.log('   • Better restaurant ratings and photos');
  console.log('   • Advanced filtering (price, open now, etc.)');
  console.log('   • Multi-source data reliability');
  console.log('\n⚠️ If Yelp is not working:');
  console.log('   • Your system continues with Google Places + OpenStreetMap');
  console.log('   • No impact on website functionality');
  console.log('   • Add Yelp API key when ready for enhancement');
}

testYelpIntegration().catch(console.error);
