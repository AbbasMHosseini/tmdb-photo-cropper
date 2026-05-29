export type TmdbPersonPhotoCheck = {
  personId?: number;
  name?: string;
  hasProfilePhoto: boolean;
  profileImageCount?: number;
  existingProfileUrl?: string;
  checkedAt?: number;
  error?: string;
};

export type TmdbDirector = {
  id: number;
  name: string;
  matched: boolean;
};

export type TmdbMovieLookupResult = {
  movieId: number;
  title: string;
  originalTitle?: string;
  releaseDate?: string;
  releaseYear?: string;
  overview?: string;
  posterUrl?: string;
  posterLargeUrl?: string;
  tmdbMovieUrl: string;
  imdbUrl?: string;
  directors: TmdbDirector[];
  matchedDirector: boolean;
};

export type TmdbMovieLookupResponse = {
  queryTitle: string;
  queryDirector?: string;
  results: TmdbMovieLookupResult[];
  error?: string;
};

type MovieLookupCandidate = {
  title: string;
  director?: string;
  score: number;
};

type TmdbMovieRecord = Record<string, any>;

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
  const cleanInput = input.trim();
  const movieId = extractMovieIdFromInput(cleanInput);
  const candidates = buildMovieLookupCandidates(input);
  const primaryCandidate = candidates[0];

  if (!cleanInput) {
    return {
      queryTitle: '',
      queryDirector: '',
      results: [],
      error: 'Enter a film title first.',
    };
  }

  if (!token) {
    return {
      queryTitle: primaryCandidate?.title || cleanInput,
      queryDirector: primaryCandidate?.director,
      results: [],
      error: 'No TMDB API credential configured. Use the API button to save one in this browser.',
    };
  }

  try {
    if (movieId) {
      const movie = await fetchMovieLookupById(movieId, token);
      return {
        queryTitle: movie.title,
        queryDirector: '',
        results: [movie],
      };
    }

    if (!primaryCandidate?.title) {
      return {
        queryTitle: '',
        queryDirector: '',
        results: [],
        error: 'Enter a film title first.',
      };
    }

    const collected = new Map<number, TmdbMovieLookupResult>();
    let bestQueryTitle = primaryCandidate.title;
    let bestQueryDirector = primaryCandidate.director;

    for (const candidate of candidates) {
      const searchData = await tmdbFetch(`/search/movie?query=${encodeURIComponent(candidate.title)}`, token);
      const movies = Array.isArray(searchData.results) ? searchData.results.slice(0, 6) : [];

      if (movies.length === 0) continue;

      const hydratedResults = await Promise.all(
        movies.map(async (movie: TmdbMovieRecord) => hydrateMovieResult(movie, candidate, token)),
      );

      hydratedResults.forEach((movie) => {
        const existing = collected.get(movie.movieId);
        if (!existing || Number(movie.matchedDirector) > Number(existing.matchedDirector)) {
          collected.set(movie.movieId, movie);
        }
      });

      const hasDirectorMatch = hydratedResults.some((movie) => movie.matchedDirector);
      if (hasDirectorMatch) {
        bestQueryTitle = candidate.title;
        bestQueryDirector = candidate.director;
        break;
      }

      if (collected.size >= 6 && candidate.score < 80) break;
    }

    const results = sortMovieResults(Array.from(collected.values())).slice(0, 6);

    if (results.length === 0) {
      return {
        queryTitle: primaryCandidate.title,
        queryDirector: primaryCandidate.director,
        results: [],
        error: `No movie found matching "${input.trim()}"`,
      };
    }

    return {
      queryTitle: bestQueryTitle,
      queryDirector: bestQueryDirector,
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      queryTitle: primaryCandidate?.title || cleanInput,
      queryDirector: primaryCandidate?.director,
      results: [],
      error: `Failed to search TMDB movies: ${errorMessage}`,
    };
  }
}

