import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ncpzpejgfzptevbnofgf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcHpwZWpnZnpwdGV2Ym5vZmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODU0NTUsImV4cCI6MjA4MjM2MTQ1NX0.q8wGtvkd8wt4rsVbNNW6OFj8RJLi8nZ6tVYzF0zkKvw";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Récupère le nombre total de sections
 * @returns {Promise<number>}
 */
export async function getTotalSections() {
  const { count, error } = await supabase
    .from("abc_section")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Erreur getTotalSections :", error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Récupère le nombre total d'îlots
 * @returns {Promise<number>}
 */
export async function getTotalIlots() {
  const { count, error } = await supabase
    .from("abc_ilot")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Erreur getTotalIlots :", error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Récupère le nombre total de parcelles
 * @returns {Promise<number>}
 */
export async function getTotalParcelles() {
  const { count, error } = await supabase
    .from("abc_parcelle")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Erreur getTotalParcelles :", error.message);
    return 0;
  }

  return count || 0;
}



/**
 * Récupère le nombre total de bien imposable
 * @returns {Promise<number>}
 */

export async function getTotalBienImposable() {
  const { count, error } = await supabase
    .from("bien_imposable")
    .select("*", { count: "exact", head: true });
  if (error) {
    console.error("Erreur getTotalBienImposable :", error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Récupère le nombre total de propriétaire
 * @returns {Promise<number>}
 */

export async function getTotalProprietaire() {
  const { count, error } = await supabase
    .from("proprietaire")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Erreur getTotalProprietaire :", error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Récupère le nombre de parcelles par section
 * @returns {Promise<Array<{section: string, nb_parcelles: number}>>}
 */
export async function getParcellesParSection() {
  const { data, error } = await supabase
    .from("abc_parcelle")
    .select("section, id_parcelle"); // id_parcelle ou n'importe quelle colonne unique

  if (error) {
    console.error("Erreur getParcellesParSection :", error.message);
    return [];
  }

  // Regrouper les parcelles par section
  const stats = {};
  data.forEach((item) => {
    if (!stats[item.section]) stats[item.section] = 0;
    stats[item.section]++;
  });

  // Transformer en tableau
  return Object.entries(stats).map(([section, nb_parcelles]) => ({
    section,
    nb_parcelles,
  }));
}
