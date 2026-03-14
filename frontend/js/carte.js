import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ncpzpejgfzptevbnofgf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcHpwZWpnZnpwdGV2Ym5vZmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODU0NTUsImV4cCI6MjA4MjM2MTQ1NX0.q8wGtvkd8wt4rsVbNNW6OFj8RJLi8nZ6tVYzF0zkKvw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", function () {
  afficherSections();
  afficherIlots();
  afficherParcelles();
});

// ================= UTILITAIRES =================

// Générateur de style réutilisable
function createLayerStyle(options) {
  return {
    fillColor: options.fillColor,
    color: options.borderColor,
    weight: options.weight ?? 1,
    opacity: options.opacity ?? 1,
    fillOpacity: options.fillOpacity ?? 0.2,
  };
}

// Gestion dynamique des tailles de labels
function updateLabelSize(className, rules) {
  const zoom = map.getZoom();
  let size = rules.default;

  for (const rule of rules.breakpoints) {
    if (zoom >= rule.zoom) {
      size = rule.size;
      break;
    }
  }

  document.querySelectorAll(className).forEach((el) => {
    el.style.fontSize = size + "px";
  });
}

// Un SEUL listener global
map.on("zoomend", function () {
  updateLabelSize(".label-section", {
    default: 0,
    color: "#220881",
    zIndex: 200,

    breakpoints: [
      { zoom: 18, size: 100 },
      { zoom: 16, size: 40 },
      { zoom: 14, size: 18 },
    ],
  });

  updateLabelSize(".label-ilot", {
    default: 0,
    breakpoints: [
      { zoom: 18, size: 30 },
      { zoom: 16, size: 16 },
      { zoom: 14, size: 9 },
    ],
  });

  updateLabelSize(".label-parcelle", {
    default: 0,
    breakpoints: [{ zoom: 18, size: 12 }],
  });
});

// ======================================================================================================================//
// ======================================================================================================================//
// ===============================Afficher les couches des sections sur la carte=========================================//
async function afficherSections() {
  try {
    const { data, error } = await supabase
      .from("abc_section")
      .select("fid, geom_geojson, SECTION");

    if (error) return console.error(error.message);

    const geojson = {
      type: "FeatureCollection",
      features: data.map((item) => ({
        type: "Feature",
        geometry: item.geom_geojson,
        properties: {
          fid: item.fid,
          nom: item.SECTION,
        },
      })),
    };

    if (!map.getPane("mesSections")) {
      map.createPane("mesSections");
      map.getPane("mesSections").style.zIndex = 200;
    }

    const layer = L.geoJSON(geojson, {
      pane: "mesSections",
      style: createLayerStyle({
        fillColor: "#33ffcc",
        borderColor: "#220881",
        opacity: 0.3,
        fillOpacity: 0.2,
      }),
      onEachFeature: function (feature, layer) {
        layer.bindTooltip(`${feature.properties.nom}`, {
          permanent: true,
          direction: "center",
          className: "label-section",
        });

        layer.on({
          mouseover: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.4 }),
          mouseout: () =>
            layer.setStyle(
              createLayerStyle({
                fillColor: "#33ffcc",
                borderColor: "#220881",
                opacity: 0.3,
                fillOpacity: 0.2,
              }),
            ),
          click: (e) => map.fitBounds(e.target.getBounds()),
        });
      },
    }).addTo(map);

    map.fitBounds(layer.getBounds());
  } catch (err) {
    console.error(err.message);
  }
}
// ======================================================================================================================//
// ======================================================================================================================//
// ===============================Afficher les couches des ilots sur la carte============================================//
async function afficherIlots() {
  try {
    const { data, error } = await supabase
      .from("abc_ilot")
      .select("fid, geom_geojson, ILOT");

    if (error) return console.error(error.message);

    const geojson = {
      type: "FeatureCollection",
      features: data.map((item) => ({
        type: "Feature",
        geometry: item.geom_geojson,
        properties: {
          fid: item.fid,
          nom: item.ILOT,
        },
      })),
    };

    if (!map.getPane("mesIlots")) {
      map.createPane("mesIlots");
      map.getPane("mesIlots").style.zIndex = 300;
    }

    const layer = L.geoJSON(geojson, {
      pane: "mesIlots",
      style: createLayerStyle({
        fillColor: "#ff33cc",
        borderColor: "#220881",
      }),
      onEachFeature: function (feature, layer) {
        layer.bindTooltip(`${feature.properties.nom}`, {
          permanent: true,
          direction: "center",
          className: "label-ilot",
        });

        layer.on({
          mouseover: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.4 }),
          mouseout: () =>
            layer.setStyle(
              createLayerStyle({
                fillColor: "#ff33cc",
                borderColor: "#220881",
              }),
            ),
          click: (e) => map.fitBounds(e.target.getBounds()),
        });
      },
    }).addTo(map);
  } catch (err) {
    console.error(err.message);
  }
}

