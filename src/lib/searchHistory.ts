import type { TmdbPersonPhotoCheck } from './tmdb';

export type PersonSearchHistoryItem = {
  id: string;
  name: string;
  personId?: number;
  thumbnailUrl?: string;
  hasProfilePhoto: boolean;
  profileImageCount: number;
  searchedAt: number;
};

const HISTORY_KEY = 'tmdb_person_search_history';
const MAX_HISTORY_ITEMS = 8;

export function loadPersonSearchHistory(): PersonSearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePersonSearchToHistory(result: TmdbPersonPhotoCheck, fallbackName: string): PersonSearchHistoryItem[] {
  const name = (result.name || fallbackName || 'Unknown person').trim();
  const nextItem: PersonSearchHistoryItem = {
    id: String(result.personId || name.toLowerCase()),
    name,
    personId: result.personId,
    thumbnailUrl: result.existingProfileUrl,
    hasProfilePhoto: result.hasProfilePhoto,
    profileImageCount: result.profileImageCount ?? 0,
    searchedAt: Date.now(),
  };

  const existing = loadPersonSearchHistory().filter((item) => item.id !== nextItem.id);
  const nextHistory = [nextItem, ...existing].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

export function clearPersonSearchHistory(): PersonSearchHistoryItem[] {
  localStorage.removeItem(HISTORY_KEY);
  return [];
}
