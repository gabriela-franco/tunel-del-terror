const proposalNames = {
  aula_magna: "Aula Magna",
  stranger_things: "Stranger Things",
  orfanato: "Orfanato",
  cosecha: "Cosecha",
  matadero: "Matadero",
  "sala-colectiva": "Cada sala, una historia",
};

const colors = ["#ff4d6d", "#2dd4bf", "#facc15", "#a78bfa", "#38bdf8", "#fb923c", "#f472b6"];
const chart = document.getElementById("votes-chart");
const totalEl = document.getElementById("votes-total");
const legend = document.getElementById("results-legend");
const status = document.getElementById("results-status");
const refreshButton = document.getElementById("refresh-results");

function renderResults(data) {
  const counts = Object.entries(data.counts || {})
    .map(([id, count]) => ({ id, count: Number(count) || 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  const total = Number(data.total) || counts.reduce((sum, item) => sum + item.count, 0);

  totalEl.textContent = String(total);
  legend.replaceChildren();

  if (total === 0 || counts.length === 0) {
    chart.style.setProperty("--chart", "conic-gradient(#42383b 0% 100%)");
    legend.innerHTML = '<li><span class="legend-name">Todavía no hay votos</span><span class="legend-count">0</span><span class="legend-percent">0%</span></li>';
    status.textContent = "Aún no se han registrado votos.";
    return;
  }

  let cumulative = 0;
  const segments = [];

  counts.forEach((item, index) => {
    const start = cumulative;
    cumulative += (item.count / total) * 100;
    const color = colors[index % colors.length];
    const name = proposalNames[item.id] || item.id;
    const percentage = (item.count / total) * 100;
    segments.push(`${color} ${start}% ${cumulative}%`);

    const entry = document.createElement("li");
    const label = document.createElement("span");
    label.className = "legend-name";
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.setProperty("--swatch", color);
    swatch.setAttribute("aria-hidden", "true");
    label.append(swatch, document.createTextNode(name));

    const count = document.createElement("span");
    count.className = "legend-count";
    count.textContent = `${item.count} ${item.count === 1 ? "voto" : "votos"}`;

    const percent = document.createElement("span");
    percent.className = "legend-percent";
    percent.textContent = `${percentage.toLocaleString("es-ES", { maximumFractionDigits: 1 })}%`;

    entry.append(label, count, percent);
    legend.appendChild(entry);
  });

  chart.style.setProperty("--chart", `conic-gradient(${segments.join(", ")})`);
  const summary = counts.map(({ id, count }) => `${proposalNames[id] || id}: ${count}`).join(", ");
  chart.setAttribute("aria-label", `Gráfico circular de ${total} votos. ${summary}.`);
  status.textContent = "Resultados actualizados.";
}

async function loadResults() {
  refreshButton.disabled = true;
  status.textContent = "Cargando resultados…";

  try {
    const response = await fetch("/.netlify/functions/resultados", { cache: "no-store" });
    if (!response.ok) throw new Error(`La API respondió con el estado ${response.status}`);
    renderResults(await response.json());
  } catch (error) {
    status.textContent = "No se pudieron cargar los resultados. Intenta actualizar de nuevo.";
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", loadResults);
loadResults();