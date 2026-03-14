import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import {
  getTotalSections,
  getTotalIlots,
  getTotalParcelles,
  getTotalProprietaire,
  getParcellesParSection,
} from "./stat.js";

const SUPABASE_URL = "https://ncpzpejgfzptevbnofgf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcHpwZWpnZnpwdGV2Ym5vZmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODU0NTUsImV4cCI6MjA4MjM2MTQ1NX0.q8wGtvkd8wt4rsVbNNW6OFj8RJLi8nZ6tVYzF0zkKvw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initPage(); // On attend vraiment la fin du chargement
  } catch (error) {
    console.error("Erreur au chargement :", error);
  }
});

async function initPage() {
  const loader = document.getElementById("donneeLoader");
  const content = document.getElementById("donneeContent");

  try {
    await ChargerDonneeIlot(1);
    await initStats();

    loader.style.display = "none";

    content.classList.add("show");
    BtnPagination();
  } catch (error) {
    console.error("Erreur de chargement :", error);
  }
}

async function initStats() {
  const totalSections = await getTotalSections();
  const totalIlots = await getTotalIlots();
  const totalParcelles = await getTotalParcelles();
  const totalProprietaire = await getTotalProprietaire();
  const parcellesParSection = await getParcellesParSection();

  // Injection dans le HTML
  const elSections = document.getElementById("totalSections");
  const elIlots = document.getElementById("totalIlots");
  const elParcelles = document.getElementById("totalParcelles");
  const elProprietaire = document.getElementById("totalPropietaire");

  if (elSections) elSections.textContent = totalSections;
  if (elIlots) elIlots.textContent = totalIlots;
  if (elParcelles) {
    elParcelles.textContent = totalParcelles.toLocaleString();
  }
  if (elParcelles) {
    elProprietaire.textContent = totalProprietaire;
  }

  console.log("Total Sections :", totalSections);
  console.log("Total Ilots :", totalIlots);
  console.log("Total Parcelles :", totalParcelles);
  console.log("Total Proprietaire :", totalProprietaire);
  console.log("Parcelles par section :", parcellesParSection);
}

// charger les données avec pagination

const PAGE_SIZE = 6;
let currentPage = 1;
let totalPages = 1;
let searchQuery = "";
let currentIlotId = null; // utiliser pour l'ajout de la modification

