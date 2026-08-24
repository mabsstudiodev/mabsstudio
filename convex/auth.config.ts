/**
 * Convex trusts JWTs issued by this project's Clerk instance.
 *
 * `CLERK_JWT_ISSUER_DOMAIN` is set on the Convex deployment (not in
 * .env.local) with:
 *
 *   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-subdomain>.clerk.accounts.dev
 *
 * The value is the "Issuer" shown on the Clerk JWT template named `convex`.
 */
const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
