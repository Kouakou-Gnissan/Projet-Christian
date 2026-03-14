import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import {
  getTotalSections,
  getTotalIlots,
  getTotalParcelles,
  getTotalProprietaire,
  getParcellesParSection,
  getTotalBienImposable,
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
    await ChargerDonneeParcelle(1);
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
  const totalBien_Imposable = await getTotalBienImposable();

  // Injection dans le HTML

  const elParcelles = document.getElementById("totalParcelles");
  const elProprietaire = document.getElementById("totalPropietaire");
  const elBienImposable = document.getElementById("totalBienImposable");

 
  if (elParcelles) {
    elParcelles.textContent = totalParcelles.toLocaleString();
  }
  if (elParcelles) {
    elProprietaire.textContent = totalProprietaire;
  }

  if (elParcelles) {
    elBienImposable.textContent = totalBien_Imposable;
  }
}

// charger les données avec pagination

const PAGE_SIZE = 6;
let currentPage = 1;
let totalPages = 1;
let searchQuery = "";
let currentParcelleId = null; // utiliser pour l'ajout de la modification

async function ChargerDonneeParcelle(page = 1) {
  try {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("abc_parcelle")
      .select("*", { count: "exact" })
      .order("fid", { ascending: true });

    // 🔎 Si recherche active
    if (searchQuery.trim() !== "") {
      const value = `%${searchQuery.trim()}%`;

      query = query.or(
        `id_parcelle.ilike.${value},section_parcelle.ilike.${value},section.ilike.${value},ilot.ilike.${value},lot.ilike.${value},parcelle::text.ilike.${value},superficie.ilike.${value},localite.ilike.${value},commune.ilike.${value},quartier.ilike.${value}`,
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

    renderParcellesCards(data);
    renderPagination();

    // recuperer l'index de l'ilot et le sauvegarder dans le bouton voir
    document.addEventListener("click", async function (e) {
      const btn = e.target.closest(".btn-action");
      if (!btn) return;

      const parcelleId = btn.dataset.id;
      console.log(parcelleId);
      afficherDetailParcelle(parcelleId);
      openParcelleModale();
    });
  } catch (err) {
    console.error("Erreur JS :", err.message);
  }
}

// charger les détail de la parcelle consulté
async function afficherDetailParcelle(id) {
  const { data, error } = await supabase
    .from("abc_parcelle")
    .select("*")
    .eq("fid", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }
  currentParcelleId = data.fid; //on garde l'id pour l'ajout en cas de modification
  await chargerSection();
  remplirModal(data);
  
}

// generer les cartes des parcelles
function renderParcellesCards(data) {
  const grid = document.getElementById("parcellesGrid");
  grid.innerHTML = "";

  data.forEach((parcelle) => {
    grid.innerHTML += `
          <div class="parcelle-card">
            <div class="card-header">
              <div class="parcelle-badge">
                <span class="parcelle-code">${parcelle.id_parcelle}</span>
                <span class="parcelle-status status-active">Lot ${parcelle.lot}</span>
              </div>
              <div class="card-menu">
                <button class="menu-dots btn-action" data-id="${parcelle.fid}">
                  <span class="material-symbols-rounded">more_vert</span>
                </button>
              </div>
            </div>

            <div class="card-preview">
              <div class="preview-shape"></div>
            </div>

            <div class="card-info">
              <div class="info-row">
                <span class="info-label">Surface</span>
                <span class="info-value">${parcelle.superficie} m²</span>
              </div>
              <div class="info-row">
                <span class="info-label">Section/Îlot</span>
                <span class="info-value">${parcelle.section}/ ${parcelle.ilot}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Localisation</span>
                <span class="info-value">${parcelle.quartier}</span>
              </div>
            </div>

            <!-- Module à 3 volets intégré à la carte -->
            <div class="tabs-module">
              <div class="tabs-header">
                <button class="tab-btn active" data-tab="parcelle">
                  <span class="material-symbols-rounded">crop_square</span>
                  <span>Parcelle</span>
                </button>
                <button class="tab-btn" data-tab="proprietaire">
                  <span class="material-symbols-rounded">person</span>
                  <span>Propriétaire</span>
                </button>
                <button class="tab-btn" data-tab="bien">
                  <span class="material-symbols-rounded">account_balance</span>
                  <span>Bien imposable</span>
                </button>
              </div>

              <div class="tabs-content">
                <!-- Volet Parcelle -->
                <div class="tab-pane active" id="tab-parcelle-1">
                  <div class="info-detail">
                    <div class="detail-item">
                      <span class="detail-label">Numéro cadastral</span>
                      <span class="detail-value">${parcelle.id_parcelle}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Surface cadastrale</span>
                      <span class="detail-value">${parcelle.superficie} m²</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Nature</span>
                      <span class="detail-value">Terrain urbain</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Date création</span>
                      <span class="detail-value">${parcelle.created_at}</span>
                    </div>
                  </div>
                </div>

                <!-- Volet Propriétaire -->
                <div class="tab-pane" id="tab-proprietaire-1">
                  <div class="proprietaire-info">
                    <div class="proprietaire-avatar">
                      <span class="material-symbols-rounded">person</span>
                    </div>
                    <div class="proprietaire-details">
                      <h4>Koffi Jean-Baptiste</h4>
                      <p>Né le 15/06/1975</p>
                      <p>Abidjan, Cocody</p>
                    </div>
                  </div>
                  <div class="contact-info">
                    <div class="contact-item">
                      <span class="material-symbols-rounded">call</span>
                      <span>+225 07 89 45 12</span>
                    </div>
                    <div class="contact-item">
                      <span class="material-symbols-rounded">mail</span>
                      <span>jkoffi@email.com</span>
                    </div>
                  </div>
                </div>

                <!-- Volet Bien Imposable -->
                <div class="tab-pane" id="tab-bien-1">
                  <div class="bien-header">
                    <span class="bien-type">Bâti</span>
                    <span class="bien-statut">Imposable</span>
                  </div>
                  <div class="bien-details">
                    <div class="bien-row">
                      <span>Valeur locative</span>
                      <span class="bien-value">1 250 000 FCFA</span>
                    </div>
                    <div class="bien-row">
                      <span>Taxe foncière</span>
                      <span class="bien-value">75 000 FCFA</span>
                    </div>
                    <div class="bien-row">
                      <span>Exercice</span>
                      <span>2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn-action" onclick="voirParcelle('A-01-001')">
                <span>Voir détails</span>
                <span class="material-symbols-rounded">arrow_forward</span>
              </button>
              <div class="footer-meta">
                <span class="meta-item">
                  <span class="material-symbols-rounded">update</span>
                  Il y a 2 jours
                </span>
              </div>
            </div>
          </div>
    `;
  });
}

// Gestion des onglets carte des parcelles
document
  .getElementById("parcellesGrid")
  .addEventListener("click", function (e) {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;

    const card = btn.closest(".parcelle-card");
    const tabName = btn.dataset.tab;

    // Désactiver tous les onglets de cette carte
    card
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));

    card
      .querySelectorAll(".tab-pane")
      .forEach((p) => p.classList.remove("active"));

    // Activer le bouton cliqué
    btn.classList.add("active");

    // Activer le bon contenu
    const pane = card.querySelector(`#tab-${tabName}-1`);
    if (pane) pane.classList.add("active");
  });

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
      ChargerDonneeParcelle(page);
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
      ChargerDonneeParcelle(currentPage - 1);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      ChargerDonneeParcelle(currentPage + 1);
    }
  });
}

