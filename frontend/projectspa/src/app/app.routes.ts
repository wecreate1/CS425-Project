import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';
import { CallbackComponent } from './callback/callback.component';
// import { TestComponent } from './test/test.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: 'home', component: HomeComponent, canActivate: [AutoLoginPartialRoutesGuard] },
    // { path: 'test', component: TestComponent, canActivate: [AutoLoginPartialRoutesGuard] },
    { path: 'callback', component: CallbackComponent }, // does nothing but setting up auth
];
