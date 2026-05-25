export type TmdbPersonPhotoCheck = {
  personId?: number;
  name?: string;
  hasProfilePhoto: boolean;
  profileImageCount?: number;
  existingProfileUrl?: string;
  checkedAt?: number;
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

export function buildTmdbPersonUrl(personId: number, name?: string) {
  const slug = toTmdbSlug(name || '');
  const personPath = slug ? `${personId}-${slug}` : String(personId);
  return `https://www.themoviedb.org/person/${personPath}`;
}

export async function checkTmdbPersonPhoto(input: string): Promise<TmdbPersonPhotoCheck> {
  const token = getTmdbApiToken();

  if (!token) {
    return getMockResponse(input);
  }

  try {
    const cleanInput = input.trim();
    const personId = extractPersonIdFromUrl(cleanInput);
    const imdbId = extractImdbPersonId(cleanInput);

    if (personId) {
      return await fetchPersonDetails(personId, token);
    }

    if (imdbId) {
      return await findPersonByImdbId(imdbId, token);
    }

    return await searchAndFetchPerson(cleanInput, token);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      hasProfilePhoto: false,
      checkedAt: Date.now(),
      error: `Failed to check TMDB: ${errorMessage}`,
    };
  }
}

function extractPersonIdFromUrl(input: string): number | null {
  const match = input.match(/themoviedb\.org\/person\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function extractImdbPersonId(input: string): string | null {
  const match = input.match(/(?:imdb\.com\/name\/)?(nm\d{7,10})/i);
  return match ? match[1] : null;
}

function isReadAccessToken(token: string) {
  return token.startsWith('eyJ') || token.length > 80;
}

async function tmdbFetch(path: string, token: string) {
  const cacheBuster = `_=${Date.now()}`;
  const separator = path.includes('?') ? '&' : '?';
  const pathWithCacheBuster = `${path}${separator}${cacheBuster}`;
  const authSeparator = pathWithCacheBuster.includes('?') ? '&' : '?';
  const url = isReadAccessToken(token)
    ? `${TMDB_API_BASE}${pathWithCacheBuster}`
    : `${TMDB_API_BASE}${pathWithCacheBuster}${authSeparator}api_key=${encodeURIComponent(token)}`;

  const response = await fetch(url, {
    cache: 'no-store',
    headers: isReadAccessToken(token)
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json;charset=utf-8',
          'Cache-Control': 'no-cache',
        }
      : {
          'Cache-Control': 'no-cache',
        },
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
  const firstProfilePath = person.profile_path || profiles[0]?.file_path;
  const profileCount = Math.max(profiles.length, person.profile_path ? 1 : 0);

  return {
    personId: person.id,
    name: person.name,
    hasProfilePhoto: profileCount > 0,
    profileImageCount: profileCount,
    existingProfileUrl: firstProfilePath ? `${TMDB_IMAGE_BASE}${firstProfilePath}` : undefined,
    checkedAt: Date.now(),
  };
}

async function findPersonByImdbId(imdbId: string, token: string): Promise<TmdbPersonPhotoCheck> {
  const findData = await tmdbFetch(`/find/${imdbId}?external_source=imdb_id`, token);
  const personResults = Array.isArray(findData.person_results) ? findData.person_results : [];

  if (personResults.length === 0) {
    return {
      hasProfilePhoto: false,
      checkedAt: Date.now(),
      error: `No TMDB person found for IMDb ID "${imdbId}"`,
    };
  }

  return fetchPersonDetails(personResults[0].id, token);
}

async function searchAndFetchPerson(name: string, token: string): Promise<TmdbPersonPhotoCheck> {
  const searchData = await tmdbFetch(`/search/person?query=${encodeURIComponent(name)}`, token);
  const results = Array.isArray(searchData.results) ? searchData.results : [];

  if (results.length === 0) {
    return {
      hasProfilePhoto: false,
      checkedAt: Date.now(),
      error: `No person found matching "${name}"`,
    };
  }

  return fetchPersonDetails(results[0].id, token);
}

function getMockResponse(input: string): TmdbPersonPhotoCheck {
  const cleanInput = input.trim();
  const personId = extractPersonIdFromUrl(cleanInput);
  const imdbId = extractImdbPersonId(cleanInput);
  const nameFromUrl = personId
    ? cleanInput.split('/person/')[1]?.split('-').slice(1).join(' ')
    : cleanInput;

  return {
    personId: personId || undefined,
    name: titleCase(imdbId || nameFromUrl || 'Unknown person'),
    hasProfilePhoto: false,
    profileImageCount: 0,
    checkedAt: Date.now(),
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

function toTmdbSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
