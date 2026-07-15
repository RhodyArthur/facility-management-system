import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { Router, provideRouter } from '@angular/router';

import { Facility, FacilityStatus } from '../../../core/models/facility';
import { FacilityEdit } from './facility-edit';

const MOCK_FACILITIES: Facility[] = [
  {
    id: 'fac-001',
    name: 'Accra Central Distribution Hub',
    type: 'Distribution Center',
    status: FacilityStatus.Active,
    lastUpdated: '2026-07-01T09:15:00.000Z',
    latitude: 5.6037,
    longitude: -0.187,
  },
];

describe('FacilityEdit', () => {
  let component: FacilityEdit;
  let fixture: ComponentFixture<FacilityEdit>;
  let httpMock: HttpTestingController;
  let messageService: MessageService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilityEdit],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService);
    vi.spyOn(messageService, 'add');
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(FacilityEdit);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'fac-001');
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** Satisfies the initial load request and waits past FacilityService's simulated latency. */
  async function flushInitialLoad(): Promise<void> {
    httpMock.expectOne('data/facilities.json').flush(MOCK_FACILITIES);
    await new Promise((resolve) => setTimeout(resolve, 700));
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
    httpMock.expectOne('data/facilities.json').flush(MOCK_FACILITIES);
  });

  it('prefills the form with the loaded facility', async () => {
    await flushInitialLoad();

    expect(component.form.getRawValue()).toEqual({
      name: 'Accra Central Distribution Hub',
      type: 'Distribution Center',
      status: FacilityStatus.Active,
      latitude: 5.6037,
      longitude: -0.187,
    });
  });

  it('shows a required-field message once a field is touched and empty', async () => {
    await flushInitialLoad();

    component.form.controls.name.setValue('');
    component.form.controls.name.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Name is required.');
  });

  it('shows a range validation message for out-of-bounds latitude', async () => {
    await flushInitialLoad();

    component.form.controls.latitude.setValue(120);
    component.form.controls.latitude.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Latitude must be between -90 and 90.');
  });

  it('does not save and marks fields touched when the form is invalid', async () => {
    await flushInitialLoad();

    component.form.controls.name.setValue('');
    component.save();
    fixture.detectChanges();

    httpMock.expectNone((req) => req.method !== 'GET');
    expect(component.form.controls.name.touched).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Name is required.');
  });

  it('disables the save button while submitting, then redirects on success', async () => {
    await flushInitialLoad();

    component.form.controls.name.setValue('Updated Name');
    component.save();
    fixture.detectChanges();

    expect(component.submitting()).toBe(true);
    const saveButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[type="submit"]');
    expect(saveButton.disabled).toBe(true);

    // update() reuses the already-loaded in-memory store — no further HTTP request needed.
    await new Promise((resolve) => setTimeout(resolve, 700));
    fixture.detectChanges();

    expect(component.submitting()).toBe(false);
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' }),
    );
    expect(router.navigate).toHaveBeenCalledWith(
      ['/facilities', 'fac-001'],
      expect.objectContaining({ queryParams: { search: null, status: null } }),
    );
  });

  it('carries incoming search/status query params into the cancel link', async () => {
    fixture.componentRef.setInput('search', 'retail');
    fixture.componentRef.setInput('status', FacilityStatus.Active);
    await flushInitialLoad();

    const cancelLink: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(cancelLink.getAttribute('href')).toBe('/facilities/fac-001?search=retail&status=ACTIVE');
  });
});
