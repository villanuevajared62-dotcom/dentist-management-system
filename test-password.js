const bcrypt = require('bcryptjs');

async function testPassword() {
  // Test 1: Original seeded users
  console.log('Testing seeded users:');
  
  const seededPasswords = {
    'Admin1234!': '$2a$12$pB5Pja76QU2QhVT81m4VuO4AEtTEV/UTZDAuWnV4nV8fm9VBbTM7G',
    'Staff1234!': '$2a$12$zAOE//bYj.ju/TuZZ37k6eYb0WQHjf5UICgurrk2YvsiF58eAnMe2',
    'Dentist1234!': '$2a$12$8w3.gdRjuQC7nTLbuatGVesV8ziYwqExYw2PqOi8fNiwagFifuGoW'
  };
  
  for (const [password, hash] of Object.entries(seededPasswords)) {
    const isValid = await bcrypt.compare(password, hash);
    console.log(`  ${password}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  }
  
  // Test 2: Newly created user (we don't know the password but let's test the hash)
  console.log('\nTesting newly created user hash:');
  const newHash = '$2a$12$FDjUOxUFZnYvKE5W6f.AnOivMwt6OvHhFXKyRDq8TOyywVWqFxg52';
  // Try common passwords
  const testPasswords = ['dentist1234', 'Dentist1234!', 'password', '12345678', 'jose123'];
  for (const pwd of testPasswords) {
    const isValid = await bcrypt.compare(pwd, newHash);
    if (isValid) {
      console.log(`  ✅ Found password: ${pwd}`);
      break;
    }
  }
  
  console.log('\nTest complete!');
}

testPassword();

