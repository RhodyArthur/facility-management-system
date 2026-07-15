import { ComponentFixture, TestBed } from '@angular/core/testing';
import Map from 'ol/Map';

import { FacilityMap } from './facility-map';

function getMap(component: FacilityMap): Map | undefined {
  return (component as unknown as { map?: Map }).map;
}

// jsdom doesn't implement ResizeObserver, which OpenLayers' Map uses internally.
/* eslint-disable @typescript-eslint/no-empty-function */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
/* eslint-enable @typescript-eslint/no-empty-function */

describe('FacilityMap', () => {
  let component: FacilityMap;
  let fixture: ComponentFixture<FacilityMap>;

  beforeAll(() => {
    globalThis.ResizeObserver ??= ResizeObserverStub;
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilityMap],
    }).compileComponents();

    fixture = TestBed.createComponent(FacilityMap);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('latitude', 5.6037);
    fixture.componentRef.setInput('longitude', -0.187);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders an OpenLayers map into its container', () => {
    expect(fixture.nativeElement.querySelector('.ol-viewport')).toBeTruthy();
  });

  it('centers the view using fromLonLat-transformed (Web Mercator) coordinates', () => {
    const center = getMap(component)?.getView().getCenter();

    expect(center?.[0]).toBeCloseTo(-20816.74, 1);
    expect(center?.[1]).toBeCloseTo(624797.9, 1);
  });

  it('recenters when the lat/lng inputs change', () => {
    fixture.componentRef.setInput('latitude', 6.6885);
    fixture.componentRef.setInput('longitude', -1.6244);
    fixture.detectChanges();

    const center = getMap(component)?.getView().getCenter();

    expect(center?.[0]).toBeCloseTo(-180827.38, 1);
    expect(center?.[1]).toBeCloseTo(746257.27, 1);
  });

  it('disposes the map instance on destroy', () => {
    const disposeSpy = vi.spyOn(getMap(component)!, 'dispose');

    fixture.destroy();

    expect(disposeSpy).toHaveBeenCalled();
  });
});
