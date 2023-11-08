Instructions for use
====================

1. start postgres: on linux I do this but other methods and systems work too: `sudo docker run -p 5432:5432 --name cs425-group-postgres -e POSTGRES_PASSWORD=mysecretpassword --rm postgres`
2. setup the database: on linux I do this: `psql -h localhost -U postgres -f db/db.ddl.sql`
3. ensure the PG* variables in backend/.env are correct
4. In backend/ run `npm install` (assuming you have npm installed)
5. In backend/ `npm start` (warnings from `oidc-provider` can be ignored for now)

The backend should now be running on localhost:3000. If you navigate to [http://localhost:3000/swagger/index.html](http://localhost:3000/swagger/index.html) you should be presented with a list of api endpoints. This page allows you to try out the api after you authenticate.

To authenticate click the green `Authorize` button, then scroll down to `OpenID (OAuth2, authorization_code with PKCE)` and check the `openid` scope, then click the `Authorize` button. Here you'll be presented with a sign-in screen, type any username and any password (the password is completely ignored), and sign-in then click authorize. You should be brought back to swagger and can test the API with the `Try it out` buttons.

If you need to switch users navigate to [http://localhost:3000/oidc/session/end](http://localhost:3000/oidc/session/end) to sign-out. Multiple browser profiles or incognito windows might be the best way to switch users.

pgadmin is a useful tool to view the state of the database.