function buildMovieLookupCandidates(input: string): MovieLookupCandidate[] {
  const cleanInput = input.trim().replace(/\r\n/g, '\n');
  if (!cleanInput) return [];

  const firstLine = cleanInput.split('\n').find(Boolean) || cleanInput;
  const splitPatterns = [/\t+/, / {2,}/, /\s+\|\s+/, /\s+-\s+/];
  const candidates: MovieLookupCandidate[] = [];

  for (const pattern of splitPatterns) {
    const parts = firstLine.split(pattern).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      candidates.push({ title: parts[0], director: parts.slice(1).join(' '), score: 120 });
      break;
    }
  }

  const words = firstLine.split(/\s+/).map((word) => word.trim()).filter(Boolean);

  if (words.length > 1) {
    for (let index = Math.min(words.length - 1, 5); index >= 1; index -= 1) {
      const title = words.slice(0, index).join(' ');
      const director = words.slice(index).join(' ');
      candidates.push({ title, director, score: 100 - Math.abs(index - 2) * 6 });
    }
  }

  candidates.push({ title: firstLine.trim(), director: '', score: 70 });

  const uniqueCandidates = new Map<string, MovieLookupCandidate>();
  candidates.forEach((candidate) => {
    const key = `${normalizeName(candidate.title)}|${normalizeName(candidate.director || '')}`;
    if (!uniqueCandidates.has(key)) uniqueCandidates.set(key, candidate);
  });

  return Array.from(uniqueCandidates.values()).filter((candidate) => candidate.title.length > 0);
}

async function fetchMovieLookupById(movieId: number, token: string): Promise<TmdbMovieLookupResult> {
  const movie = await tmdbFetch(`/movie/${movieId}`, token);
  const title = String(movie.title || movie.name || movieId);
  return hydrateMovieResult(movie, { title, director: '', score: 130 }, token);
}

async function hydrateMovieResult(
  movie: TmdbMovieRecord,
  candidate: MovieLookupCandidate,
  token: string,
): Promise<TmdbMovieLookupResult> {
  const [credits, externalIds] = await Promise.all([
    tmdbFetch(`/movie/${movie.id}/credits`, token),
    tmdbFetch(`/movie/${movie.id}/external_ids`, token),
  ]);
  const crew = Array.isArray(credits.crew) ? credits.crew : [];
  const directors = crew
    .filter((person: TmdbMovieRecord) => String(person.job || '').toLowerCase() === 'director')
    .map((person: TmdbMovieRecord) => ({
      id: Number(person.id),
      name: String(person.name || 'Unknown director'),
      matched: directorMatches(person.name, candidate.director),
    }));
  const title = String(movie.title || movie.name || 'Untitled');
  const releaseDate = typeof movie.release_date === 'string' && movie.release_date.length > 0
    ? movie.release_date
    : undefined;
  const releaseYear = releaseDate && releaseDate.length >= 4 ? releaseDate.slice(0, 4) : undefined;
  const imdbId = typeof externalIds.imdb_id === 'string' ? externalIds.imdb_id : undefined;

  return {
    movieId: Number(movie.id),
    title,
    originalTitle: movie.original_title,
    releaseDate,
    releaseYear,
    overview: movie.overview,
    posterUrl: movie.poster_path ? `${TMDB_POSTER_BASE}${movie.poster_path}` : undefined,
    posterLargeUrl: movie.poster_path ? `${TMDB_POSTER_LARGE_BASE}${movie.poster_path}` : undefined,
    tmdbMovieUrl: buildTmdbMovieUrl(Number(movie.id), title),
    imdbUrl: imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined,
    directors,
    matchedDirector: directors.some((director: TmdbDirector) => director.matched),
  };
}

function sortMovieResults(results: TmdbMovieLookupResult[]) {
  return [...results].sort((a, b) => {
    const matchDiff = Number(b.matchedDirector) - Number(a.matchedDirector);
    if (matchDiff !== 0) return matchDiff;

    const dateDiff = getReleaseTime(b.releaseDate) - getReleaseTime(a.releaseDate);
    if (dateDiff !== 0) return dateDiff;

    return b.movieId - a.movieId;
  });
}

function getReleaseTime(releaseDate?: string) {
  if (!releaseDate) return 0;
  const time = new Date(releaseDate).getTime();
  return Number.isFinite(time) ? time : 0;
}

function directorMatches(name: unknown, queryDirector?: string) {
  if (!queryDirector) return false;
  const normalizedName = normalizeName(String(name || ''));
  const normalizedQuery = normalizeName(queryDirector);
  return normalizedName === normalizedQuery || normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName);
}

function extractMovieIdFromInput(input: string): number | null {
  const tmdbUrlMatch = input.match(/themoviedb\.org\/movie\/(\d+)/);
  if (tmdbUrlMatch) return Number(tmdbUrlMatch[1]);

  const pathMatch = input.match(/^(?:movie|m)\/(\d+)(?:-[a-z0-9-]+)?$/i);
  if (pathMatch) return Number(pathMatch[1]);

  const directIdMatch = input.match(/^(\d+)(?:-[a-z0-9-]+)?$/i);
  return directIdMatch ? Number(directIdMatch[1]) : null;
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
