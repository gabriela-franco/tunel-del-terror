const MAX_FIELD_LENGTH = 100;
const STORE_KEY = "__tunel_votos_store__";

function getVotesStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = new Map();
  }
  return globalThis[STORE_KEY];
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

  if (store.has(key)) {
    return { statusCode: 409, body: JSON.stringify({ error: "Ya existe un voto para este alumno/a" }) };
  }

  store.set(key, {
    alumno: alumno.trim(),
    propuesta: propuesta.trim(),
    timestamp: new Date().toISOString(),
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
