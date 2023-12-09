import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'projectspa';
  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    // this.oidcSecurityService
    //   .checkAuth()
    //   .subscribe((loginResponse: LoginResponse) => {
    //     const { isAuthenticated, userData, accessToken, idToken, configId } =
    //       loginResponse;
    //     /*...*/
    //   });
  }
}
