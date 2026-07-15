import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  FACILITY_STATUS_OPTIONS,
  FACILITY_STATUS_SEVERITY,
  Facility,
  FacilityStatus,
} from '../../../core/models/facility';
import { FacilityService } from '../../../core/services/facility.service';

@Component({
  selector: 'app-facility-list',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    SkeletonModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './facility-list.html',
})
export class FacilityList {
  private readonly facilityService = inject(FacilityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly statusOptions = FACILITY_STATUS_OPTIONS;
  protected readonly skeletonRows = [0, 1, 2, 3, 4];

  protected readonly searchTerm = signal(this.route.snapshot.queryParamMap.get('search') ?? '');
  protected readonly statusFilter = signal<FacilityStatus | null>(
    this.route.snapshot.queryParamMap.get('status') as FacilityStatus | null,
  );

  private readonly facilities = signal<Facility[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly filteredFacilities = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return this.facilities().filter(
      (facility) =>
        (!term || facility.name.toLowerCase().includes(term)) &&
        (!status || facility.status === status),
    );
  });

  /** Carried along to the detail/edit routes so "Back to list" can restore this exact view. */
  protected readonly queryParams = computed(() => ({
    search: this.searchTerm() || null,
    status: this.statusFilter() || null,
  }));

  constructor() {
    this.loadFacilities();

    effect(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: this.queryParams(),
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  protected retry(): void {
    this.loadFacilities();
  }

  protected statusSeverity(status: FacilityStatus): 'success' | 'danger' | 'warn' {
    return FACILITY_STATUS_SEVERITY[status];
  }

  private loadFacilities(): void {
    this.loading.set(true);
    this.error.set(false);

    this.facilityService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (facilities) => {
          this.facilities.set(facilities);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
