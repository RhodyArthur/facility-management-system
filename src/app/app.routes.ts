import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'facilities', pathMatch: 'full' },
  {
    path: 'facilities',
    loadChildren: () => import('./features/facilities/facilities.routes').then((m) => m.FACILITIES_ROUTES),
  },
  { path: '**', redirectTo: 'facilities' },
];