// recherche
const searchInput = document.getElementById("searchParcelle");
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
      ChargerDonneeParcelle(1);
      return;
    }

    ChargerDonneeParcelle(1);
  }, 400),
);

// ouvrir le modal
document
  .getElementById("parcellesGrid")
  .addEventListener("click", function (e) {
    const btn = e.target.closest(".btn-delete"); // ou btnViewDetails si tu changes la classe
    if (!btn) return;

    openParcelleModale();
  });

function openParcelleModale() {
  
  const modal = document.getElementById("parcelleModal");
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
  
}

function remplirModal(data) {
  const formParcelle = document.getElementById("formParcelle");
  const formProprietaire = document.getElementById("formProprietaire");
  const formBien = document.getElementById("formBien");

  formParcelle.numero_parcelle.value = data.id_parcelle;
  formParcelle.section.value = data.section;
  formParcelle.ilot.value = data.ilot;
  formParcelle.lot.value = data.lot;
  formParcelle.superficie.value = data.superficie;
  formParcelle.statut_cadastrale.value= data.statut_cadastrale;
  formParcelle.parcelle.value = data.parcelle;
  formParcelle.ville.value= data.commune;
  formParcelle.quartier.value= data.quartier;
  formParcelle.circonscription_fonciere.value = data.circonscription_fonciere;
}

async function chargerSection() {
  const select = document.getElementById("section");

  const { data, error } = await supabase
    .from("abc_section")
    .select("SECTION")
    .order("fid", { ascending: true });

  if (error) {
    console.error("Erreur chargement nature :", error.message);
    return;
  }

  console.log(data)

  // Vider le select
  select.innerHTML = "";

  // Ajouter option vide
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Sélectionner --";
  select.appendChild(defaultOption);

  // Ajouter les options dynamiquement
  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.SECTION; // ce qui sera enregistré en base
    option.textContent = "section " + item.SECTION; // ce que l'utilisateur voit
    select.appendChild(option);
  });
}

