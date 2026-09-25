const { getStore } = require("@netlify/blobs");

const MAX_FIELD_LENGTH = 100;

function getVotesStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (siteID && token) {
    return getStore("votos-tunel-terror", { siteID, token });
  }

  return getStore("votos-tunel-terror");
}

function isValidField(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= MAX_FIELD_LENGTH;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  const { alumno, propuesta } = payload;

  if (!isValidField(alumno) || !isValidField(propuesta)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos o son inválidos" }) };
  }

  // Clave normalizada para detectar el mismo alumno/familia con distintas mayúsculas/espacios.
  const key = alumno.trim().toLowerCase();
  const store = getVotesStore();

  const existing = await store.get(key);
  if (existing) {
    return { statusCode: 409, body: JSON.stringify({ error: "Ya existe un voto para este alumno/a" }) };
  }

  await store.setJSON(key, {
    alumno: alumno.trim(),
    propuesta: propuesta.trim(),
    timestamp: new Date().toISOString(),
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
