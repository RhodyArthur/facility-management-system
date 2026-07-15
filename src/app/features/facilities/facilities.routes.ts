import { Routes } from '@angular/router';

export const FACILITIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./facility-list/facility-list').then((m) => m.FacilityList),
  },
  {
    path: ':id',
    loadComponent: () => import('./facility-detail/facility-detail').then((m) => m.FacilityDetail),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./facility-edit/facility-edit').then((m) => m.FacilityEdit),
  },
];
