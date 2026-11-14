import { supabase } from "./supabase";
export const DEFAULT_GROUPS = [{ slug: "tpq", name: "TPQ" }, { slug: "lksa", name: "LKSA" }];
export async function getGalleryGroups() {
  const { data, error } = await supabase.from("gallery_groups").select("*").order("created_at");
  if (error) {
    if (!["PGRST205", "42P01"].includes(error.code)) throw error;
    return { groups: DEFAULT_GROUPS, available: false };
  }
  return { groups: data || [], available: true };
}
export function galleryGroup(item) {
  const explicit = item.unit?.trim().toLowerCase();
  if (explicit) return explicit;
  const text = `${item.category || ""} ${item.alt_text || ""}`;
  const tpq = /\btpq\b/i.test(text), lksa = /\blksa\b/i.test(text);
  return tpq && lksa ? "keduanya" : tpq ? "tpq" : lksa ? "lksa" : "";
}
export const matchesGalleryGroup = (item, group) => group === "Semua" ||
  galleryGroup(item) === group.toLowerCase() ||
  (galleryGroup(item) === "keduanya" && ["tpq", "lksa"].includes(group.toLowerCase()));
export const galleryGroupLabel = (item, groups) => galleryGroup(item) === "keduanya"
  ? groups.filter(g => ["tpq", "lksa"].includes(g.slug)).map(g => g.name).join(" & ")
  : groups.find(g => g.slug === galleryGroup(item))?.name || "";
