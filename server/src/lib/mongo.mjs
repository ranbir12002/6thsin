import { MongoClient } from 'mongodb';

// Cloudflare Workers ties every I/O object (including raw TCP sockets) to the
// request that created it. The MongoDB driver also opens background
// heartbeat/monitoring sockets alongside the main connection, and those
// outlive a single request by design — which caused stray sockets from one
// request to stall a *later* request until the runtime force-killed it
// ("Worker's code had hung"). So: connect fresh and close within the same
// request every time. No caching across requests.
export async function withMongo(env, fn) {
  const client = new MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 1,
    monitorCommands: false,
  });
  try {
    await client.connect();
    return await fn(client.db());
  } finally {
    await client.close().catch(() => {});
  }
}
