import { proposals } from "./proposals.js?v=9";

const tabsEl = document.getElementById("tabs");
const panelsEl = document.getElementById("proposal-panels");
const fieldsetEl = document.getElementById("propuesta-fieldset");
const overlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalFoto = document.getElementById("modal-foto");
const modalBoceto = document.getElementById("modal-boceto");
const modalTexto = document.getElementById("modal-texto");
const modalClose = document.getElementById("modal-close");
const modalPrev = document.getElementById("modal-prev");
const modalNext = document.getElementById("modal-next");
const videoOverlay = document.getElementById("video-overlay");
const videoPlayer = document.getElementById("video-player");
const videoClose = document.getElementById("video-close");
const voteForm = document.getElementById("vote-form");
const voteSubmit = document.getElementById("vote-submit");
const voteMessage = document.getElementById("vote-message");

let lastFocusedElement = null;
let currentProposal = null;
let currentZonaIndex = 0;

function renderTabs() {
  proposals.forEach((proposal, index) => {
    const button = document.createElement("button");
    button.className = "tab-button";
    button.textContent = proposal.nombre;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    button.dataset.proposalId = proposal.id;
    button.addEventListener("click", () => activateProposal(proposal.id));
    tabsEl.appendChild(button);
  });
}

function renderPanels() {
  proposals.forEach((proposal, index) => {
    const panel = document.createElement("section");
    panel.className = "proposal-panel" + (index === 0 ? " active" : "");
    panel.id = `panel-${proposal.id}`;
    panel.setAttribute("role", "tabpanel");

    if (proposal.historia) {
      const historia = document.createElement("p");
      historia.className = "proposal-historia";
      historia.textContent = proposal.historia;
      panel.appendChild(historia);
    }

    const path = document.createElement("div");
    path.className = "path";

    proposal.zonas.forEach((zona, zonaIndex) => {
      const point = document.createElement("button");
      point.type = "button";
      point.className = "path-point";

      const node = document.createElement("span");
      node.className = "path-point-node";

      const thumb = document.createElement("span");
      thumb.className = "path-point-thumb";
      thumb.style.backgroundImage = `url("${zona.foto}")`;

      const badge = document.createElement("span");
      badge.className = "path-point-badge";
      badge.textContent = String(zonaIndex + 1);

      const label = document.createElement("span");
      label.className = "path-point-label";
      label.textContent = zona.nombre;

      node.append(thumb, badge);
      point.append(node, label);

      if (zona.nota) {
        const nota = document.createElement("span");
        nota.className = "path-point-note";
        nota.textContent = zona.nota;
        point.appendChild(nota);
      }

      point.addEventListener("click", () => openModal(proposal, zonaIndex));
      path.appendChild(point);
    });

    if (proposal.video) {
      const videoButton = document.createElement("button");
      videoButton.type = "button";
      videoButton.className = "video-open-button";
      videoButton.textContent = "🎬 Ver video del recorrido";
      videoButton.addEventListener("click", () => openVideo(proposal.video));
      panel.append(path, videoButton);
    } else {
      panel.append(path);
    }
    panelsEl.appendChild(panel);
  });
}

function renderVoteOptions() {
  proposals.forEach((proposal, index) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "propuesta";
    input.value = proposal.id;
    input.required = true;
    if (index === 0) input.checked = true;
    label.appendChild(input);
    label.append(` ${proposal.nombre}`);
    fieldsetEl.appendChild(label);
  });
}

function activateProposal(proposalId) {
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.setAttribute("aria-selected", String(btn.dataset.proposalId === proposalId));
  });
  document.querySelectorAll(".proposal-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${proposalId}`);
  });
}

function openModal(proposal, zonaIndex) {
  lastFocusedElement = document.activeElement;
  currentProposal = proposal;
  currentZonaIndex = zonaIndex;
  renderModalZona();
  overlay.hidden = false;
  modalClose.focus();
  document.addEventListener("keydown", handleModalKeydown);
}

function renderModalZona() {
  const zona = currentProposal.zonas[currentZonaIndex];
  modalTitle.textContent = `${currentProposal.nombre} — ${zona.nombre}`;
  modalFoto.src = zona.foto;
  modalFoto.alt = `Foto real: ${zona.nombre}`;
  modalBoceto.src = zona.boceto;
  modalBoceto.alt = `Boceto de referencia: ${zona.nombre}`;
  modalTexto.textContent = zona.texto;
}

function showRelativeZona(offset) {
  const total = currentProposal.zonas.length;
  currentZonaIndex = (currentZonaIndex + offset + total) % total;
  renderModalZona();
}

function closeModal() {
  overlay.hidden = true;
  document.removeEventListener("keydown", handleModalKeydown);
  if (lastFocusedElement) lastFocusedElement.focus();
}

function handleModalKeydown(event) {
  if (event.key === "Escape") {
    closeModal();
    return;
  }
  if (event.key === "ArrowRight") {
    showRelativeZona(1);
    return;
  }
  if (event.key === "ArrowLeft") {
    showRelativeZona(-1);
    return;
  }
  if (event.key === "Tab") {
    const focusable = overlay.querySelectorAll("button, img[tabindex]");
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

modalClose.addEventListener("click", closeModal);
modalPrev.addEventListener("click", () => showRelativeZona(-1));
modalNext.addEventListener("click", () => showRelativeZona(1));
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeModal();
});

function openVideo(src) {
  videoPlayer.src = src;
  videoOverlay.hidden = false;
  videoPlayer.play();
}

function closeVideo() {
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  videoOverlay.hidden = true;
}

videoClose.addEventListener("click", closeVideo);
videoOverlay.addEventListener("click", (event) => {
  if (event.target === videoOverlay) closeVideo();
});

function votoKey(alumno) {
  return alumno.trim().toLowerCase();
}

voteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const alumno = document.getElementById("alumno-nombre").value;
  const propuesta = voteForm.querySelector('input[name="propuesta"]:checked')?.value;

  if (!alumno.trim() || !propuesta) {
    voteMessage.textContent = "Completa todos los campos antes de votar.";
    return;
  }

  // Aviso rápido en este dispositivo; el servidor es quien decide de verdad.
  const localKey = `voto-tunel-terror:${votoKey(alumno)}`;
  if (localStorage.getItem(localKey)) {
    voteMessage.textContent = "Ya registramos un voto para este alumno/a desde este dispositivo.";
    return;
  }

  voteSubmit.disabled = true;
  voteMessage.textContent = "Enviando voto…";

  try {
    const response = await fetch("/.netlify/functions/votar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumno, propuesta }),
    });

    const data = await response.json();

    if (response.status === 409) {
      voteMessage.textContent = "Ya se registró un voto para este alumno/a. Gracias.";
    } else if (!response.ok) {
      voteMessage.textContent = data.error || "No se pudo registrar el voto, inténtalo de nuevo.";
      voteSubmit.disabled = false;
      return;
    } else {
      localStorage.setItem(localKey, "1");
      voteMessage.textContent = "¡Gracias por tu voto!";
      voteForm.reset();
    }
  } catch (err) {
    voteMessage.textContent = "Error de conexión, inténtalo de nuevo.";
    voteSubmit.disabled = false;
    return;
  }

  voteSubmit.disabled = false;
});

renderTabs();
renderPanels();
renderVoteOptions();
