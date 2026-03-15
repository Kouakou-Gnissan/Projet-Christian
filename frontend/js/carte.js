import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ncpzpejgfzptevbnofgf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcHpwZWpnZnpwdGV2Ym5vZmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODU0NTUsImV4cCI6MjA4MjM2MTQ1NX0.q8wGtvkd8wt4rsVbNNW6OFj8RJLi8nZ6tVYzF0zkKvw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let map;
let savedView = {};

// Initialisation
document.addEventListener("DOMContentLoaded", initMap);

function initMap() {
  // Création de la carte avec options de performance
  map = L.map("map", {
    preferCanvas: true, // Améliore les performances
    fadeAnimation: false,
    zoomAnimation: true,
    markerZoomAnimation: true,
    inertia: true,
    inertiaDeceleration: 2000,
  }).setView([7.55, -5.55], 12);

  // Layer avec optimisation
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 22,
    attribution: "&copy; OpenStreetMap",
    updateWhenIdle: true, // Évite les chargements inutiles
    keepBuffer: 2,
  }).addTo(map);

  // Sauvegarde de la vue initiale
  savedView = {
    center: map.getCenter(),
    zoom: map.getZoom(),
  };

  // Configuration de la localisation
  initLocateControl();

  // Chargement des données
  chargerToutesLesCouches();

  // Gestionnaire de zoom pour les labels
  map.on("zoomend", updateAllLabels);
}

function initLocateControl() {
  L.control
    .locate({
      position: "bottomright",
      strings: { title: "Me localiser" },
      locateOptions: { maxZoom: 16, enableHighAccuracy: true },
      circleStyle: {
        color: "#007bff",
        fillColor: "#007bff",
        fillOpacity: 0.15,
      },
      markerStyle: { color: "#007bff", fillColor: "#007bff" },
      returnToPrevBounds: true,
      flyTo: true,
      cacheLocation: true,
    })
    .addTo(map);

  map.on("stopfollowing", () => {
    map.flyTo(savedView.center, savedView.zoom, { duration: 1 });
  });
}

// ================= CHARGEMENT DES COUCHES =================

async function chargerToutesLesCouches() {
  await Promise.all([afficherSections(), afficherIlots(), afficherParcelles()]);
}

function createLayerStyle(options) {
  return {
    fillColor: options.fillColor,
    color: options.borderColor,
    weight: options.weight ?? 1,
    opacity: options.opacity ?? 1,
    fillOpacity: options.fillOpacity ?? 0.2,
  };
}

// ================= COUCHE SECTIONS =================

async function afficherSections() {
  try {
    const { data, error } = await supabase
      .from("abc_section")
      .select("fid, geom_geojson, SECTION");

    if (error) throw error;

    const geojson = {
      type: "FeatureCollection",
      features: data.map((item) => ({
        type: "Feature",
        geometry: item.geom_geojson,
        properties: { fid: item.fid, nom: item.SECTION },
      })),
    };

    map.createPane("mesSections");
    map.getPane("mesSections").style.zIndex = 200;

    L.geoJSON(geojson, {
      pane: "mesSections",
      style: createLayerStyle({
        fillColor: "#33ffcc",
        borderColor: "#220881",
        opacity: 0.3,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.nom, {
          permanent: true,
          direction: "center",
          className: "label-section",
        });
        layer.on({
          mouseover: (e) => e.target.setStyle({ weight: 3 }),
          mouseout: () =>
            layer.setStyle(
              createLayerStyle({
                fillColor: "#33ffcc",
                borderColor: "#220881",
              }),
            ),
        });
      },
    }).addTo(map);
  } catch (err) {
    console.error("Erreur sections:", err.message);
  }
}

// ================= COUCHE ILOTS =================

async function afficherIlots() {
  try {
    const { data, error } = await supabase
      .from("abc_ilot")
      .select("fid, geom_geojson, ILOT");

    if (error) throw error;

    const geojson = {
      type: "FeatureCollection",
      features: data.map((item) => ({
        type: "Feature",
        geometry: item.geom_geojson,
        properties: { fid: item.fid, nom: item.ILOT },
      })),
    };

    map.createPane("mesIlots");
    map.getPane("mesIlots").style.zIndex = 300;

    L.geoJSON(geojson, {
      pane: "mesIlots",
      style: createLayerStyle({ fillColor: "#ff33cc", borderColor: "#220881" }),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.nom, {
          permanent: true,
          direction: "center",
          className: "label-ilot",
        });
      },
    }).addTo(map);
  } catch (err) {
    console.error("Erreur ilots:", err.message);
  }
}

// ================= COUCHE PARCELLES =================

