import { MongoClient, Db, MongoClientOptions } from "mongodb";

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 15000,
  maxPoolSize: 5,
  minPoolSize: 0,
  // Força IPv4 para evitar erro SSL no Vercel + Atlas (IPv6 pode falhar no handshake TLS)
  family: 4,
};

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.startsWith("mongodb")) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
  if (process.env.NODE_ENV === "development" && global._mongoClientPromise) {
    return global._mongoClientPromise;
  }
  if (!clientPromise) {
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
    if (process.env.NODE_ENV === "development") {
      global._mongoClientPromise = clientPromise;
    }
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const c = await getClientPromise();
  return c.db("avimor");
}
