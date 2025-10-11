const { MongoClient } = require("mongodb");

let client;
let db;

async function connectToDatabase() {
  if (db) {
    return { client, db };
  }

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB_NAME || "quizapp";

  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");

    db = client.db(dbName);

    // Create indexes for better performance
    await db.collection("rooms").createIndex({ roomCode: 1 }, { unique: true });
    await db
      .collection("rooms")
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Auto-delete after 24 hours (backup cleanup)

    // Create indexes for quiz history
    await db
      .collection("quizHistory")
      .createIndex({ userId: 1, completedAt: -1 });
    await db.collection("quizHistory").createIndex({ "metadata.source": 1 });

    return { client, db };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

async function getRoomsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("rooms");
}

async function getQuizHistoryCollection() {
  const { db } = await connectToDatabase();
  return db.collection("quizHistory");
}

async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection("users");
}

module.exports = {
  connectToDatabase,
  getRoomsCollection,
  getQuizHistoryCollection,
  getUsersCollection,
};
