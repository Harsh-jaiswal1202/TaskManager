// Script to get valid user IDs from the database
const axios = require('axios');

async function getUsers() {
  try {
    console.log('🔍 Fetching users from database...');
    
    // Try to get users - we might need to check the API endpoint
    const response = await axios.get('http://localhost:3001/api/user/all');
    const users = response.data;
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Username: ${user.username || user.displayName || 'Unnamed'}`);
    });
    
    if (users.length > 0) {
      console.log(`\n✅ Using first user ID for testing: ${users[0]._id}`);
      return users[0]._id;
    } else {
      console.log('❌ No users found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching users:', error.response?.data || error.message);
    console.log('Trying alternative endpoint...');
    
    // Try alternative endpoint if the first one fails
    try {
      const response2 = await axios.get('http://localhost:3001/api/user');
      console.log('Alternative endpoint response:', response2.data);
    } catch (error2) {
      console.error('Alternative endpoint also failed:', error2.response?.data || error2.message);
    }
    
    return null;
  }
}

getUsers();
