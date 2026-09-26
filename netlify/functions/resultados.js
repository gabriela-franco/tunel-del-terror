function getSupabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta SUPABASE_URL" }) };
  }

  const { admin, key } = event.queryStringParameters || {};
  const expectedKey = process.env.ADMIN_KEY || "admin-123";

  try {
    if (admin === "true" && key === expectedKey) {
      const response = await fetch(`${supabaseUrl}/rest/v1/votes?select=alumno,propuesta,created_at&order=created_at.desc`, {
        headers: getSupabaseHeaders(),
      });

      if (!response.ok) {
        const text = await response.text();
        return { statusCode: 500, body: JSON.stringify({ error: "No se pudo leer la base de datos", detail: text }) };
      }

      const rows = await response.json();
      return { statusCode: 200, body: JSON.stringify(rows) };
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/votes?select=propuesta`, {
      headers: getSupabaseHeaders(),
    });

    if (!response.ok) {
      const text = await response.text();
      return { statusCode: 500, body: JSON.stringify({ error: "No se pudo leer la base de datos", detail: text }) };
    }

    const rows = await response.json();
    const counts = {};
    let total = 0;

    for (const row of rows || []) {
      const proposal = row.propuesta;
      counts[proposal] = (counts[proposal] || 0) + 1;
      total += 1;
    }

    return { statusCode: 200, body: JSON.stringify({ total, counts }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error de conexión con Supabase", detail: error.message }),
    };
  }
};
