import { MongoClient } from 'mongodb';

// Cached across requests within the same Worker isolate. Cold starts pay the
// connection cost once; warm isolates reuse the open connection.
let clientPromise;

function getClient(env) {
  if (!clientPromise) {
    const client = new MongoClient(env.MONGODB_URI);
    clientPromise = client.connect().catch((err) => {
      clientPromise = undefined; // allow retry on next request if connect failed
      throw err;
    });
  }
  return clientPromise;
}

export async function getAdminsCollection(env) {
  const client = await getClient(env);
  return client.db().collection('admins');
}
