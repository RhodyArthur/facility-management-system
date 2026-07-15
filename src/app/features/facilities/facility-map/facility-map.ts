import { Component, ElementRef, OnDestroy, ViewChild, effect, input } from '@angular/core';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

const MARKER_ZOOM = 15;

@Component({
  selector: 'app-facility-map',
  imports: [],
  templateUrl: './facility-map.html',
  host: { class: 'block' },
})
export class FacilityMap implements OnDestroy {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();

  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer!: ElementRef<HTMLDivElement>;

  private map?: Map;
  private markerFeature?: Feature<Point>;

  constructor() {
    effect(() => {
      // OpenLayers renders in EPSG:3857 (Web Mercator), but facility coordinates are stored
      // as plain WGS84 lon/lat degrees — fromLonLat() is the required transform between them.
      const coordinates = fromLonLat([this.longitude(), this.latitude()]);

      if (!this.map) {
        this.map = this.createMap(coordinates);
        return;
      }

      this.map.getView().setCenter(coordinates);
      this.markerFeature?.getGeometry()?.setCoordinates(coordinates);
    });
  }

  ngOnDestroy(): void {
    this.map?.dispose();
  }

  private createMap(coordinates: number[]): Map {
    this.markerFeature = new Feature({ geometry: new Point(coordinates) });
    this.markerFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: '#dc2626' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      }),
    );

    return new Map({
      target: this.mapContainer.nativeElement,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: new VectorSource({ features: [this.markerFeature] }) }),
      ],
      view: new View({ center: coordinates, zoom: MARKER_ZOOM }),
    });
  }
}