async function afficherParcelles() {
  try {
    const { data, error } = await supabase
      .from("abc_parcelle")
      .select("fid, id_parcelle, geom_geojson");

    if (error) throw error;

    const geojson = {
      type: "FeatureCollection",
      features: data.map((item) => ({
        type: "Feature",
        geometry: item.geom_geojson,
        properties: { fid: item.fid, nom: item.id_parcelle },
      })),
    };

    map.createPane("mesParcelles");
    map.getPane("mesParcelles").style.zIndex = 400;

    L.geoJSON(geojson, {
      pane: "mesParcelles",
      style: createLayerStyle({ fillColor: "#3388ff", borderColor: "#aa0017" }),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.nom, {
          permanent: true,
          direction: "center",
          className: "label-parcelle",
        });
        layer.on({
          click: () => afficherInfosParcelle(feature.properties.fid),
        });
      },
    }).addTo(map);
  } catch (err) {
    console.error("Erreur parcelles:", err.message);
  }
}

// ================= GESTION DES LABELS =================

function updateAllLabels() {
  const zoom = map.getZoom();

  document.querySelectorAll(".label-section").forEach((el) => {
    el.style.fontSize = zoom >= 16 ? "14px" : zoom >= 14 ? "10px" : "0px";
  });

  document.querySelectorAll(".label-ilot").forEach((el) => {
    el.style.fontSize = zoom >= 16 ? "12px" : zoom >= 14 ? "8px" : "0px";
  });

  document.querySelectorAll(".label-parcelle").forEach((el) => {
    el.style.fontSize = zoom >= 18 ? "10px" : "0px";
  });
}

// ================= GESTION DES MODALES =================

let sideModal = document.getElementById("parcelleSideModal");
let isEditMode = false;

async function afficherInfosParcelle(parcelleId) {
  const { data, error } = await supabase
    .from("abc_parcelle")
    .select("*")
    .eq("fid", parcelleId)
    .single();

  if (error) {
    console.error("Erreur:", error.message);
    return;
  }

  await chargerChampSection();
  remplirFormulaire(data);
  sideModal.classList.add("active");
}

function remplirFormulaire(data) {
  const form = document.forms.parcelleForm;
  if (!form) return;

  form.id_parcelle.value = data.id_parcelle || "";
  form.parcelle.value = data.id_parcelle || "";
  form.section_parcelle.value = data.section_parcelle || "";
  form.section.value = data.section || "";
  form.ilot.value = data.ilot || "";
  form.lot.value = data.lot || "";
  form.titre_foncier.value = data.titre_foncier || "";
  form.superficie.value = data.superficie || "";
  form.layer.value = data.layer || "";
  form.geom.value = data.geom_geojson ? "Géométrie disponible" : "";
  form.Commune.value = data.commune || "";
  form.localite.value = data.localite || "";
  form.quartier.value = data.quartier || "";
  form.circonscription_fonciere.value = data.circonscription_fonciere || "";
  form.satus_cadastrale.value = data.satut_cadastre || "";
  form.proprietaire.value = data.proprietaire || "";
  form.annee_aquisition.value = data.annee_acquisition || "";
  form.annee_declaration.value = data.annee_declaration || "";
  form.numero_declaration.value = data.numero_declaration || "";
  form.valeur_marchande.value = data.valeur_marchande_propriete_non_batie || "";
  form.proprité_batie.value = data.propriete_batie || "";
}

async function chargerChampSection() {
  const { data, error } = await supabase
    .from("abc_section")
    .select("SECTION")
    .order("fid");

  if (error) return;

  const select = document.getElementById("section");
  select.innerHTML = '<option value="">Sélectionner</option>';
  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.SECTION;
    option.textContent = `Section ${item.SECTION}`;
    select.appendChild(option);
  });
}

function toggleEditMode() {
  isEditMode = !isEditMode;

  document.querySelectorAll("#parcelleForm .form-control").forEach((input) => {
    isEditMode
      ? input.removeAttribute("readonly")
      : input.setAttribute("readonly", true);
  });

  document.querySelectorAll("#parcelleForm select").forEach((select) => {
    isEditMode
      ? select.removeAttribute("disabled")
      : select.setAttribute("disabled", true);
  });

  document
    .getElementById("toggleEditMode")
    .classList.toggle("active", isEditMode);
  document.getElementById("cancelEditBtn").style.display = isEditMode
    ? "flex"
    : "none";
  document.getElementById("saveParcelleBtn").style.display = isEditMode
    ? "flex"
    : "none";
  document.getElementById("modalTitle").textContent = isEditMode
    ? "Modifier parcelle"
    : "Détails de la parcelle";
}

