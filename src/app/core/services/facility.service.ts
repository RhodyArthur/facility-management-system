import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, shareReplay, switchMap, tap } from 'rxjs';

import { Facility, FacilityUpdate } from '../models/facility';

/**
 * Retrieves and updates facilities. Backed by a static JSON asset today, but the
 * Observable-based contract means swapping in a real HTTP API later is a one-file change.
 */
@Injectable({ providedIn: 'root' })
export class FacilityService {
  private readonly http = inject(HttpClient);

  private readonly dataUrl = 'data/facilities.json';
  private readonly simulatedLatencyMs = 600;

  private store: Facility[] = [];
  private loaded$?: Observable<Facility[]>;

  getAll(): Observable<Facility[]> {
    return this.ensureLoaded().pipe(switchMap(() => this.simulate(() => [...this.store])));
  }

  getById(id: string): Observable<Facility> {
    return this.ensureLoaded().pipe(
      switchMap(() =>
        this.simulate(() => {
          const facility = this.store.find((item) => item.id === id);
          if (!facility) {
            throw new Error(`Facility "${id}" was not found.`);
          }
          return facility;
        }),
      ),
    );
  }

  update(changes: FacilityUpdate): Observable<Facility> {
    return this.ensureLoaded().pipe(
      switchMap(() =>
        this.simulate(() => {
          const index = this.store.findIndex((item) => item.id === changes.id);
          if (index === -1) {
            throw new Error(`Facility "${changes.id}" was not found.`);
          }
          const updated: Facility = {
            ...this.store[index],
            ...changes,
            lastUpdated: new Date().toISOString(),
          };
          this.store[index] = updated;
          return updated;
        }),
      ),
    );
  }

  private ensureLoaded(): Observable<Facility[]> {
    if (!this.loaded$) {
      this.loaded$ = this.http.get<Facility[]>(this.dataUrl).pipe(
        tap((facilities) => (this.store = facilities)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.loaded$;
  }

  /** Adds artificial network latency and, when enabled, throws to exercise error states. */
  private simulate<T>(produce: () => T): Observable<T> {
    return of(null).pipe(
      delay(this.simulatedLatencyMs),
      map(() => {
        if (this.shouldSimulateError()) {
          throw new Error('Simulated network error while contacting the facilities service.');
        }
        return produce();
      }),
    );
  }

  /** Enabled via `?simulateError=true` in the URL, e.g. to test the list/detail error states. */
  private shouldSimulateError(): boolean {
    return new URLSearchParams(window.location.search).get('simulateError') === 'true';
  }
}
