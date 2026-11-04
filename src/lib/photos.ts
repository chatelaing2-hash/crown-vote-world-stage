import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads a photo to private storage and returns a long-lived signed URL. */
export async function uploadPhoto(folder: string, file: File) {
  const path = `${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
  const { error } = await supabase.storage.from("contestant-photos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage.from("contestant-photos").createSignedUrl(path, TEN_YEARS);
  if (sErr) throw sErr;
  return data.signedUrl;
}

export async function setContestantPhoto(contestantId: string, competitionId: string, file: File) {
  const url = await uploadPhoto(competitionId, file);
  const { error } = await supabase.from("contestants").update({ photo_url: url }).eq("id", contestantId);
  if (error) throw error;
  return url;
}