async function ChargerDonneeIlot(page = 1) {
  try {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("abc_ilot")
      .select("*", { count: "exact" })
      .order("fid", { ascending: true });

    // 🔎 Si recherche active
    if (searchQuery.trim() !== "") {
      const value = `%${searchQuery.trim()}%`;

      query = query.or(
        `ILOT.ilike.${value},SECTION.ilike.${value},LOT.ilike.${value},PARCELLE.ilike.${value},SAIF.ilike.${value}`,
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (!data || data.length === 0) {
      const emptyMessage = document.getElementById("emptyMessage");
      emptyMessage.style.display = "flex";
    } else {
      emptyMessage.style.display = "none";
    }

    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    totalPages = Math.ceil(count / PAGE_SIZE);
    currentPage = page;

    renderIlotCards(data);
    renderPagination();

    // recuperer l'index de l'ilot et le sauvegarder dans le bouton voir
    document.addEventListener("click", async function (e) {
      const btn = e.target.closest(".view");
      if (!btn) return;

      const ilotId = btn.dataset.id;
      console.log(ilotId);
      afficherDetailIlot(ilotId);
    });

    // recuperer l'index de l'ilot et le sauvegarder dans le bouton modifier
    document.addEventListener("click", async function (e) {
      const btn = e.target.closest(".edit");
      if (!btn) return;

      const ilotId = btn.dataset.id;
      console.log(ilotId);
      afficherDetailIlot(ilotId);
      

      // Changer le texte du bouton Enregistrer
      document.getElementById("btnSave").textContent = "Enregistrer";
      document.getElementById("btnEdit").style.display = "none";
      
      // Afficher le module
    });
  } catch (err) {
    console.error("Erreur JS :", err.message);
  }
}

// generer les cartes d'ilot

function renderIlotCards(data) {
  const grid = document.getElementById("ilotGrid");
  grid.innerHTML = "";

  data.forEach((ilot) => {
    grid.innerHTML += `
<div class="ilot-card">
            <div class="card-header">
              <div class="ilot-number">
                <span class="number-badge">Îlot ${ilot.ILOT}</span>
                <span class="section-indicator">Section ${ilot.SECTION}</span>
              </div>
              <div class="card-actions">
                <button class="action-btn delete" title="Supprimer l'îlot" data-id="${ilot.fid}">
                  <span class="material-symbols-rounded">delete</span>
                </button>
                <button class="action-btn view" title="Voir l'îlot" data-id="${ilot.fid}" >
                  <span class="material-symbols-rounded">visibility</span>
                </button>                
              </div>
            </div>

            <div class="card-body">
              <div class="ilot-main-info">
                <div class="info-group">
                  <div class="info-label">Superficie totale</div>
                  <div class="info-value">8,3 ha</div>
                </div>
                <div class="info-group">
                  <div class="info-label">Nombre de parcelles</div>
                  <div class="info-value">${ilot.PARCELLE}</div>
                </div>
                <div class="info-group">
                  <div class="info-label">Localisation</div>
                  <div class="info-value">${ilot.SAIF}</div>
                </div>
                <div class="info-group">
                  <div class="info-label">Date création</div>
                  <div class="info-value">2023</div>
                </div>
              </div>

              <div class="ilot-stats">
                <div class="stat-badge">
                  <span class="material-symbols-rounded">crop_square</span>
                  <span>18 parcelles</span>
                </div>
                <div class="stat-badge">
                  <span class="material-symbols-rounded">straighten</span>
                  <span>8,3 ha</span>
                </div>
                <div class="stat-badge">
                  <span class="material-symbols-rounded">pin_drop</span>
                  <span>Est</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="footer-left">
                <span class="material-symbols-rounded">schedule</span>
                <span>Mis à jour: 14 mars 2025</span>
              </div>
              <button class="voir-parcelles">
                Voir le détail
                <span class="material-symbols-rounded">arrow_forward</span>
              </button>
            </div>
          </div>
    `;
  });
}

// gérer l'affichage de la pagination
function renderPagination() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const numbersContainer = document.querySelector(".pagination-numbers");

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;

  numbersContainer.innerHTML = "";

  const maxVisible = 2; // pages autour de la page actuelle

  function createButton(page) {
    const btn = document.createElement("button");
    btn.classList.add("pagination-number");
    btn.textContent = page;

    if (page === currentPage) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      ChargerDonneeIlot(page);
    });

    return btn;
  }

  function createDots() {
    const span = document.createElement("span");
    span.classList.add("pagination-separator");
    span.textContent = "...";
    return span;
  }

  // Toujours afficher page 1
  numbersContainer.appendChild(createButton(1));

  // Dots avant
  if (currentPage - maxVisible > 2) {
    numbersContainer.appendChild(createDots());
  }

  // Pages autour de la page actuelle
  for (
    let i = Math.max(2, currentPage - maxVisible);
    i <= Math.min(totalPages - 1, currentPage + maxVisible);
    i++
  ) {
    numbersContainer.appendChild(createButton(i));
  }

  // Dots après
  if (currentPage + maxVisible < totalPages - 1) {
    numbersContainer.appendChild(createDots());
  }

  // Toujours afficher dernière page si > 1
  if (totalPages > 1) {
    numbersContainer.appendChild(createButton(totalPages));
  }
}

function BtnPagination() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      ChargerDonneeIlot(currentPage - 1);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      ChargerDonneeIlot(currentPage + 1);
    }
  });
}

// charger les détail de l'ilot consulté
async function afficherDetailIlot(id) {
  const { data, error } = await supabase
    .from("abc_ilot")
    .select("*")
    .eq("fid", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }
  currentIlotId = data.fid; //on garde l'id pour l'ajout en cas de modification
  remplirModal(data);
  openParcelleModal();
}

function remplirModal(data) {
  const form = document.getElementById("ilotForm");

  form.numero_ilot.value = data.ILOT || "";
  form.section.value = data.SECTION || "";
  form.saif.value = data.SAIF || "";
  // form.nom_lotissement.value = data.LOTISSEMENT || "";
  // form.ville_commune.value = data.VILLE || "";
}

