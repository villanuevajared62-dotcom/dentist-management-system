const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testAPI() {
  console.log('Testing Admin Portal API on port 3004...\n');
  
  try {
    // Test 1: Get users
    console.log('Test 1: GET /api/users');
    const usersRes = await axios.get(`${BASE_URL}/api/users`);
    console.log('Status:', usersRes.status);
    console.log('Users:', usersRes.data.data?.length || 0);
    
    // Test 2: Get branches
    console.log('\nTest 2: GET /api/branches');
    const branchesRes = await axios.get(`${BASE_URL}/api/branches`);
    console.log('Status:', branchesRes.status);
    console.log('Branches:', branchesRes.data.data?.length || 0);
    
    console.log('\n✅ API tests passed!');
  } catch (err) {
    console.log('❌ Error:', err.response?.status, err.response?.data?.message || err.message);
  }
}

testAPI();

