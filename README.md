# dietrichschmidt.com

Static editorial homepage for **Dietrich Gottfried Schmidt — Drupal · AWS · Content/AI Enablement Consulting**, centered on the **10-Point Q1 2027 Technical Audit Offer**.

Built with zero build steps, zero third-party trackers, and native **Cloudflare Pages** security/caching headers (`_headers`).

## Structure

- `index.html` — Semantic HTML5 homepage with SEO metadata, Open Graph tags, JSON-LD `ProfessionalService` schema, interactive 10-point audit ledger, practice overview, delivery cadence, and inquiry brief builder.
- `styles.css` — Vanilla CSS editorial design system (warm archival paper palette, responsive breakpoints, print styles).
- `script.js` — Domain filter tabs, audit priority shortlist synced to the inquiry builder, copy/mailto brief generator, and mobile navigation.
- `assets/architecture-strata.jpg` — Bespoke architectural illustration of the Editorial / Cloud / Grounded AI strata.
- `favicon.svg` — Geometric monogram icon.
- `_headers` — Cloudflare Pages HTTP security headers (HSTS, CSP, `X-Frame-Options`, caching rules).
- `robots.txt` & `sitemap.xml` — Search indexing configuration for `https://dietrichschmidt.com/`.

## Configured Contact Links

- **Email**: `info@dietrichschmidt.com` (wired into both `index.html` and the brief generator in `script.js`)
- **LinkedIn**: `https://www.linkedin.com/in/dietrichschmidt/` (included in JSON-LD `sameAs`, the contact panel, and footer)

## Deploying to Cloudflare Pages (with Cloudflare DNS)

Because DNS for `dietrichschmidt.com` is already managed in Cloudflare, **Cloudflare Pages** is the cleanest, zero-maintenance host (global edge CDN, automatic TLS, free static hosting, native `_headers` support):

### Option A — Connect via GitHub (Recommended)
1. Push this directory to a GitHub repository.
2. In **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository and set:
   - **Framework preset**: `None`
   - **Build command**: *(leave empty)*
   - **Build output directory**: `.`
4. Click **Save and Deploy**.

### Option B — Direct CLI Deploy via Wrangler
```bash
npx wrangler pages deploy . --project-name dietrichschmidt-com
```

### Attach Custom Domain (`dietrichschmidt.com`)
1. Open the Pages project → **Custom domains → Set up a custom domain**.
2. Add `dietrichschmidt.com` (and optionally `www.dietrichschmidt.com`).
3. Because your DNS zone is already on Cloudflare, Cloudflare automatically creates the proxied `CNAME` record (`dietrichschmidt.com` → `<project>.pages.dev`) and provisions the SSL certificate.
4. Optional: Add a Cloudflare **Redirect Rule** from `www.dietrichschmidt.com/*` → `https://dietrichschmidt.com/$1` (`301`) to keep canonical URLs clean, and set **SSL/TLS encryption mode** to **Full (strict)**.

### Optional: Native Server-Side Contact Form Later
If you later want direct form submissions instead of `mailto:` / Copy Brief, drop a Cloudflare Pages Function at `functions/api/inquiry.js` backed by Cloudflare Turnstile + Resend/Postmark or Cloudflare Email Routing.
