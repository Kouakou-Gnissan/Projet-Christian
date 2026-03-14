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

// ======================================================================================================================//
// ======================================================================================================================//
// ===============================Afficher les couches des sections sur la carte=========================================//
async function afficherSections() {
  try {
    const { data, error } = await supabase
      .from("abc_section")
      .select("fid, geom_geojson, SECTION");

    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    const features = data.map(item => ({
      type: "Feature",
      geometry: item.geom_geojson,
      properties: { fid: item.fid,
        nom:item.SECTION
       }
    }));

    const geojson = {
      type: "FeatureCollection",
      features: features
    };

    map.createPane("mesSections");
    map.getPane("mesSections").style.zIndex = 201;

    const sectionsLayer = L.geoJSON(geojson, {
      pane: "mesSections",
      style: {
        fillColor: "#33ffcc",
        color: "#220881",
        weight: 1,
        opacity: 0.3,
        fillOpacity: 0.2
      },
      onEachFeature: function(feature, layer) {
        // Label permanent
        layer.bindTooltip(`${feature.properties.fid} <br> ${feature.properties.nom}`, {
          permanent: true,
          direction: "center",
          className: "label-section"
        });

        // Survol
        layer.on({
          mouseover: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.4 }),
          mouseout: (e) => sectionsLayer.resetStyle(e.target),
          click: (e) => map.fitBounds(e.target.getBounds())
        });
      }
    }).addTo(map);

    // Centrer la carte sur toutes les sections
    map.fitBounds(sectionsLayer.getBounds());

    // 🔹 Listener zoom pour ajuster la taille des labels
    map.on("zoomend", function() {
      const zoom = map.getZoom();
      let size;
      if (zoom >= 18) size = 14;
      else if (zoom >= 16) size = 12;
      else if (zoom >= 14) size = 10;
      else size = 8;

      document.querySelectorAll(".label-section").forEach(el => {
        el.style.fontSize = size + "px";
      });
    });

  } catch (err) {
    console.error("Erreur JS :", err.message);
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

    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    const features = data.map(item => ({
      type: "Feature",
      geometry: item.geom_geojson,
      properties: { fid: item.fid,
        nom: item.ILOT,
       }
    }));

    const geojson = {
      type: "FeatureCollection",
      features: features
    };

    map.createPane("mesIlot");
    map.getPane("mesIlot").style.zIndex = 301;

    const sectionsLayer = L.geoJSON(geojson, {
      pane: "mesSections",
      style: {
        fillColor: "#ff33cc",
        color: "#220881",
        weight: 1,
        opacity: 0.3,
        fillOpacity: 0.2
      },
      onEachFeature: function(feature, layer) {
        // Label permanent
        layer.bindTooltip(`${feature.properties.fid} <br> ${feature.properties.nom}`, {
          permanent: true,
          direction: "center",
          className: "label-section"
        });

        // Survol
        layer.on({
          mouseover: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.4 }),
          mouseout: (e) => sectionsLayer.resetStyle(e.target),
          click: (e) => map.fitBounds(e.target.getBounds())
        });
      }
    }).addTo(map);

    // Centrer la carte sur toutes les sections
    map.fitBounds(sectionsLayer.getBounds());

    // 🔹 Listener zoom pour ajuster la taille des labels
    map.on("zoomend", function() {
      const zoom = map.getZoom();
      let size;
      if (zoom >= 18) size = 14;
      else if (zoom >= 16) size = 12;
      else if (zoom >= 14) size = 10;
      else size = 8;

      document.querySelectorAll(".label-section").forEach(el => {
        el.style.fontSize = size + "px";
      });
    });

  } catch (err) {
    console.error("Erreur JS :", err.message);
  }
}


// ======================================================================================================================//
// ======================================================================================================================//
// ===============================Afficher les couches des parcelles sur la carte========================================//
async function afficherParcelles() {
  try {
    // 1️⃣ Récupérer les données depuis Supabase
    const { data, error } = await supabase
      .from("abc_parcelle")
      .select("fid, id_parcelle, geom_geojson");

    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    //console.log(data[0].geom_geojson);

    // 2️⃣ Transformer les données en Features pour Leaflet
    const features = data.map((item) => ({
      type: "Feature",
      geometry: item.geom_geojson, // déjà un objet JSON
      properties: {
        fid: item.fid,
        nom: item.id_parcelle,
      },
    }));

    const geojson = {
      type: "FeatureCollection",
      features: features,
    };

    // 3️⃣ Créer un pane dédié pour les parcelles
    map.createPane("mesParcelles");
    map.getPane("mesParcelles").style.zIndex = 401;

    // 4️⃣ Ajouter les parcelles sur la carte avec style, survol et popups
    const parcellesLayer = L.geoJSON(geojson, {
      pane: "mesParcelles",
      style: {
        fillColor: "#3388ff",
        color: "#aa0017",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.2,
      },
      onEachFeature: function (feature, layer) {
        // Popup avec le nom de la parcelle
        //layer.bindPopup(`Parcelle: ${feature.properties.nom}`);

        layer.bindTooltip(
          `${feature.properties.fid} <br> ${feature.properties.nom}`,
          {
            permanent: true,
            direction: "center",
            className: "label-parcelle",
          },
        );

        // Survol pour effet visuel
        layer.on({
          mouseover: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.4 }),
          mouseout: (e) => parcellesLayer.resetStyle(e.target),
        });

        // Clic pour centrer la carte sur la parcelle
        layer.on("click", (e) => map.fitBounds(e.target.getBounds()));
      },
    }).addTo(map);

    // Centrer automatiquement la carte sur toutes les parcelles
    map.fitBounds(parcellesLayer.getBounds());

    // modifier font size au zoom des infos des lots
    map.on("zoomend", function () {
      const zoom = map.getZoom();

      let size;

      if (zoom >= 18) size = 12;
      else if (zoom >= 16) size = 0;
      else if (zoom >= 14) size = 0;
      else size = 0;

      document.querySelectorAll(".label-parcelle").forEach((el) => {
        el.style.fontSize = size + "px";
      });
    });

    console.log("Toutes les parcelles ont été ajoutées :", parcellesLayer);
  } catch (err) {
    console.error("Erreur JS :", err.message);
  }
}
