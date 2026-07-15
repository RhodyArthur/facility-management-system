import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';

import { FACILITY_STATUS_OPTIONS, FacilityStatus } from '../../../core/models/facility';
import { FacilityService } from '../../../core/services/facility.service';

@Component({
  selector: 'app-facility-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    SkeletonModule,
  ],
  templateUrl: './facility-edit.html',
})
export class FacilityEdit {
  private readonly facilityService = inject(FacilityService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly id = input.required<string>();
  readonly search = input<string | null>(null);
  readonly status = input<FacilityStatus | null>(null);

  protected readonly statusOptions = FACILITY_STATUS_OPTIONS;
  protected readonly skeletonFields = [0, 1, 2, 3, 4];

  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  readonly submitting = signal(false);

  protected readonly redirectQueryParams = computed(() => ({
    search: this.search() || null,
    status: this.status() || null,
  }));

  readonly form = this.formBuilder.group({
    name: this.formBuilder.control('', Validators.required),
    type: this.formBuilder.control('', Validators.required),
    status: this.formBuilder.control(FacilityStatus.Active, Validators.required),
    latitude: this.formBuilder.control(0, [
      Validators.required,
      Validators.min(-90),
      Validators.max(90),
    ]),
    longitude: this.formBuilder.control(0, [
      Validators.required,
      Validators.min(-180),
      Validators.max(180),
    ]),
  });

  constructor() {
    effect(() => {
      this.loadFacility(this.id());
    });
  }

  save(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const values = this.form.getRawValue();

    this.facilityService
      .update({ id: this.id(), ...values })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Facility updated',
            detail: `${values.name} has been saved.`,
          });
          this.router.navigate(['/facilities', this.id()], {
            queryParams: this.redirectQueryParams(),
          });
        },
        error: () => {
          this.submitting.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Save failed',
            detail: 'Something went wrong while saving. Please try again.',
          });
        },
      });
  }

  private loadFacility(id: string): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.facilityService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (facility) => {
          this.form.patchValue(facility);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }
}
