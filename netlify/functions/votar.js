const MAX_FIELD_LENGTH = 100;

function isValidField(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= MAX_FIELD_LENGTH;
}

function getSupabaseHeaders() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Faltan variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
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

  const cleanAlumno = alumno.trim();
  const cleanPropuesta = propuesta.trim();
  const normalizedAlumno = cleanAlumno.toLowerCase();

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/rest/v1/votes?alumno=eq.${encodeURIComponent(normalizedAlumno)}&select=id`,
      { headers: getSupabaseHeaders() }
    );

    if (!response.ok) {
      const text = await response.text();
      return { statusCode: 500, body: JSON.stringify({ error: "No se pudo comprobar el voto duplicado", detail: text }) };
    }

    const rows = await response.json();
    if (Array.isArray(rows) && rows.length > 0) {
      return { statusCode: 409, body: JSON.stringify({ error: "Ya existe un voto para este alumno/a" }) };
    }

    const insertResp = await fetch(`${supabaseUrl}/rest/v1/votes`, {
      method: "POST",
      headers: getSupabaseHeaders(),
      body: JSON.stringify({ alumno: cleanAlumno, propuesta: cleanPropuesta }),
    });

    if (!insertResp.ok) {
      const text = await insertResp.text();
      return { statusCode: 400, body: JSON.stringify({ error: "No se pudo guardar el voto", detail: text }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error de conexión con Supabase", detail: error.message }),
    };
  }
};
