import Provider from "oidc-provider";
// import * as jose from "jose";
import { Router } from 'express';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configuration = {
    clients: [{
        client_id: 'projectspa',
        client_uri: 'http://localhost:3000',
        grant_types: ['refresh_token', 'authorization_code'],
        response_type: ['code id_token',
        'code',
        'id_token',
        'none'],
        redirect_uris: ['http://localhost:3000/swagger/oauth2-redirect.html', 'http://localhost:4200/callback'],
        post_logout_redirect_uris: ['http://localhost:4200'],
        scope: "openid",
        pkce: {
            required: true
        },
        token_endpoint_auth_method: 'none',
    }],
    clientBasedCORS(ctx, origin, client) {
        return origin=="http://localhost:3000" || origin=="http://localhost:4200";
    },
    interactions: {
        url(ctx, interaction) {
            return `/oidc/interactions/${interaction.uid}/`
        }
    },
    features: {
        devInteractions: { enabled: false },
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
    async loadExistingGrant(ctx) {
        const grantId = ctx.oidc.result?.consent?.grantId 
            || ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId);

        if (ctx.oidc.client.clientId == 'projectspa') {
            if (grantId) {
                // keep grant expiry aligned with session expiry
                // to prevent consent prompt being requested when grant expires
                const grant = await ctx.oidc.provider.Grant.find(grantId);
        
                // this aligns the Grant ttl with that of the current session
                // if the same Grant is used for multiple sessions, or is set
                // to never expire, you probably do not want this in your code
                if (ctx.oidc.account && grant.exp < ctx.oidc.session.exp) {
                    grant.exp = ctx.oidc.session.exp;
            
                    await grant.save();
                }

                return grant;
            } else {
                const grant = new ctx.oidc.provider.Grant({
                    clientId: ctx.oidc.client.clientId,
                    accountId: ctx.oidc.session.accountId,
                });
        
                grant.addOIDCScope('openid');
                grant.addOIDCScope('offline_access');
                await grant.save();
                return grant;
            }
        } else {
            if (grantId) {
                return ctx.oidc.provider.Grant.find(grantId);
            }
        }

        return undefined;
    }
    // jwks: {
    //     keys: [
    //         await jose.exportJWK((await jose.generateKeyPair('RS256')).privateKey)
    //     ]
    // }
}

const provider = new Provider('http://localhost:3000/oidc', configuration);

const router = new Router();

function setNoCache(req, res, next) {
    res.set('cache-control', 'no-store');
    next();
}

router.use('/interactions/static/', express.static(path.join(__dirname, 'static/dist')));
router.use('/interactions/static/index.html', express.static(path.join(__dirname, 'static/index.html')));
router.use('/interactions/static/consent.html', express.static(path.join(__dirname, 'static/consent.html')));

router.get('/interactions/:uid/', setNoCache, async (req, res) => {
    const {
        uid, prompt, params, session,
      } = await provider.interactionDetails(req, res);

      switch (prompt.name) {
        case 'login': {
          return res.sendFile(path.join(__dirname, 'static/index.html'));
        }
        case 'consent': {
            return res.sendFile(path.join(__dirname, 'static/consent.html'));
        }
        default:
          return undefined;
      }
});

router.post('/interactions/:uid/login', setNoCache, express.urlencoded({extended: true}), async (req, res) => {
    const { prompt: { name } } = await provider.interactionDetails(req, res);
    if (name == 'login') {
        await provider.interactionFinished(req, res, {login: {accountId: req.body.username}}, {mergeWithLastSubmission: false});
    }
})

router.post('/interactions/:uid/consent', setNoCache, express.urlencoded({extended: true}), async (req, res) => {
    const interactionDetails = await provider.interactionDetails(req, res);
    const { prompt: { name, details }, params, session: { accountId } } = interactionDetails;
    if (name == 'login') {
        let { grantId } = interactionDetails;
        let grant;

        if (grantId) {
            // we'll be modifying existing grant in existing session
            grant = await provider.Grant.find(grantId);
        } else {
            // we're establishing a new grant
            grant = new provider.Grant({
                accountId,
                clientId: params.client_id,
            });
        }

        if (details.missingOIDCScope) {
            grant.addOIDCScope(details.missingOIDCScope.join(' '));
        }
        if (details.missingOIDCClaims) {
            grant.addOIDCClaims(details.missingOIDCClaims);
        }
        if (details.missingResourceScopes) {
            for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
            grant.addResourceScope(indicator, scopes.join(' '));
            }
        }

        grantId = await grant.save();

        const consent = {};
        if (!interactionDetails.grantId) {
            // we don't have to pass grantId to consent, we're just modifying existing one
            consent.grantId = grantId;
        }

        const result = { consent };
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
    }
});

router.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
    try {
        const result = {
            error: 'access_denied',
            error_description: 'End-User aborted interaction',
        };
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
        next(err);
    }
});

router.use('/', provider.callback());

export const devAuthProvider = router;