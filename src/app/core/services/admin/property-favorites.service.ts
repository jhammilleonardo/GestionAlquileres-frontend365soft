import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PropertyFavoritesService {
  private readonly storageKey = 'property_favorites';

  load(): Set<number> {
    try {
      const stored = localStorage.getItem(this.storageKey);

      if (!stored) {
        return new Set();
      }

      const ids = JSON.parse(stored) as unknown;

      if (!Array.isArray(ids)) {
        return new Set();
      }

      return new Set(ids.filter((id): id is number => typeof id === 'number'));
    } catch {
      return new Set();
    }
  }

  save(favorites: Set<number>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(favorites)));
    } catch {
      /* ignore storage errors */
    }
  }
}
