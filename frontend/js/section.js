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
    await ChargerDonneeSection(1);
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

const PAGE_SIZE = 6;
let currentPage = 1;
let totalPages = 1;
let searchQuery = "";
let index_id = null;

// charger les données avec pagination
async function ChargerDonneeSection(page = 1) {
  try {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("abc_section")
      .select("*", { count: "exact" })
      .order("fid", { ascending: true });

    // 🔎 Si recherche active
    if (searchQuery.trim() !== "") {
      const value = `%${searchQuery.trim()}%`;

      query = query.or(
        `ILOT.ilike.${value},SECTION.ilike.${value},LOT.ilike.${value},PARCELLE.ilike.${value}`,
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (data == "") {
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

    renderSectionsCards(data);
    renderPagination();
  } catch (err) {
    console.error("Erreur JS :", err.message);
  }
}

// Fonction qui génère les cartes de sections dans le DOM
function renderSectionsCards(data) {
  const container = document.getElementById("sectionsGrid");
  container.innerHTML = ""; // Vide le conteneur avant d'ajouter

  // Couleurs pour les badges (tu peux adapter)
  const colors = [
    "#f87171",
    "#e11d48",
    "#7c3aed",
    "#059669",
    "#b45309",
    "#0891b2",
  ];

  data.forEach((section, index) => {
    const card = document.createElement("div");
    card.classList.add("section-card");
    card.innerHTML = `
      <div class="card-header">
        <div class="section-code">
          <span class="code-badge" style="background: ${colors[index % colors.length]}">${section.fid}</span>
          <h3>${section.SECTION}</h3>
        </div>
        <div class="card-actions">
          <button class="action-btn edit" title="Modifier la section" data-id="${section.fid}">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="action-btn delete" title="Supprimer la section"  data-id="${section.fid}">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="section-info">
          <div class="info-item">
            <span class="material-symbols-rounded">pin_drop</span>
            <span>${section.SAIF}</span>
          </div>
          <div class="info-item">
            <span class="material-symbols-rounded">straighten</span>
            <span>${section.superficie} parcelles</span>
          </div>
          <div class="info-item">
            <span class="material-symbols-rounded">grid_view</span>
            <span>${section.ILOT} îlots</span>
          </div>
          <div class="info-item">
            <span class="material-symbols-rounded">crop_square</span>
            <span>${section.PARCELLE} parcelles renseignées</span>
          </div>
        </div>
        <div class="section-preview">
          <div class="preview-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <span class="preview-link">Voir sur la carte</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="update-info">Mise à jour: ${new Date(
          section.updated_at,
        ).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}</span>
      </div>
    `;
    container.appendChild(card);
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
      ChargerDonneeSection(page);
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
      ChargerDonneeSection(currentPage - 1);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      ChargerDonneeSection(currentPage + 1);
    }
  });
}

// recherche
const searchInput = document.getElementById("searchSection");
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
      ChargerDonneeSection(1);
      return;
    }

    ChargerDonneeSection(1);
  }, 400),
);

// gestion de la modification

async function afficherInfosSection(sectionId) {
  const { data, error } = await supabase
    .from("abc_section")
    .select("*")
    .eq("fid", sectionId)
    .single();

  if (error) {
    console.error("Erreur récupération parcelle :", error.message);
    return;
  }

  console.log("parcelle trouvé :", data);

  afficherDetailSection(data); // ta fonction d'affichage
}

function afficherDetailSection(data) {
  const form = document.getElementById("sectionForm");

  form.section_id.value = data.fid || "";
  index_id = form.section_id.value;

  form.Section.value = data.SECTION || "";
  form.section_parcelle.value = data.SECTION_PARCELLE || "";

  form.ilot.value = data.ILOT || "";
  form.lot.value = data.LOT || "";

  form.Parcelle.value = data.PARCELLE || "";
  form.Saif.value = data.SAIF || "";

  form.layer.value = data.Layer || "";

  // Géométrie
  form.geom.value = data.geom_geojson ? "Géométrie disponible" : "";

  // ouvrir le modal
  document.getElementById("sectionModal").classList.add("active");

  // changer le titre
  document.getElementById("sectionModalTitle").textContent =
    "Modifier une section";
}

// sauvegarde des modifications
async function saveModifSection() {
  const form = document.getElementById("sectionForm");

  const sectionId = index_id;
  console.log(sectionId);

  if (!sectionId) {
    console.error("ID section manquant");
    return;
  }

  function nullIfEmpty(v) {
    return v === "" ? null : v;
  }

  const updateData = {
    SECTION: form.Section.value,

    SECTION_PARCELLE: nullIfEmpty(form.section_parcelle.value),

    ILOT: nullIfEmpty(form.ilot.value),
    LOT: nullIfEmpty(form.lot.value),

    PARCELLE: nullIfEmpty(form.Parcelle.value),

    SAIF: nullIfEmpty(form.Saif.value),

    Layer: nullIfEmpty(form.layer.value),

    update_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("abc_section")
      .update(updateData)
      .eq("fid", sectionId);

    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    console.log("Section mise à jour :", updateData);

    notifications.show(
      "La section a été modifiée avec succès",
      "success",
      "Modification enregistrée",
    );

    closeSectionModal();

    // rafraîchir la couche carte
    await ChargerDonneeSection(currentPage);
  } catch (err) {
    console.error("Erreur JS :", err.message);
  }
}

// ajouter une nouvelle section

