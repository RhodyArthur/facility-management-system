import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { FACILITY_STATUS_OPTIONS, FacilityStatus } from '../../../core/models/facility';
import { FacilityService } from '../../../core/services/facility.service';

const STATUS_SEVERITY: Record<FacilityStatus, 'success' | 'danger' | 'warn'> = {
  [FacilityStatus.Active]: 'success',
  [FacilityStatus.Inactive]: 'danger',
  [FacilityStatus.Maintenance]: 'warn',
};

@Component({
  selector: 'app-facility-list',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './facility-list.html',
})
export class FacilityList {
  private readonly facilityService = inject(FacilityService);

  private readonly facilities = toSignal(this.facilityService.getAll(), { initialValue: [] });

  protected readonly statusOptions = FACILITY_STATUS_OPTIONS;
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<FacilityStatus | null>(null);

  protected readonly filteredFacilities = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return this.facilities().filter(
      (facility) =>
        (!term || facility.name.toLowerCase().includes(term)) &&
        (!status || facility.status === status),
    );
  });

  protected statusSeverity(status: FacilityStatus): 'success' | 'danger' | 'warn' {
    return STATUS_SEVERITY[status];
  }
}
