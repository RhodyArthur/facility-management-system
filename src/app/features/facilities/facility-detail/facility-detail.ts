import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

import { FACILITY_STATUS_SEVERITY, Facility, FacilityStatus } from '../../../core/models/facility';
import { FacilityService } from '../../../core/services/facility.service';
import { FacilityMap } from '../facility-map/facility-map';

@Component({
  selector: 'app-facility-detail',
  imports: [DatePipe, RouterLink, ButtonModule, MessageModule, SkeletonModule, TagModule, FacilityMap],
  templateUrl: './facility-detail.html',
})
export class FacilityDetail {
  private readonly facilityService = inject(FacilityService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();
  // Bound automatically from the list's query params via withComponentInputBinding(),
  // so "Back to list" can restore the search/filter the user came from.
  readonly search = input<string | null>(null);
  readonly status = input<FacilityStatus | null>(null);

  protected readonly skeletonFields = [0, 1, 2, 3, 4];

  protected readonly facility = signal<Facility | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly backQueryParams = computed(() => ({
    search: this.search() || null,
    status: this.status() || null,
  }));

  constructor() {
    effect(() => {
      this.loadFacility(this.id());
    });
  }

  protected statusSeverity(status: FacilityStatus): 'success' | 'danger' | 'warn' {
    return FACILITY_STATUS_SEVERITY[status];
  }

  private loadFacility(id: string): void {
    this.loading.set(true);
    this.error.set(false);
    this.facility.set(null);

    this.facilityService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (facility) => {
          this.facility.set(facility);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