async function addSection() {
  const form = document.getElementById("sectionForm");
  const sectionId = "";
  function nullIfEmpty(v) {
    return v === "" ? null : v;
  }

  const newSection = {
    SECTION: form.Section.value,

    SECTION_PARCELLE: nullIfEmpty(form.section_parcelle.value),

    ILOT: nullIfEmpty(form.ilot.value),
    LOT: nullIfEmpty(form.lot.value),

    PARCELLE: nullIfEmpty(form.Parcelle.value),

    SAIF: nullIfEmpty(form.Saif.value),

    Layer: nullIfEmpty(form.layer.value),

    // géométrie (si tu stockes du geojson)
    //geom_geojson: form.geom.dataset.geojson
    // ? JSON.parse(form.geom.dataset.geojson)
    // : null,

    created_at: new Date().toISOString(),
    update_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("abc_section")
      .insert([newSection])
      .select()
      .single();

    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    console.log("Nouvelle section ajoutée :", data);

    notifications.show(
      "La section a été ajoutée avec succès",
      "success",
      "Section créée",
    );

    // vider le formulaire
    form.reset();

    // rafraîchir les sections sur la carte
    await ChargerDonneeSection(currentPage);
  } catch (err) {
    console.error("Erreur JS :", err.message);
  }
}

// Suppression d'une section
document.addEventListener("click", async function (e) {
  const btn = e.target.closest(".delete");
  if (!btn) return;

  const sectionId = btn.dataset.id;

  const confirmation = await showConfirm(
    "Voulez-vous vraiment supprimer cette section ?",
  );

  if (!confirmation) return;

  try {
    const { error } = await supabase
      .from("abc_section")
      .delete()
      .eq("fid", sectionId);

    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    notifications.show(
      "Section supprimée avec succès",
      "success",
      "Suppression",
    );

    // fermer le modal après suppression
    document.getElementById("confirmModal").classList.remove("show");

    // rafraîchir les sections sur la carte
    await ChargerDonneeSection(currentPage);
  } catch (err) {
    console.error("Erreur JS :", err.message);
  }
});

// fonction de demande de confirmation pour la suppression
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const msg = document.getElementById("confirmMessage");
    const ok = document.getElementById("confirmOk");
    const cancel = document.getElementById("confirmCancel");

    msg.textContent = message;

    modal.classList.add("show");

    function close(result) {
      modal.classList.remove("show");
      resolve(result);
    }

    ok.onclick = () => {
      modal.classList.remove("show");
      resolve(true);
    };

    cancel.onclick = () => {
      modal.classList.remove("show");
      resolve(false);
    };
  });
}

//=======================================================================================
//=======================================================================================
//====================================GESTION Du modal==========================================

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("btnAddSection")
    .addEventListener("click", openAddSectionModal);
  document
    .getElementById("sectionsGrid")
    .addEventListener("click", async function (e) {
      const btn = e.target.closest(".edit"); // ou btnViewDetails si tu changes la classe
      if (!btn) return;
      const sectionId = btn.dataset.id;
      console.log(sectionId);

      await afficherInfosSection(sectionId);
      openEditSectionModal();
    });
});

// Gestionnaire du modal sections
let sectionModal = document.getElementById("sectionModal");
let isEditMode = false;

// Ouvrir le modal (ajout)
function openAddSectionModal() {
  isEditMode = false;
  document.getElementById("sectionModalTitle").textContent =
    "Ajouter une section";
  document.getElementById("sectionForm").reset();
  document.getElementById("section_id").value = "";
  document.getElementById("geomPreview").style.display = "none";
  sectionModal.classList.add("active");
}

// Ouvrir le modal (modification)
function openEditSectionModal(sectionData) {
  isEditMode = true;
  document.getElementById("sectionModalTitle").textContent =
    "Modifier la section";

  // Remplir les champs

  sectionModal.classList.add("active");
}

// Fermer le modal
function closeSectionModal() {
  sectionModal.classList.remove("active");
  document.getElementById("sectionForm").reset();
  document.getElementById("geomPreview").style.display = "none";
}

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  // Boutons de fermeture
  document
    .getElementById("closeSectionModal")
    ?.addEventListener("click", closeSectionModal);
  document
    .getElementById("cancelSectionBtn")
    ?.addEventListener("click", closeSectionModal);

  // Bouton d'ajout de géométrie
  document.getElementById("addGeomBtn")?.addEventListener("click", function () {
    // Ici, ouvrir l'outil de dessin sur la carte
    alert("Outil de dessin à implémenter");
  });

  // Bouton d'effacement de la géométrie
  document
    .getElementById("clearGeomBtn")
    ?.addEventListener("click", function () {
      document.getElementById("geom").value = "";
      document.getElementById("geomPreview").style.display = "none";
    });

  // Bouton de sauvegarde
  document
    .getElementById("saveSectionBtn")
    ?.addEventListener("click", function () {
      // Validation du champ requis
      let section = document.getElementById("Section").value.trim();
      let geom = document.getElementById("geom").value.trim();
      const form = document.getElementById("sectionForm");

      if (!section) {
        notifications.show("Veuillez saisir la section !", "warning");
        document.getElementById("Section").focus();
        return;
      }

      //if (!geom) {
      // notifications.show('Veuillez saisir les données géométrique !', 'warning');
      //  return;
      //}

      // Ajout / Modification
      if (form.section_id.value === "") {
        addSection();
      } else {
        saveModifSection();
      }

      closeSectionModal();
    });

  // Fermeture en cliquant à l'extérieur
  sectionModal?.addEventListener("click", function (e) {
    if (e.target === sectionModal) closeSectionModal();
  });

  // Touche Echap
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sectionModal?.classList.contains("active")) {
      closeSectionModal();
    }
  });
});

// Exemple d'utilisation avec vos boutons
document
  .getElementById("btnAddSection")
  ?.addEventListener("click", openAddSectionModal);
