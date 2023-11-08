import Provider from "oidc-provider";
import * as jose from "jose";



const configuration = {
    clients: [{
        client_id: 'projectspa',
        client_secret: 'some_nonsense',
        grant_types: ['refresh_token', 'authorization_code'],
        redirect_uris: ['http://localhost:3000/*'],
        scope: "openid"
    }],
    // jwks: {
    //     keys: [
    //         await jose.exportJWK((await jose.generateKeyPair('RS256')).privateKey)
    //     ]
    // }
}

const provider = new Provider('http://localhost:3000', configuration);

export const devAuthProvider = provider.callback();