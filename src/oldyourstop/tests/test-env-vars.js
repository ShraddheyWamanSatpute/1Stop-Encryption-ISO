// Test environment variables loading
require('dotenv').config({ path: './frontend/.env.local' });

console.log('🔍 Environment Variables Check:');
console.log('NEXT_PUBLIC_FOURSQUARE_API_KEY:', process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY ? 'Found' : 'Not found');
console.log('FOURSQUARE_API_KEY:', process.env.FOURSQUARE_API_KEY ? 'Found' : 'Not found');

if (process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY) {
  console.log('✅ NEXT_PUBLIC_FOURSQUARE_API_KEY length:', process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY.length);
  console.log('✅ First 10 chars:', process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY.substring(0, 10));
}

if (process.env.FOURSQUARE_API_KEY) {
  console.log('✅ FOURSQUARE_API_KEY length:', process.env.FOURSQUARE_API_KEY.length);
  console.log('✅ First 10 chars:', process.env.FOURSQUARE_API_KEY.substring(0, 10));
}

console.log('\n📝 Expected format:');
console.log('NEXT_PUBLIC_FOURSQUARE_API_KEY=ETIR2M2TFXLTVBLXAGBXRIXVRDTWPHCI1IE3NW1RHTUFKGP');
