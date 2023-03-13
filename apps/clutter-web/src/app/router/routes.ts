import { Routes } from '@angular/router';

import { UserComponent } from '../user/user.component';

export const AppRoutes: Routes = [
  {
    path: 'user/:id',
    component: UserComponent,
    runGuardsAndResolvers: 'always'
  },
  {
    path: '',
    redirectTo: '/user/71ab267fc37caa55b9d8de7280daee18',
    pathMatch: 'full'
  }
];