// enregistrer les modifications
async function enregistrerModif() {
  const form = document.getElementById("ilotForm");
  const now = new Date().toISOString();
  const updatedData = {
    ILOT: form.numero_ilot.value,
    SECTION: form.section.value,
    SAIF: form.saif.value,
    update_at: now,
    // LOTISSEMENT: form.nom_lotissement.value,
    //VILLE: form.ville_commune.value,
  };

  const { error } = await supabase
    .from("abc_ilot")
    .update(updatedData)
    .eq("fid", currentIlotId);

  if (error) {
    console.error("Erreur update :", error.message);
    alert("Erreur lors de la mise à jour");
    return;
  }

  notifications.show(
    "Lilot a été modifié avec succès",
    "success",
    "Ilot modifié",
  );
  //alert("Modification enregistrée avec succès ✅");

  console.log(currentPage);
  ChargerDonneeIlot(currentPage); // 🔥 recharge la liste
}

// ajouter un nouvel ilot
async function SaveIlot() {
  const form = document.getElementById("ilotForm");

  const now = new Date().toISOString(); // 🔥 date actuelle

  const addData = {
    ILOT: form.numero_ilot.value,
    SECTION: form.section.value,
    SAIF: form.saif.value,
    created_at: now,
    update_at: now,
  };

  const { error } = await supabase.from("abc_ilot").insert([addData]);

  if (error) {
    console.error("Erreur insertion :", error.message);
    alert("Erreur lors de l'enregistrement");
    return;
  }

  notifications.show("ilot crée avec succès", "success", "Ilot crée");

  form.reset();
  ChargerDonneeIlot(currentPage);
}

// recherche
const searchInput = document.getElementById("searchIlot");
function debounce(func, delay) {
  let timeout;

  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

searchInput.addEventListener(
  "input",
  debounce((e) => {
    searchQuery = e.target.value.trim();
    currentPage = 1;

    if (searchQuery === "") {
      ChargerDonneeIlot(1);
      return;
    }

    ChargerDonneeIlot(1);
  }, 400),
);

// ======================================================================================================================//
// ======================================================================================================================//
// ===============================Gestion du modales=========================================//

// Variables globales pour le module
let modal = document.getElementById("ilotModal");
let isEditMode = false;

// afficher le module pour Ajout
function openParcelleModal() {
  isEditMode = false;

  // Réinitialiser l'état des champs (verrouillés)
  setInputsReadonly(true);

  // Changer le texte du bouton Enregistrer
  document.getElementById("btnSave").textContent = "Fermer";

  // Afficher le module
  modal.style.display = "block";
}

// afficher le module pour un nouvelle ajout Ajout
function openNewParcelleModal() {
  isEditMode = !isEditMode;
  setInputsReadonly(!isEditMode);

  // Changer le texte du bouton Enregistrer
  document.getElementById("btnSave").textContent = "Enregistrer";
  document.getElementById("btnDelete").style.display = "none";
  // Afficher le module
  modal.style.display = "block";
}

const btnAddIlot = document.getElementById("btnAddIlot");
btnAddIlot.addEventListener("click", () => {
  openNewParcelleModal();
});

// Réinitialiser l'état des champs (verrouillés)
function setInputsReadonly(readonly) {
  const inputs = document.querySelectorAll("#ilotForm input");
  inputs.forEach((input) => {
    input.readOnly = readonly;
    input.style.backgroundColor = readonly ? "#f0f0f0" : "#fff";
    input.style.color = readonly ? "#666" : "#000";
  });
}

// Événements des boutons
document.getElementById("btnClose").onclick = function () {
  modal.style.display = "none";
};



document.getElementById("btnDelete").onclick = function () {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette parcelle ?")) {
    // Ici, logique de suppression (AJAX, etc.)
    console.log("Suppression de:", currentFeature);
    modal.style.display = "none";
    // Optionnel: Supprimer la couche de la carte
    // map.removeLayer(currentLayer);
  }
};

document.getElementById("btnCancel").onclick = function () {
  if (isEditMode) {
    // Recharger les données originales
    openParcelleModal(currentFeature);
    isEditMode = false;
  } else {
    modal.style.display = "none";
  }
};

document.getElementById("btnSave").onclick = function () {
  if (isEditMode) {
    if (!currentIlotId) {
      // Enregistrer un nouveau îlot
      SaveIlot();
    } else {
      // Enregistrer les modifications
      enregistrerModif();

      // Désactiver le mode édition
      isEditMode = false;
      setInputsReadonly(true);
      document.getElementById("btnSave").textContent = "Fermer";
    }
  } else {
    // Fermer le module
    modal.style.display = "none";
  }
};

// Fermer le module en cliquant à l'extérieur
window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};
