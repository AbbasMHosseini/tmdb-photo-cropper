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

export function getTmdbApiToken(): string | null {
  return localStorage.getItem('tmdb_api_token');
}

export function setTmdbApiToken(token: string): void {
  localStorage.setItem('tmdb_api_token', token);
}

export function clearTmdbApiToken(): void {
  localStorage.removeItem('tmdb_api_token');
}

export async function checkTmdbPersonPhoto(input: string): Promise<TmdbPersonPhotoCheck> {
  const token = getTmdbApiToken();

  // If no token, return mock response
  if (!token) {
    return getMockResponse(input);
  }

  try {
    const cleanInput = input.trim();
    const personId = extractPersonIdFromUrl(cleanInput);

    if (personId) {
      // Direct person ID lookup
      return await fetchPersonDetails(personId, token);
    } else {
      // Search by name
      return await searchAndFetchPerson(cleanInput, token);
    }
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
  if (match) {
    return Number(match[1]);
  }
  return null;
}

async function fetchPersonDetails(personId: number, token: string): Promise<TmdbPersonPhotoCheck> {
  const response = await fetch(
    `${TMDB_API_BASE}/person/${personId}?api_key=${token}`
  );

  if (!response.ok) {
    if (response.status === 401) {
      clearTmdbApiToken();
      throw new Error('Invalid API token. Please check your TMDB API key.');
    }
    throw new Error(`Person not found (${response.status})`);
  }

  const data = await response.json();
  const profileImageCount = data.profile_path ? 1 : 0;
  const existingProfileUrl = data.profile_path ? `${TMDB_IMAGE_BASE}${data.profile_path}` : undefined;

  return {
    personId: data.id,
    name: data.name,
    hasProfilePhoto: !!data.profile_path,
    profileImageCount,
    existingProfileUrl,
  };
}

async function searchAndFetchPerson(name: string, token: string): Promise<TmdbPersonPhotoCheck> {
  const searchResponse = await fetch(
    `${TMDB_API_BASE}/search/person?query=${encodeURIComponent(name)}&api_key=${token}`
  );

  if (!searchResponse.ok) {
    if (searchResponse.status === 401) {
      clearTmdbApiToken();
      throw new Error('Invalid API token. Please check your TMDB API key.');
    }
    throw new Error(`Search failed (${searchResponse.status})`);
  }

  const searchData = await searchResponse.json();
  const results = searchData.results || [];

  if (results.length === 0) {
    return {
      hasProfilePhoto: false,
      error: `No person found matching "${name}"`,
    };
  }

  // Use the first (best) result
  const person = results[0];
  const profileImageCount = person.profile_path ? 1 : 0;
  const existingProfileUrl = person.profile_path ? `${TMDB_IMAGE_BASE}${person.profile_path}` : undefined;

  return {
    personId: person.id,
    name: person.name,
    hasProfilePhoto: !!person.profile_path,
    profileImageCount,
    existingProfileUrl,
  };
}

function getMockResponse(input: string): TmdbPersonPhotoCheck {
  const cleanInput = input.trim();
  const personId = extractPersonIdFromUrl(cleanInput);
  const nameFromUrl = personId
    ? cleanInput.split('/person/')[1]?.split('-').slice(1).join(' ')
    : cleanInput;

  return {
    personId,
    name: titleCase(nameFromUrl || 'Unknown person'),
    hasProfilePhoto: false,
    profileImageCount: 0,
    error: 'No API token configured. Set your TMDB API token to check real person data.',
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
