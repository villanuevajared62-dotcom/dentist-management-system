const axios = require('axios');

async function testLogin() {
  try {
    // Use withCredentials to follow redirects and get session
    const res = await axios.post('http://localhost:3003/api/auth/signin', 
      {
        email: 'admin@ilovedentist.com',
        password: 'Admin1234!'
      },
      {
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      }
    );
    console.log('✅ Login response status:', res.status);
    console.log('Response:', res.data);
    
    // Try to get session
    const sessionRes = await axios.get('http://localhost:3003/api/auth/session');
    console.log('✅ Session:', sessionRes.data);
  } catch (err) {
    console.log('❌ Login error:', err.response?.data || err.message);
  }
}

testLogin();

