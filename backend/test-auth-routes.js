/**
 * Simple test script to verify auth handler routes locally
 * Run: node test-auth-routes.js
 */

const { handler } = require('./dist/functions/api/auth');

// Test cases
const testCases = [
  {
    name: 'Health check - root path',
    event: {
      httpMethod: 'GET',
      path: '/',
      headers: {},
      body: null,
    },
  },
  {
    name: 'Health check - /health',
    event: {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      body: null,
    },
  },
  {
    name: 'Health check - /flight-schedule-pro-staging-api',
    event: {
      httpMethod: 'GET',
      path: '/flight-schedule-pro-staging-api',
      headers: {},
      body: null,
    },
  },
  {
    name: 'Login endpoint',
    event: {
      httpMethod: 'POST',
      path: '/login',
      headers: {},
      body: JSON.stringify({ email: 'test@example.com', password: 'test123' }),
    },
  },
  {
    name: 'Unknown route',
    event: {
      httpMethod: 'GET',
      path: '/unknown',
      headers: {},
      body: null,
    },
  },
];

async function runTests() {
  console.log('🧪 Testing Auth Handler Routes\n');
  console.log('='.repeat(60));

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Path: ${testCase.event.path}`);
    console.log(`   Method: ${testCase.event.httpMethod}`);

    try {
      const result = await handler(testCase.event);
      console.log(`   ✅ Status: ${result.statusCode}`);
      
      if (result.body) {
        const body = JSON.parse(result.body);
        console.log(`   Response:`, JSON.stringify(body, null, 2));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests completed!');
}

runTests().catch(console.error);

