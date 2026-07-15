import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Facility, FacilityStatus } from '../../../core/models/facility';
import { FacilityList } from './facility-list';

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
    status: FacilityStatus.Active,
    lastUpdated: '2026-06-28T14:32:00.000Z',
    latitude: 6.6885,
    longitude: -1.6244,
  },
  {
    id: 'fac-003',
    name: 'Takoradi Port Warehouse',
    type: 'Warehouse',
    status: FacilityStatus.Maintenance,
    lastUpdated: '2026-07-05T11:00:00.000Z',
    latitude: 4.8845,
    longitude: -1.7554,
  },
  {
    id: 'fac-004',
    name: 'Winneba Retail Outlet',
    type: 'Retail Outlet',
    status: FacilityStatus.Inactive,
    lastUpdated: '2026-03-11T10:00:00.000Z',
    latitude: 5.351,
    longitude: -0.6231,
  },
];

/** Reaches past the component's protected signal to drive the status filter without the p-select overlay. */
function setStatusFilter(component: FacilityList, status: FacilityStatus | null): void {
  (
    component as unknown as { statusFilter: { set(value: FacilityStatus | null): void } }
  ).statusFilter.set(status);
}

describe('FacilityList', () => {
  let component: FacilityList;
  let fixture: ComponentFixture<FacilityList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilityList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(FacilityList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  function rowNames(): string[] {
    const rows: NodeListOf<HTMLTableRowElement> =
      fixture.nativeElement.querySelectorAll('tbody tr');
    return (
      Array.from(rows)
        // The empty-message row is a single <td colspan="5">, not a data row — skip it.
        .filter((row) => row.querySelectorAll('td').length > 1)
        .map((row) => row.querySelector('td')?.textContent?.trim())
        .filter((name): name is string => !!name)
    );
  }

  /** Satisfies the pending initial request and waits past the service's simulated latency. */
  async function flushInitialLoad(facilities: Facility[] = MOCK_FACILITIES): Promise<void> {
    httpMock.expectOne('data/facilities.json').flush(facilities);
    // FacilityService adds ~600ms of simulated latency after the HTTP response,
    // which whenStable() doesn't track in this zoneless app — wait past it explicitly.
    await new Promise((resolve) => setTimeout(resolve, 700));
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
    httpMock.expectOne('data/facilities.json').flush(MOCK_FACILITIES);
  });

  it('shows a loading skeleton while the initial request is pending', async () => {
    expect(fixture.nativeElement.querySelectorAll('p-skeleton').length).toBeGreaterThan(0);

    await flushInitialLoad();
  });

  it('shows a retry-capable error message when the request fails', async () => {
    httpMock
      .expectOne('data/facilities.json')
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Something went wrong while loading facilities.',
    );

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    retryButton.click();
    // retry() clears ?simulateError first via router.navigate(), then reloads once
    // that resolves — let the navigation microtask settle before the new GET fires.
    await fixture.whenStable();
    fixture.detectChanges();

    await flushInitialLoad();

    expect(rowNames().length).toBe(MOCK_FACILITIES.length);
  });

  describe('once facilities are loaded', () => {
    beforeEach(async () => {
      await flushInitialLoad();
    });

    it('renders every facility when no filters are applied', () => {
      expect(rowNames()).toEqual([
        'Accra Central Distribution Hub',
        'Kumasi Retail Outlet',
        'Takoradi Port Warehouse',
        'Winneba Retail Outlet',
      ]);
    });

    it('filters by name, case-insensitively', () => {
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[pInputText]');
      input.value = 'retail';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(rowNames()).toEqual(['Kumasi Retail Outlet', 'Winneba Retail Outlet']);
    });

    it('filters by status', () => {
      setStatusFilter(component, FacilityStatus.Active);
      fixture.detectChanges();

      expect(rowNames()).toEqual(['Accra Central Distribution Hub', 'Kumasi Retail Outlet']);
    });

    it('combines name search and status filter', () => {
      setStatusFilter(component, FacilityStatus.Active);
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[pInputText]');
      input.value = 'kumasi';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(rowNames()).toEqual(['Kumasi Retail Outlet']);
    });

    it('shows an empty message when nothing matches', () => {
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[pInputText]');
      input.value = 'nonexistent facility';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(rowNames()).toEqual([]);
      expect(fixture.nativeElement.textContent).toContain(
        'No facilities match your search or filter.',
      );
    });

    it('paginates results using the p-table paginator', () => {
      const paginator = fixture.nativeElement.querySelector('.p-paginator');
      expect(paginator).toBeTruthy();
    });
  });
});
