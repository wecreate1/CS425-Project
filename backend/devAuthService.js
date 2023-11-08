import Provider from "oidc-provider";
import * as jose from "jose";



const configuration = {
    clients: [{
        client_id: 'projectspa',
        client_uri: 'http://localhost:3000',
        grant_types: ['refresh_token', 'authorization_code'],
        response_type: ['token'],
        redirect_uris: ['http://localhost:3000/swagger/oauth2-redirect.html'],
        scope: "openid",
        token_endpoint_auth_method: 'none'
    }],
    clientBasedCORS(ctx, origin, client) {
        return origin=="http://localhost:3000"; // TODO actually understand the problem: https://github.com/panva/node-oidc-provider/blob/cf2069cbb31a6a855876e95157372d25dde2511c/lib/shared/cors.js#L28
    },
    features: {
        resourceIndicators: {
            defaultResource: (ctx, client, oneOf) => {
                return "http://localhost:3000/api";
            },
            enabled: true,
            getResourceServerInfo: (ctx, resourceIndicator, client) => {
                return {
                    audience: 'http://localhost:3000/api',
                    accessTokenTTL: 2 * 60 * 60, // 2 hours
                    accessTokenFormat: 'jwt',
                    jwt: {
                        sign: { alg: 'RS256' },
                    },
                };
            },
            useGrantedResource: (ctx, model) => {
                // @param ctx - koa request context
                // @param model - depending on the request's grant_type this can be either an AuthorizationCode, BackchannelAuthenticationRequest,
                //                RefreshToken, or DeviceCode model instance.
                return true;
            }
        },
    },
    // jwks: {
    //     keys: [
    //         await jose.exportJWK((await jose.generateKeyPair('RS256')).privateKey)
    //     ]
    // }
}

const provider = new Provider('http://localhost:3000/oidc', configuration);

export const devAuthProvider = provider.callback();