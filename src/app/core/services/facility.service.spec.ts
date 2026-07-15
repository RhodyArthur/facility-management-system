import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { Facility, FacilityStatus } from '../models/facility';
import { FacilityService } from './facility.service';

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
  {
    id: 'fac-002',
    name: 'Kumasi Retail Outlet',
    type: 'Retail Outlet',
    status: FacilityStatus.Maintenance,
    lastUpdated: '2026-06-28T14:32:00.000Z',
    latitude: 6.6885,
    longitude: -1.6244,
  },
];

describe('FacilityService', () => {
  let service: FacilityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FacilityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    history.pushState(null, '', '/');
  });

  function flushFacilities(): void {
    // Flush a fresh copy each time — the service caches its own store, and a
    // shared array reference here would let one test's mutations leak into another.
    httpMock.expectOne('data/facilities.json').flush(MOCK_FACILITIES.map((facility) => ({ ...facility })));
  }

  it('getAll() resolves with every facility from the dataset', async () => {
    const result$ = firstValueFrom(service.getAll());
    flushFacilities();

    await expect(result$).resolves.toEqual(MOCK_FACILITIES);
  });

  it('getAll() fetches the dataset only once across multiple calls', async () => {
    const first$ = firstValueFrom(service.getAll());
    flushFacilities();
    await first$;

    await expect(firstValueFrom(service.getAll())).resolves.toEqual(MOCK_FACILITIES);
    httpMock.expectNone('data/facilities.json');
  });

  it('getById() resolves with the matching facility', async () => {
    const result$ = firstValueFrom(service.getById('fac-002'));
    flushFacilities();

    await expect(result$).resolves.toEqual(MOCK_FACILITIES[1]);
  });

  it('getById() rejects when no facility matches', async () => {
    const result$ = firstValueFrom(service.getById('missing'));
    flushFacilities();

    await expect(result$).rejects.toThrow('Facility "missing" was not found.');
  });

  it('update() merges the changes and refreshes lastUpdated', async () => {
    const result$ = firstValueFrom(
      service.update({
        id: 'fac-001',
        name: 'Accra Central Distribution Hub',
        type: 'Distribution Center',
        status: FacilityStatus.Inactive,
        latitude: 5.61,
        longitude: -0.19,
      }),
    );
    flushFacilities();
    const updated = await result$;

    expect(updated.status).toBe(FacilityStatus.Inactive);
    expect(updated.latitude).toBe(5.61);
    expect(updated.longitude).toBe(-0.19);
    expect(new Date(updated.lastUpdated).getTime()).toBeGreaterThan(
      new Date(MOCK_FACILITIES[0].lastUpdated).getTime(),
    );
  });

  it('update() is reflected by subsequent reads', async () => {
    const update$ = firstValueFrom(
      service.update({
        id: 'fac-002',
        name: 'Kumasi Retail Outlet',
        type: 'Retail Outlet',
        status: FacilityStatus.Active,
        latitude: 6.6885,
        longitude: -1.6244,
      }),
    );
    flushFacilities();
    await update$;

    const refetched = await firstValueFrom(service.getById('fac-002'));
    expect(refetched.status).toBe(FacilityStatus.Active);
  });

  it('update() rejects when no facility matches', async () => {
    const result$ = firstValueFrom(
      service.update({
        id: 'missing',
        name: 'Ghost Facility',
        type: 'Office',
        status: FacilityStatus.Active,
        latitude: 0,
        longitude: 0,
      }),
    );
    flushFacilities();

    await expect(result$).rejects.toThrow('Facility "missing" was not found.');
  });

  it('rejects with a simulated error when ?simulateError=true is present in the URL', async () => {
    history.pushState(null, '', '/?simulateError=true');

    const result$ = firstValueFrom(service.getAll());
    flushFacilities();

    await expect(result$).rejects.toThrow(
      'Simulated network error while contacting the facilities service.',
    );
  });
});