// Gestionnaire du modal à 3 volets
class ParcelleModalManager {
  constructor() {
    this.modal = document.getElementById("parcelleModal");
    this.currentTab = "parcelle";
    this.tabs = ["parcelle", "proprietaire", "bien"];
    this.currentIndex = 0;

    this.initEventListeners();
  }

  initEventListeners() {
    // Fermeture
    document
      .getElementById("btnCloseModal")
      ?.addEventListener("click", () => this.close());
    document
      .getElementById("btnCancel")
      ?.addEventListener("click", () => this.close());

    // Navigation par onglets
    document.querySelectorAll(".modal-tab").forEach((tab, index) => {
      tab.addEventListener("click", () =>
        this.switchToTab(tab.dataset.tab, index),
      );
    });

    // Boutons Suivant/Précédent
    document
      .getElementById("btnNext")
      ?.addEventListener("click", () => this.next());
    document
      .getElementById("btnPrevious")
      ?.addEventListener("click", () => this.previous());

    // Sauvegarde
    document
      .getElementById("btnSave")
      ?.addEventListener("click", () => this.save());

    // Radio boutons (personne physique/morale)
    document
      .querySelectorAll('input[name="type_proprietaire"]')
      .forEach((radio) => {
        radio.addEventListener("change", (e) => {
          const isPhysique = e.target.value === "physique";
          document.getElementById("section-physique").style.display = isPhysique
            ? "block"
            : "none";
          document.getElementById("section-morale").style.display = isPhysique
            ? "none"
            : "block";
        });
      });

    // Fermeture en cliquant à l'extérieur
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  open(parcelleData = null) {
    if (!this.modal) return;

    this.reset();

    if (parcelleData) {
      this.populateData(parcelleData);
      document.getElementById("modalTitle").textContent =
        "Modifier la parcelle";
    } else {
      document.getElementById("modalTitle").textContent = "Nouvelle parcelle";
    }

    this.modal.style.display = "block";
    document.body.style.overflow = "hidden";
    this.switchToTab("parcelle", 0);
  }

  close() {
    if (!this.modal) return;
    this.modal.style.display = "none";
    document.body.style.overflow = "";
    this.reset();
  }

  switchToTab(tabName, index) {
    // Mettre à jour les onglets
    document
      .querySelectorAll(".modal-tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelector(`.modal-tab[data-tab="${tabName}"]`)
      .classList.add("active");

    // Mettre à jour le contenu
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));
    document.getElementById(`tab-${tabName}`).classList.add("active");

    this.currentTab = tabName;
    this.currentIndex = index;
    this.updateNavigationButtons();
  }

  next() {
    if (this.currentIndex < this.tabs.length - 1) {
      this.currentIndex++;
      this.switchToTab(this.tabs[this.currentIndex], this.currentIndex);
    }
  }

  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.switchToTab(this.tabs[this.currentIndex], this.currentIndex);
    }
  }

  updateNavigationButtons() {
    const btnPrev = document.getElementById("btnPrevious");
    const btnNext = document.getElementById("btnNext");
    const btnSave = document.getElementById("btnSave");

    btnPrev.style.display = this.currentIndex === 0 ? "none" : "flex";

    if (this.currentIndex === this.tabs.length - 1) {
      btnNext.style.display = "none";
      btnSave.style.display = "flex";
    } else {
      btnNext.style.display = "flex";
      btnSave.style.display = "none";
    }
  }

  populateData(data) {
    // Remplir les champs avec les données existantes
    for (let [key, value] of Object.entries(data)) {
      const input = document.getElementById(key);
      if (input) input.value = value;
    }
  }

  reset() {
    // Réinitialiser tous les formulaires
    document.getElementById("formParcelle")?.reset();
    document.getElementById("formProprietaire")?.reset();
    document.getElementById("formBien")?.reset();

    // Revenir au premier onglet
    this.switchToTab("parcelle", 0);
  }

  save() {
    // Validation des champs requis
    const parcelleNumero = document.getElementById("numero_parcelle").value;
    const superficie = document.getElementById("superficie").value;

    if (!parcelleNumero || !superficie) {
      alert("Veuillez remplir tous les champs obligatoires de la parcelle");
      this.switchToTab("parcelle", 0);
      return;
    }

    // Récupération des données
    const data = {
      parcelle: this.getFormData("formParcelle"),
      proprietaire: this.getFormData("formProprietaire"),
      bien: this.getFormData("formBien"),
    };

    console.log("Données à sauvegarder:", data);

    // Ici, appel à votre API Supabase
    // await saveParcelle(data);

    // Notification de succès
    if (window.notifications) {
      notifications.success("Parcelle enregistrée avec succès");
    }

    this.close();
  }

  getFormData(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      if (value) data[key] = value;
    }

    return data;
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  window.parcelleModal = new ParcelleModalManager();

  // Exemple d'ouverture
  document.getElementById("addParcelleBtn")?.addEventListener("click", () => {
    window.parcelleModal.open();
  });
});
