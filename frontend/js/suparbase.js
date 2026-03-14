import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* AJOUTER */
app.post("/api/contacts", async (req, res) => {
  const { nom, email, message } = req.body;

  const { error } = await supabase
    .from("contacts")
    .insert([{ nom, email, message }]);

  if (error) return res.status(500).json(error);
  res.json({ success: true });
});

/* LIRE */
app.get("/api/contacts", async (req, res) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("*");

  res.json(data);
});

/* MODIFIER */
app.put("/api/contacts/:id", async (req, res) => {
  const { message } = req.body;

  await supabase
    .from("contacts")
    .update({ message })
    .eq("id", req.params.id);

  res.json({ success: true });
});

/* SUPPRIMER */
app.delete("/api/contacts/:id", async (req, res) => {
  await supabase
    .from("contacts")
    .delete()
    .eq("id", req.params.id);

  res.json({ success: true });
});

app.listen(3000, () =>
  console.log("🚀 Serveur lancé sur http://localhost:3000")
);