import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { Facility, FacilityStatus } from '../../../core/models/facility';
import { FacilityDetail } from './facility-detail';
import { FacilityMap } from '../facility-map/facility-map';

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

// jsdom doesn't implement ResizeObserver, which the embedded FacilityMap's
// OpenLayers map uses internally.
/* eslint-disable @typescript-eslint/no-empty-function */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
/* eslint-enable @typescript-eslint/no-empty-function */

describe('FacilityDetail', () => {
  let component: FacilityDetail;
  let fixture: ComponentFixture<FacilityDetail>;
  let httpMock: HttpTestingController;

  beforeAll(() => {
    globalThis.ResizeObserver ??= ResizeObserverStub;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilityDetail],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(FacilityDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'fac-001');
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  async function flushFacilities(): Promise<void> {
    httpMock.expectOne('data/facilities.json').flush(MOCK_FACILITIES);
    // FacilityService adds ~600ms of simulated latency, which whenStable() doesn't
    // track in this zoneless app — wait past it explicitly.
    await new Promise((resolve) => setTimeout(resolve, 700));
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
    httpMock.expectOne('data/facilities.json').flush(MOCK_FACILITIES);
  });

  it('renders the requested facility once loaded', async () => {
    await flushFacilities();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Accra Central Distribution Hub');
    expect(text).toContain('Distribution Center');
    expect(text).toContain('5.6037');
    expect(text).toContain('-0.187');
  });

  it('renders the map with the facility coordinates', async () => {
    await flushFacilities();

    const map = fixture.debugElement.query(By.directive(FacilityMap))?.componentInstance as
      | FacilityMap
      | undefined;

    expect(map).toBeTruthy();
    expect(map?.latitude()).toBe(5.6037);
    expect(map?.longitude()).toBe(-0.187);
    expect(fixture.nativeElement.querySelector('.ol-viewport')).toBeTruthy();
  });

  it('shows an error message when the facility fails to load', async () => {
    httpMock.expectOne('data/facilities.json').flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Something went wrong while loading this facility.');
  });

  it('carries the incoming search/status query params into the back and edit links', async () => {
    fixture.componentRef.setInput('search', 'retail');
    fixture.componentRef.setInput('status', FacilityStatus.Active);
    await flushFacilities();

    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    const backLink = links.find((link) => link.textContent?.includes('Back to list'));
    expect(backLink?.getAttribute('href')).toBe('/facilities?search=retail&status=ACTIVE');
  });
});
