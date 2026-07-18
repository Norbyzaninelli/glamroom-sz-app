import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Esto va a aparecer en la consola del navegador si faltan configurar
  // las variables de entorno (en Netlify o en tu archivo .env local).
  console.error(
    "Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
      "Revisá tu archivo .env (desarrollo local) o las variables de entorno en Netlify (producción)."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
