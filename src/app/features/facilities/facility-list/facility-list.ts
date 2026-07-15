import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { FacilityStatus } from '../../../core/models/facility';
import { FacilityService } from '../../../core/services/facility.service';

const STATUS_SEVERITY: Record<FacilityStatus, 'success' | 'danger' | 'warn'> = {
  [FacilityStatus.Active]: 'success',
  [FacilityStatus.Inactive]: 'danger',
  [FacilityStatus.Maintenance]: 'warn',
};

@Component({
  selector: 'app-facility-list',
  imports: [DatePipe, RouterLink, ButtonModule, TableModule, TagModule],
  templateUrl: './facility-list.html',
})
export class FacilityList {
  private readonly facilityService = inject(FacilityService);

  protected readonly facilities = toSignal(this.facilityService.getAll(), { initialValue: [] });

  protected statusSeverity(status: FacilityStatus): 'success' | 'danger' | 'warn' {
    return STATUS_SEVERITY[status];
  }
}
