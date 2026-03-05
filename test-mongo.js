require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

console.log('Connecting to MongoDB...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB!');
    return mongoose.connection.db.collection('users').find({}).limit(5).toArray();
  })
  .then(users => {
    console.log('Users found:', users.length);
    console.log(users);
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });

