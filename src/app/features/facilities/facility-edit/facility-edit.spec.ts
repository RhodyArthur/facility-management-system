import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityEdit } from './facility-edit';

describe('FacilityEdit', () => {
  let component: FacilityEdit;
  let fixture: ComponentFixture<FacilityEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilityEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(FacilityEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
