export interface CommunityFormResult {
  name: string;
  about: string;
}

export function processCommunityFormData(
  nameRaw: string,
  aboutRaw: string,
): CommunityFormResult | null {
  const name = nameRaw.trim();
  const about = aboutRaw.trim();

  if (!name) {
    return null;
  }

  return { name, about };
}
