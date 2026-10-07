import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Ogród Tabliczki',
    loadComponent: () => import('./garden/garden-page').then((m) => m.GardenPage),
  },
  {
    path: 'graj',
    title: 'Graj – Ogród Tabliczki',
    loadComponent: () => import('./round/round-page').then((m) => m.RoundPage),
  },
  { path: '**', redirectTo: '' },
];