function closeSideModal() {
  sideModal.classList.remove("active");
  if (isEditMode) toggleEditMode();
}

// ================= RECHERCHE =================

const searchInput = document.querySelector(".search-input");
const resultsBox = document.getElementById("searchResults");
const clearBtn = document.querySelector(".search-clear");

searchInput.addEventListener("input", async function () {
  const query = this.value.trim();

  if (query.length < 2) {
    resultsBox.innerHTML = "";
    return;
  }

  resultsBox.innerHTML =
    '<div class="search-loading"><span class="material-symbols-rounded">progress_activity</span>Recherche...</div>';

  const { data, error } = await supabase
    .from("abc_parcelle")
    .select("fid, id_parcelle, geom_geojson")
    .ilike("id_parcelle", `%${query}%`)
    .limit(10);

  if (error) {
    resultsBox.innerHTML = '<div class="search-no-results">Erreur</div>';
    return;
  }

  afficherResultats(data, query);
});

function afficherResultats(data, query) {
  if (!data.length) {
    resultsBox.innerHTML = `<div class="search-no-results"><span class="material-symbols-rounded">search_off</span><p>Aucun résultat pour "${query}"</p></div>`;
    return;
  }

  resultsBox.innerHTML = data
    .map(
      (parcelle) => `
    <div class="search-item" data-id="${parcelle.fid}" data-geom='${JSON.stringify(parcelle.geom_geojson)}'>
      <div class="search-item-icon"><span class="material-symbols-rounded">crop_square</span></div>
      <div class="search-item-content">
        <div class="search-item-title">${parcelle.id_parcelle.replace(new RegExp(query, "gi"), (match) => `<span class="search-highlight">${match}</span>`)}</div>
        <div class="search-item-subtitle">Parcelle cadastrale</div>
      </div>
      <span class="search-item-badge">Parcelle</span>
    </div>
  `,
    )
    .join("");

  // 👇 BLOQUER LA PROPAGATION DU SCROLL
  resultsBox.addEventListener("wheel", function (e) {
    e.stopPropagation(); // Empêche le scroll d'atteindre la carte
  });

  // Pour mobile (touch events)
  resultsBox.addEventListener("touchmove", function (e) {
    e.stopPropagation();
  });

  // CORRECTION ICI : appel direct à zoomParcelle (votre fonction originale)
  document.querySelectorAll(".search-item").forEach((item) => {
    item.addEventListener("click", function () {
      const geom = JSON.parse(this.dataset.geom);
      const id = this.dataset.id;
      zoomSurParcelle(id);
    });
  });
}

async function zoomSurParcelle(fid) {
  const { data, error } = await supabase
    .from("abc_parcelle")
    .select("geom_geojson, id_parcelle")
    .eq("fid", fid)
    .single();

  if (!error && data) {
    const layer = L.geoJSON(data.geom_geojson);
    map.fitBounds(layer.getBounds());
    searchInput.value = data.id_parcelle;
    resultsBox.innerHTML = "";
  }
}

clearBtn.onclick = () => {
  searchInput.value = "";
  resultsBox.innerHTML = "";
};

// ================= INIT ÉCOUTEURS =================

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("closeSideModal")
    ?.addEventListener("click", closeSideModal);
  document
    .getElementById("toggleEditMode")
    ?.addEventListener("click", toggleEditMode);
  document
    .getElementById("cancelEditBtn")
    ?.addEventListener("click", toggleEditMode);
  document
    .getElementById("saveParcelleBtn")
    ?.addEventListener("click", saveParcelle);
});

async function saveParcelle() {
  const form = document.forms.parcelleForm;
  const idParcelle = form.id_parcelle.value;

  if (!idParcelle) return;

  const updateData = {
    section: form.section.value || null,
    ilot: form.ilot.value || null,
    lot: form.lot.value || null,
    titre_foncier: form.titre_foncier.value || null,
    superficie: form.superficie.value || null,
    commune: form.Commune.value || null,
    quartier: form.quartier.value || null,
    annee_acquisition: form.annee_aquisition.value || null,
    annee_declaration: form.annee_declaration.value || null,
    numero_declaration: form.numero_declaration.value || null,
    valeur_marchande_propriete_non_batie: form.valeur_marchande.value || null,
    update_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("abc_parcelle")
    .update(updateData)
    .eq("id_parcelle", idParcelle);

  if (!error) {
    showNotification("Parcelle mise à jour avec succès");
    toggleEditMode();
  }
}

function showNotification(msg) {
  const notif = document.createElement("div");
  notif.className = "save-success";
  notif.innerHTML = `<span class="material-symbols-rounded">check_circle</span>${msg}`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}
