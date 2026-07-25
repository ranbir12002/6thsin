Cloudflare Worker deployment notes
=================================

This backend now has a Worker entrypoint at src/worker.mjs for deployment on Cloudflare Workers.

- Wrangler entrypoint: wrangler.toml
- Worker handler: src/worker.mjs
- R2 bucket binding: ASSETS -> sixthsin-prod
- Public URL variable: R2_PUBLIC_URL = https://assets.sixthsin.com

For local development, the original Express server can still be run with:

npm start
