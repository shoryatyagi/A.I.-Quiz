const { MongoClient } = require('mongodb');

let client;
let db;

async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB_NAME || 'quizapp';

  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    db = client.db(dbName);
    
    // Create indexes for better performance
    await db.collection('rooms').createIndex({ roomCode: 1 }, { unique: true });
    await db.collection('rooms').createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function getRoomsCollection() {
  const { db } = await connectToDatabase();
  return db.collection('rooms');
}

module.exports = { connectToDatabase, getRoomsCollection };