// ======================================================================================================================//
// ======================================================================================================================//
// ===============================Afficher les couches des parcelles sur la carte========================================//
async function afficherParcelles() {
  try {
    const { data, error } = await supabase
      .from("abc_parcelle")
      .select("fid, id_parcelle, geom_geojson");

    if (error) return console.error(error.message);

    const geojson = {
      type: "FeatureCollection",
      features: data.map((item) => ({
        type: "Feature",
        geometry: item.geom_geojson,
        properties: {
          fid: item.fid,
          nom: item.id_parcelle,
        },
      })),
    };

    if (!map.getPane("mesParcelles")) {
      map.createPane("mesParcelles");
      map.getPane("mesParcelles").style.zIndex = 400;
    }

    const layer = L.geoJSON(geojson, {
      pane: "mesParcelles",
      style: createLayerStyle({
        fillColor: "#3388ff",
        borderColor: "#aa0017",
        fillOpacity: 0.2,
      }),
      onEachFeature: function (feature, layer) {
        layer.bindTooltip(`${feature.properties.nom}`, {
          permanent: true,
          direction: "center",
          className: "label-parcelle",
        });

        layer.on({
          mouseover: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.4 }),
          mouseout: () =>
            layer.setStyle(
              createLayerStyle({
                fillColor: "#3388ff",
                borderColor: "#aa0017",
                fillOpacity: 0.2,
              }),
            ),
          click: (e) => {
            const parcelleId = feature.properties.fid;
            console.log("ilot; " + parcelleId);
            map.fitBounds(e.target.getBounds());
            afficherInfosParcelle(parcelleId);
            openSideModal();
          },
        });
      },
    }).addTo(map);
  } catch (err) {
    console.error(err.message);
  }
}


async function afficherInfosParcelle(parcelleId) {
  const { data, error } = await supabase
    .from("abc_parcelle")
    .select("*")
    .eq("fid", parcelleId)
    .single();

  if (error) {
    console.error("Erreur récupération parcelle :", error.message);
    return;
  }

  console.log("parcelle trouvé :", data);

  await chargerChampSection();
  afficherDetailParcelle(data); // ta fonction d'affichage
}


function afficherDetailParcelle(data) {

  const form = document.getElementById("parcelleForm");

  // ===== IDENTIFIANT =====
  form.id_parcelle.value = data.id_parcelle || "";

  // ===== IDENTIFICATION CADASTRALE =====
  form.parcelle.value = data.id_parcelle || "";
  form.section_parcelle.value = data.section_parcelle || "";
  form.section.value = data.section || "";
  form.ilot.value = data.ilot || "";
  form.lot.value = data.lot || "";
  form.titre_foncier.value = data.titre_foncier || "";

  // ===== CARACTERISTIQUES PHYSIQUES =====
  form.superficie.value = data.superficie || "";
  form.layer.value = data.layer || "";

  // géométrie (on affiche juste un résumé)
  form.geom.value = data.geom_geojson ? "Géométrie disponible" : "";

  // ===== LOCALISATION =====
  form.Commune.value = data.commune || "";
  form.localite.value = data.localite || "";
  form.quartier.value = data.quartier || "";
  form.circonscription_fonciere.value = data.circonscription_fonciere || "";

  // ===== STATUT =====
  form.satus_cadastrale.value = data.satut_cadastre || "";
  form.proprietaire.value = data.proprietaire || "";

  // ===== INFORMATIONS FISCALES =====
  form.annee_aquisition.value = data.annee_acquisition || "";
  form.annee_declaration.value = data.annee_declaration || "";
  form.numero_declaration.value = data.numero_declaration || "";
  form.valeur_marchande.value = data.valeur_marchande_propriete_non_batie|| "";
  form.proprité_batie.value = data.propriete_batie || "";

  // ===== OUVRIR LE MODAL =====
  const modal = document.getElementById("parcelleSideModal");
  modal.classList.add("active");
}

