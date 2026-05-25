export type TmdbPersonPhotoCheck = {
  personId?: number;
  name?: string;
  hasProfilePhoto: boolean;
  profileImageCount?: number;
  existingProfileUrl?: string;
};

export async function checkTmdbPersonPhoto(input: string): Promise<TmdbPersonPhotoCheck> {
  await new Promise((resolve) => window.setTimeout(resolve, 350));

  const cleanInput = input.trim();
  const isUrl = cleanInput.includes('themoviedb.org/person/');
  const nameFromUrl = isUrl
    ? cleanInput.split('/person/')[1]?.split('-').slice(1).join(' ')
    : cleanInput;

  return {
    personId: isUrl ? Number(cleanInput.split('/person/')[1]?.split('-')[0]) || undefined : undefined,
    name: titleCase(nameFromUrl || 'Unknown person'),
    hasProfilePhoto: false,
    profileImageCount: 0,
  };
}

function titleCase(value: string) {
  return value
    .replaceAll('-', ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
