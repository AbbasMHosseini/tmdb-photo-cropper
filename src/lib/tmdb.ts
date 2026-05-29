export type TmdbPersonPhotoCheck = {
  personId?: number;
  name?: string;
  hasProfilePhoto: boolean;
  profileImageCount?: number;
  existingProfileUrl?: string;
  checkedAt?: number;
  error?: string;
};

export type TmdbMovieLookupResult = {
  movieId: number;
  title: string;
  originalTitle?: string;
  releaseYear?: string;
  overview?: string;
  posterUrl?: string;
  posterLargeUrl?: string;
  tmdbMovieUrl: string;
  posterPageUrl: string;
  directorName?: string;
  directorPersonId?: number;
  matchedDirector: boolean;
};

export type TmdbMovieLookupResponse = {
  queryTitle: string;
  queryDirector?: string;
  results: TmdbMovieLookupResult[];
  error?: string;
};

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const TMDB_POSTER_LARGE_BASE = 'https://image.tmdb.org/t/p/w780';
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

export function buildTmdbPersonInput(personPath: string) {
  const cleanPath = personPath.trim().replace(/^\/+|\/+$/g, '');
  const match = cleanPath.match(/^(\d+)(?:-[a-z0-9-]+)?$/i);
  if (!match) return cleanPath;
  return `https://www.themoviedb.org/person/${cleanPath}`;
}

export function buildTmdbMovieUrl(movieId: number, title?: string) {
  const slug = toTmdbSlug(title || '');
  const moviePath = slug ? `${movieId}-${slug}` : String(movieId);
  return `https://www.themoviedb.org/movie/${moviePath}`;
}

export function buildTmdbMoviePosterUrl(movieId: number, title?: string) {
  return `${buildTmdbMovieUrl(movieId, title)}/images/posters`;
}

export async function checkTmdbPersonPhoto(input: string): Promise<TmdbPersonPhotoCheck> {
  const token = getTmdbApiToken();

  if (!token) {
    return getMockResponse(input);
  }

  try {
    const cleanInput = input.trim();
    const personId = extractPersonIdFromInput(cleanInput);
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

export async function lookupTmdbMovie(input: string): Promise<TmdbMovieLookupResponse> {
  const token = getTmdbApiToken();
  const parsed = parseMovieLookupInput(input);

  if (!parsed.title) {
    return {
      queryTitle: '',
      queryDirector: parsed.director,
      results: [],
      error: 'Enter a film title first.',
    };
  }

  if (!token) {
    return {
      queryTitle: parsed.title,
      queryDirector: parsed.director,
      results: [],
      error: 'No TMDB API credential configured. Use the API button to save one in this browser.',
    };
  }

  try {
    const searchData = await tmdbFetch(`/search/movie?query=${encodeURIComponent(parsed.title)}`, token);
    const movies = Array.isArray(searchData.results) ? searchData.results.slice(0, 8) : [];

    if (movies.length === 0) {
      return {
        queryTitle: parsed.title,
        queryDirector: parsed.director,
        results: [],
        error: `No movie found matching "${parsed.title}"`,
      };
    }

    const hydratedResults = await Promise.all(
      movies.map(async (movie: Record<string, any>) => hydrateMovieResult(movie, parsed.director, token)),
    );

    const sortedResults = hydratedResults
      .sort((a, b) => Number(b.matchedDirector) - Number(a.matchedDirector))
      .slice(0, 6);

    return {
      queryTitle: parsed.title,
      queryDirector: parsed.director,
      results: sortedResults,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      queryTitle: parsed.title,
      queryDirector: parsed.director,
      results: [],
      error: `Failed to search TMDB movies: ${errorMessage}`,
    };
  }
}

function parseMovieLookupInput(input: string) {
  const cleanInput = input.trim().replace(/\r\n/g, '\n');
  if (!cleanInput) return { title: '', director: '' };

  const firstLine = cleanInput.split('\n').find(Boolean) || cleanInput;
  const splitPatterns = [/\t+/, / {2,}/, /\s+\|\s+/, /\s+-\s+/];

  for (const pattern of splitPatterns) {
    const parts = firstLine.split(pattern).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return {
        title: parts[0],
        director: parts.slice(1).join(' '),
      };
    }
  }

  return {
    title: firstLine.trim(),
    director: '',
  };
}

async function hydrateMovieResult(
  movie: Record<string, any>,
  queryDirector: string | undefined,
  token: string,
): Promise<TmdbMovieLookupResult> {
  const credits = await tmdbFetch(`/movie/${movie.id}/credits`, token);
  const crew = Array.isArray(credits.crew) ? credits.crew : [];
  const directors = crew.filter((person: Record<string, any>) => String(person.job || '').toLowerCase() === 'director');
  const matchedDirector = findMatchingDirector(directors, queryDirector);
  const fallbackDirector = directors[0];
  const chosenDirector = matchedDirector || fallbackDirector;
  const title = String(movie.title || movie.name || 'Untitled');
  const releaseYear = typeof movie.release_date === 'string' && movie.release_date.length >= 4
    ? movie.release_date.slice(0, 4)
    : undefined;

  return {
    movieId: Number(movie.id),
    title,
    originalTitle: movie.original_title,
    releaseYear,
    overview: movie.overview,
    posterUrl: movie.poster_path ? `${TMDB_POSTER_BASE}${movie.poster_path}` : undefined,
    posterLargeUrl: movie.poster_path ? `${TMDB_POSTER_LARGE_BASE}${movie.poster_path}` : undefined,
    tmdbMovieUrl: buildTmdbMovieUrl(Number(movie.id), title),
    posterPageUrl: buildTmdbMoviePosterUrl(Number(movie.id), title),
    directorName: chosenDirector?.name,
    directorPersonId: chosenDirector?.id,
    matchedDirector: Boolean(matchedDirector),
  };
}

function findMatchingDirector(directors: Array<Record<string, any>>, queryDirector?: string) {
  if (!queryDirector) return undefined;
  const normalizedQuery = normalizeName(queryDirector);

  return directors.find((director) => {
    const normalizedName = normalizeName(String(director.name || ''));
    return normalizedName === normalizedQuery || normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName);
  });
}

function extractPersonIdFromInput(input: string): number | null {
  const tmdbUrlMatch = input.match(/themoviedb\.org\/person\/(\d+)/);
  if (tmdbUrlMatch) return Number(tmdbUrlMatch[1]);

  const directIdMatch = input.trim().match(/^(\d+)(?:-[a-z0-9-]+)?$/i);
  return directIdMatch ? Number(directIdMatch[1]) : null;
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
  const personId = extractPersonIdFromInput(cleanInput);
  const imdbId = extractImdbPersonId(cleanInput);
  const nameFromUrl = personId && cleanInput.includes('/person/')
    ? cleanInput.split('/person/')[1]?.split('-').slice(1).join(' ')
    : cleanInput.replace(/^\d+-?/, '');

  return {
    personId: personId || undefined,
    name: titleCase(imdbId || nameFromUrl || 'Unknown person'),
    hasProfilePhoto: false,
    profileImageCount: 0,
    checkedAt: Date.now(),
    error: 'No TMDB API credential configured. Use the API button to save one in this browser.',
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

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
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