async function chargerChampSection() {
  const select = document.getElementById("section");

  const { data, error } = await supabase
    .from("abc_section")
    .select("SECTION")
    .order("fid", { ascending: true });

  if (error) {
    console.error("Erreur chargement nature :", error.message);
    return;
  }

  console.log(data);

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

// ======================Gestion des modales ===================
// Variables globales
let sideModal = document.getElementById("parcelleSideModal");
let ownerModal = document.getElementById("ownerDetailModal");
let isEditMode = false;

// Ouvrir le modal avec les données
function openSideModal(parcelleData) {
  if (!sideModal) return;

  // Remplir tous les champs

  // Réinitialiser le mode édition
  if (isEditMode) toggleEditMode();

  sideModal.classList.add("active");
}

// Fermer le modal
function closeSideModal() {
  if (!sideModal) return;
  sideModal.classList.remove("active");
  if (isEditMode) toggleEditMode();
}

// Basculer mode édition
function toggleEditMode() {
  isEditMode = !isEditMode;

  // Tous les champs éditables
  let inputs = document.querySelectorAll("#parcelleForm .form-control");
  let selects = document.querySelectorAll("#parcelleForm select");

  inputs.forEach((input) => {
    if (isEditMode) {
      input.removeAttribute("readonly");
    } else {
      input.setAttribute("readonly", true);
    }
  });

  selects.forEach((select) => {
    if (isEditMode) {
      select.removeAttribute("disabled");
    } else {
      select.setAttribute("disabled", true);
    }
  });

  // Afficher/masquer les boutons
  document
    .getElementById("toggleEditMode")
    .classList.toggle("active", isEditMode);
  document.getElementById("cancelEditBtn").style.display = isEditMode
    ? "flex"
    : "none";
  document.getElementById("saveParcelleBtn").style.display = isEditMode
    ? "flex"
    : "none";

  // Changer le titre
  document.getElementById("modalTitle").textContent = isEditMode
    ? "Modifier parcelle"
    : "Détails de la parcelle";
}

// Annuler les modifications
function cancelEdit() {
  // Recharger les données originales
  // À implémenter selon votre logique
  toggleEditMode();
}

// Sauvegarder les modifications
async function saveParcelle() {

  const form = document.getElementById("parcelleForm");

  const idParcelle = form.id_parcelle.value;

  if (!idParcelle) {
    console.error("ID parcelle manquant");
    return;
  }

  // Données à envoyer à Supabase (mapping propre)
 const updateData = {

  section: form.section.value,
  ilot: form.ilot.value,
  lot: form.lot.value,
  titre_foncier: nullIfEmpty(form.titre_foncier.value),

  superficie: nullIfEmpty(form.superficie.value),
  layer: nullIfEmpty(form.layer.value),

  commune: nullIfEmpty(form.Commune.value),
  localite: nullIfEmpty(form.localite.value),
  quartier: nullIfEmpty(form.quartier.value),
  circonscription_fonciere: nullIfEmpty(form.circonscription_fonciere.value),

  statut_cadastre: nullIfEmpty(form.satus_cadastrale.value),
 // proprietaire: nullIfEmpty(form.proprietaire.value),

  annee_acquisition: nullIfEmpty(form.annee_aquisition.value),
  annee_declaration: nullIfEmpty(form.annee_declaration.value),

  numero_declaration: nullIfEmpty(form.numero_declaration.value),

  valeur_marchande_propriete_non_batie: nullIfEmpty(form.valeur_marchande.value),

  propriete_batie: nullIfEmpty(form.proprité_batie.value),

  update_at: new Date().toISOString()
};

  try {

    const { error } = await supabase
      .from("abc_parcelle")
      .update(updateData)
      .eq("id_parcelle", idParcelle);

    if (error) {
      console.error("Erreur Supabase :", error.message);

      notifications.show(
        "Erreur lors de la modification",
        "error",
        "Modification échouée"
      );

      return;
    }

    console.log("Parcelle mise à jour :", updateData);

    notifications.show(
      "La parcelle a été modifiée avec succès",
      "success",
      "Modification enregistrée"
    );

    // quitter mode édition
    toggleEditMode();

  } catch (err) {

    console.error("Erreur JS :", err.message);

  }
}

// transformer les champs vide en null
function nullIfEmpty(value) {
  return value === "" ? null : value;
}

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  // Boutons du modal principal
  document
    .getElementById("closeSideModal")
    ?.addEventListener("click", closeSideModal);
  document
    .getElementById("toggleEditMode")
    ?.addEventListener("click", toggleEditMode);
  document
    .getElementById("cancelEditBtn")
    ?.addEventListener("click", cancelEdit);
  document
    .getElementById("saveParcelleBtn")
    ?.addEventListener("click", saveParcelle);

  // Bouton voir propriétaire
  document
    .getElementById("viewOwnerFromParcelleBtn")
    ?.addEventListener("click", function () {
      if (ownerModal) ownerModal.classList.add("active");
    });

  // Bouton voir géométrie
  document
    .getElementById("viewGeomBtn")
    ?.addEventListener("click", function () {
      let geom = document.getElementById("geom")?.value;
      if (geom) {
        alert("Voir sur la carte: " + geom);
        // Ici, centrer la carte sur la géométrie
      }
    });

  // Fermeture modal propriétaire
  document
    .getElementById("closeOwnerModal")
    ?.addEventListener("click", function () {
      if (ownerModal) ownerModal.classList.remove("active");
    });

  // Touche Echap
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (ownerModal?.classList.contains("active")) {
        ownerModal.classList.remove("active");
      } else {
        closeSideModal();
      }
    }
  });

 
});


