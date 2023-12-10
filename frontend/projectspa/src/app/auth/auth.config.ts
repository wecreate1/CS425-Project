import { PassedInitialConfig } from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
              authority: 'http://localhost:3000/oidc',
              redirectUrl: window.location.origin + '/callback',
              postLogoutRedirectUri: window.location.origin,
              clientId: 'projectspa',
              scope: 'openid offline_access',
              responseType: 'code',
              silentRenew: true,
              useRefreshToken: true,
              renewTimeBeforeTokenExpiresInSeconds: 30,
              autoUserInfo: false,
              secureRoutes: ['http://localhost:3000/api/','http://localhost:4200/api/']
          }
}
