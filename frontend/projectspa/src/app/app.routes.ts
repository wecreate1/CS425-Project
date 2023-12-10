import { Routes } from '@angular/router';
import { AutoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';
import { CallbackComponent } from './callback/callback.component';
import { UserComponent } from './user/user.component';
import { CourseComponent } from './course/course.component';
import { EnrollmentComponent } from './enrollment/enrollment.component';
// import { TestComponent } from './test/test.component';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'user' },
    { path: 'user', component: UserComponent, canActivate: [AutoLoginPartialRoutesGuard] },
    { path: 'course/:id', component: CourseComponent, canActivate: [AutoLoginPartialRoutesGuard] },
    { path: 'enrollment/:id', component: EnrollmentComponent, canActivate: [AutoLoginPartialRoutesGuard] },
    { path: 'callback', component: CallbackComponent }, // does nothing but setting up auth
];