//=======================================================================================
//=======================================================================================
//====================================GESSTION DE LA RECHERCHE==========================================


// fonction de recherche supabase 
const searchInput = document.querySelector(".search-input");
const resultsBox = document.getElementById("searchResults");

searchInput.addEventListener("input", async function () {

  const query = this.value.trim();

  if (query.length < 2) {
    resultsBox.innerHTML = "";
    return;
  }

  const { data, error } = await supabase
    .from("abc_parcelle")
    .select("fid,id_parcelle,geom_geojson")
    .ilike("id_parcelle", `%${query}%`)
    .limit(10);

  if (error) {
    console.error(error.message);
    return;
  }

  afficherResultats(data);
});


// afficher les resultats
function afficherResultats(data){

  resultsBox.innerHTML = "";

  data.forEach(parcelle => {

    const item = document.createElement("div");
    item.className = "search-item";
    item.textContent = parcelle.id_parcelle;

    item.onclick = () => zoomParcelle(parcelle);

    resultsBox.appendChild(item);

  });

}

// zoom sur la parcelle
function zoomParcelle(parcelle){

  resultsBox.innerHTML = "";
  searchInput.value = parcelle.id_parcelle;

  const layer = L.geoJSON(parcelle.geom_geojson);

  map.fitBounds(layer.getBounds());

}

// affacer la recherche
document.querySelector(".search-clear").onclick = function(){

  searchInput.value = "";
  resultsBox.innerHTML = "";

};