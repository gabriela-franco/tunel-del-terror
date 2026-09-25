const { getStore } = require("@netlify/blobs");

// Solo accesible con la clave secreta configurada en RESULTS_KEY (Netlify > Environment variables).
// No se enlaza desde la interfaz de los padres para no sesgar el voto.
exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const providedKey = event.queryStringParameters?.key;
  const expectedKey = process.env.RESULTS_KEY;

  if (!expectedKey || providedKey !== expectedKey) {
    return { statusCode: 403, body: JSON.stringify({ error: "No autorizado" }) };
  }

  const store = getStore("votos-tunel-terror");
  const { blobs } = await store.list();

  const counts = {};
  let total = 0;

  for (const blob of blobs) {
    const voto = await store.get(blob.key, { type: "json" });
    if (!voto) continue;
    counts[voto.propuesta] = (counts[voto.propuesta] || 0) + 1;
    total += 1;
  }

  return { statusCode: 200, body: JSON.stringify({ total, counts }) };
};
