require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Dentist = require('./src/models/Dentist').default;
  const Appointment = require('./src/models/Appointment').default;
  
  // Get all dentists
  const dentists = await Dentist.find().populate('userId', 'name email');
  console.log('=== DENTISTS ===');
  dentists.forEach(d => {
    console.log(`ID: ${d._id}`);
    console.log(`  User: ${d.userId?.name} (${d.userId?.email})`);
    console.log(`  UserID: ${d.userId?._id}`);
  });
  
  // Get all appointments
  const appointments = await Appointment.find().populate('dentistId');
  console.log('\n=== APPOINTMENTS ===');
  appointments.forEach(a => {
    console.log(`ID: ${a._id}`);
    console.log(`  DentistID in appointment: ${a.dentistId}`);
    console.log(`  Dentist populated: ${JSON.stringify(a.dentistId)}`);
    console.log(`  Date: ${a.date}, Time: ${a.startTime}`);
  });
  
  await mongoose.disconnect();
}

test();

