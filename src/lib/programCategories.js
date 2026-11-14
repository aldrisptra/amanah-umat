import { supabase } from "./supabase";
export async function getProgramCategories() {
  const { data, error } = await supabase.from("program_categories").select("name").order("name");
  if (error) {
    if (["PGRST205", "42P01"].includes(error.code)) return { names: [], available: false };
    throw error;
  }
  return { names: (data || []).map(row => row.name), available: true };
}
export const programCategoryOptions = (names, programs) => [...new Set([
  ...names, ...programs.map(p => p.category).filter(Boolean),
])];
