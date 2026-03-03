/**
 * MongoDB Atlas Data API (HTTP). Use quando MONGODB_URI der erro SSL no Vercel.
 * Requer: MONGODB_DATA_API_APP_ID, MONGODB_DATA_API_KEY
 * Opcional: MONGODB_DATA_SOURCE (default "mongodb-atlas")
 */

const DATA_SOURCE = process.env.MONGODB_DATA_SOURCE || "mongodb-atlas";
const DATABASE = "avimor";
const COLLECTION = "pedidos";

function getDataApiConfig(): { appId: string; apiKey: string } | null {
  const appId = process.env.MONGODB_DATA_API_APP_ID;
  const apiKey = process.env.MONGODB_DATA_API_KEY;
  if (!appId || !apiKey) return null;
  return { appId, apiKey };
}

async function dataApiRequest<T>(appId: string, apiKey: string, action: string, body: object): Promise<T> {
  const url = `https://data.mongodb-api.com/app/${appId}/endpoint/data/v1/action/${action}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "apiKey": apiKey,
    },
    body: JSON.stringify({
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: COLLECTION,
      ...body,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Data API ${action} failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function dataApiFind(filter: object, sort?: object, limit = 100, collection = COLLECTION): Promise<unknown[]> {
  const config = getDataApiConfig();
  if (!config) throw new Error("MONGODB_DATA_API_APP_ID e MONGODB_DATA_API_KEY são obrigatórios para a Data API.");

  const body: { filter: object; sort?: object; limit: number } = { filter, limit };
  if (sort && Object.keys(sort).length > 0) body.sort = sort;

  const result = await dataApiRequest<{ documents: unknown[] }>(config.appId, config.apiKey, "find", { ...body, collection });
  return result.documents || [];
}

export async function dataApiUpdateOne(
  filter: object,
  update: object,
  upsert = false,
  collection = COLLECTION
): Promise<{ modifiedCount: number; upsertedCount?: number }> {
  const config = getDataApiConfig();
  if (!config) throw new Error("MONGODB_DATA_API_APP_ID e MONGODB_DATA_API_KEY são obrigatórios para a Data API.");
  const result = await dataApiRequest<{ modifiedCount: number; upsertedCount?: number }>(
    config.appId,
    config.apiKey,
    "updateOne",
    { filter, update: { $set: update }, upsert, collection }
  );
  return result;
}

export async function dataApiInsertOne(document: object): Promise<{ insertedId: string }> {
  const config = getDataApiConfig();
  if (!config) throw new Error("MONGODB_DATA_API_APP_ID e MONGODB_DATA_API_KEY são obrigatórios para a Data API.");

  const result = await dataApiRequest<{ insertedId: string | { $oid: string } }>(config.appId, config.apiKey, "insertOne", {
    document,
  });
  const id = typeof result.insertedId === "string"
    ? result.insertedId
    : result.insertedId?.$oid ?? "";
  return { insertedId: id };
}

export function isDataApiConfigured(): boolean {
  return !!(
    process.env.MONGODB_DATA_API_APP_ID &&
    process.env.MONGODB_DATA_API_KEY
  );
}
