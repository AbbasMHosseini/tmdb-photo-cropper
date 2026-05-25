export type TmdbPersonPhotoCheck = {
  personId?: number;
  name?: string;
  hasProfilePhoto: boolean;
  profileImageCount?: number;
  existingProfileUrl?: string;
  error?: string;
};

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';
const STORAGE_KEY = 'tmdb_api_token';

export function getTmdbApiToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setTmdbApiToken(token: string): void {
  localStorage.setItem(STORAGE_KEY, token.trim());
}

export function clearTmdbApiToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function checkTmdbPersonPhoto(input: string): Promise<TmdbPersonPhotoCheck> {
  const token = getTmdbApiToken();

  if (!token) {
    return getMockResponse(input);
  }

  try {
    const cleanInput = input.trim();
    const personId = extractPersonIdFromUrl(cleanInput);

    if (personId) {
      return await fetchPersonDetails(personId, token);
    }

    return await searchAndFetchPerson(cleanInput, token);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      hasProfilePhoto: false,
      error: `Failed to check TMDB: ${errorMessage}`,
    };
  }
}

function extractPersonIdFromUrl(input: string): number | null {
  const match = input.match(/themoviedb\.org\/person\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function isReadAccessToken(token: string) {
  return token.startsWith('eyJ') || token.length > 80;
}

async function tmdbFetch(path: string, token: string) {
  const separator = path.includes('?') ? '&' : '?';
  const url = isReadAccessToken(token)
    ? `${TMDB_API_BASE}${path}`
    : `${TMDB_API_BASE}${path}${separator}api_key=${encodeURIComponent(token)}`;

  const response = await fetch(url, {
    headers: isReadAccessToken(token)
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json;charset=utf-8',
        }
      : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid TMDB credential. Check the token or API key.');
    }
    throw new Error(`TMDB request failed (${response.status})`);
  }

  return response.json();
}

async function fetchPersonDetails(personId: number, token: string): Promise<TmdbPersonPhotoCheck> {
  const [person, images] = await Promise.all([
    tmdbFetch(`/person/${personId}`, token),
    tmdbFetch(`/person/${personId}/images`, token),
  ]);

  const profiles = Array.isArray(images.profiles) ? images.profiles : [];
  const firstProfilePath = profiles[0]?.file_path || person.profile_path;

  return {
    personId: person.id,
    name: person.name,
    hasProfilePhoto: profiles.length > 0 || Boolean(person.profile_path),
    profileImageCount: profiles.length,
    existingProfileUrl: firstProfilePath ? `${TMDB_IMAGE_BASE}${firstProfilePath}` : undefined,
  };
}

async function searchAndFetchPerson(name: string, token: string): Promise<TmdbPersonPhotoCheck> {
  const searchData = await tmdbFetch(`/search/person?query=${encodeURIComponent(name)}`, token);
  const results = Array.isArray(searchData.results) ? searchData.results : [];

  if (results.length === 0) {
    return {
      hasProfilePhoto: false,
      error: `No person found matching "${name}"`,
    };
  }

  return fetchPersonDetails(results[0].id, token);
}

function getMockResponse(input: string): TmdbPersonPhotoCheck {
  const cleanInput = input.trim();
  const personId = extractPersonIdFromUrl(cleanInput);
  const nameFromUrl = personId
    ? cleanInput.split('/person/')[1]?.split('-').slice(1).join(' ')
    : cleanInput;

  return {
    personId: personId || undefined,
    name: titleCase(nameFromUrl || 'Unknown person'),
    hasProfilePhoto: false,
    profileImageCount: 0,
    error: 'No TMDB API credential configured. Use the settings button to save one in this browser.',
  };
}

function titleCase(value: string) {
  return value
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
