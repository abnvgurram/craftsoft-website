# Craft Soft Website – Audit & Proposed Fixes

## Overview
- Stack: static HTML/CSS/JS, Firebase (Firestore), Formspree, Netlify deployment (`netlify.toml`), optional Supabase in admin.
- Structure: modular CSS via `assets/css/main.css` imports, page-specific HTML under `pages/`.
- Goal: improve performance, accessibility, SEO, mobile UX, security, and code quality without changing visual identity.

## High-Impact Fixes (Priority)
- Remove stray `` `r`n `` artifacts across many pages to prevent invalid HTML and rendering quirks (e.g., `pages/services/web-development.html:28`, numerous `pages/courses/*.html`).
- Replace CSS `@import` chain with a single compiled stylesheet to reduce render-blocking and request waterfall (`assets/css/main.css:1`).
- Add `rel="noopener noreferrer"` to external links with `target="_blank"` to prevent tab-nabbing (e.g., `index.html:537`, `index.html:539`, `pages/services/*.html` WhatsApp links).
- Add `loading="lazy"` and explicit `width`/`height` to images to lower LCP/CLS (`index.html:535`, `about.html:64`).
- Strengthen security headers: add `Strict-Transport-Security` and a CSP in `netlify.toml` (`netlify.toml:6-29`).
- Audit Firebase/Firestore and Supabase security rules; client keys are public by design but require strict rules (`assets/js/firebase-config.js:1`, `admin/js/supabase-config.js:3`).

## Performance
- CSS imports: `assets/css/main.css` uses many `@import` statements. Bundle all CSS into a single file (via a build step) to avoid render-blocking chains and reduce HTTP requests. Reference: `assets/css/main.css:1-35`.
- Image optimization: convert large images to `webp/avif` and add `loading="lazy"` and `decoding="async"` (`index.html:535`, `about.html:64`). Provide `width` and `height` to prevent layout shifts.
- Font loading: Google Fonts already use `&display=swap`. Consider preloading the most-used font weights with `<link rel="preload" as="font">` and self-hosting if needed for reliability.
- Script execution: scripts are at end of `<body>`, which is fine. Optionally add `defer` to local scripts for clarity (`index.html:895-900`). Keep Firebase SDK order intact.
- Caching: `netlify.toml` sets long-term caching for `/assets/*`. Add hashed filenames for CSS/JS bundles to enable immutable caching and safe updates.
- Minification: ensure HTML, CSS, and JS are minified in production (Netlify build step or pre-commit).

## Accessibility
- External links: add `rel="noopener noreferrer"` when using `target="_blank"` (e.g., social links `index.html:537`, `index.html:539`; map links and WhatsApp links across `pages/**/*.html`). 
- Navigation state: add `aria-current="page"` to the active nav link for better screen reader context (`index.html:168-174`, `pages/services.html:31-37`). Keep class `active` for styling.
- Form inputs: add `inputmode="numeric"` and `pattern="\\d{10}"` to phone fields alongside JS validation (`pages/services.html:307-310`). Add `autocomplete` attributes (`name`, `email`, `tel`) to improve UX.
- Landmarks: ensure primary sections use appropriate roles if needed (e.g., `role="navigation"` is implicit on `<nav>`, fine). Maintain heading hierarchy (`h1` → `h2` → `h3`), which looks consistent.
- Focus states: verify visible focus styles on interactive elements; ensure custom buttons/links keep focus outline or a styled equivalent.

## SEO
- Canonical tags: add `<link rel="canonical" href="...">` on inner pages (courses/services) to avoid duplicate URL issues (`pages/services/*.html`, `pages/courses/*.html`). 
- Breadcrumb structured data: add `BreadcrumbList` JSON-LD to pages that render breadcrumbs (`pages/services.html:58-66`, course detail pages) for rich results.
- Course/Service schema: add `Course` or `Service` JSON-LD on individual pages to improve discoverability (`pages/courses/*.html`, `pages/services/*.html`).
- Sitemap: generate and deploy `sitemap.xml` and submit to GSC; keep `robots` meta as appropriate (`pages/verify.html:9` correctly uses `noindex`).
- Meta descriptions: ensure each page has unique, keyword-rich descriptions (generally good, do a pass for duplicates).
- OG/Twitter tags: inner pages can add specific `og:title`, `og:description`, and `og:image` rather than relying solely on homepage defaults.

## Security
- Headers: 
  - Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (HSTS) in `netlify.toml`.
  - Add a Content Security Policy tuned to static assets, Firebase, Formspree, and WhatsApp links. Example (adjust to actual domains):
    - `Content-Security-Policy: default-src 'self'; img-src 'self' data: https://...; script-src 'self' https://www.gstatic.com https://cdnjs.cloudflare.com 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src https://firestore.googleapis.com https://formspree.io`
- Firebase: Client keys in `assets/js/firebase-config.js:1-13` are fine for public clients, but verify Firestore rules:
  - Restrict write access to `inquiries` to anonymous only with constraints or use Cloud Functions to proxy writes.
  - Validate fields and rate-limit to prevent abuse.
- Supabase: `admin/js/supabase-config.js:3-4` uses anon key. Ensure Row Level Security is ON and policies restrict access to admin-only data via authenticated sessions. Avoid exposing writable tables in public anon context.
- Forms: Add basic spam protection (honeypot field, timestamp check). Optionally implement reCAPTCHA v3 on Formspree submissions.

## Mobile & UX
- Mobile menu: implementation is solid (`assets/js/main.js:40-86`, `assets/css/utilities/responsive.css:38-120`). Confirm body scroll lock on iOS (it uses `overflow: hidden`; consider fixed position approach if needed).
- Touch targets: ensure sufficient size and spacing on mobile nav and footer links (`assets/css/utilities/responsive.css` already increases spacing).
- Testimonials slider: verify dot/page count logic with varying card counts (`assets/js/main.js:343-432`). It clones cards; ensure no duplicate semantic content issues. Optionally disable clone and render original cards inside track.
- CTA buttons: consider making service/course cards clickable as a whole for faster navigation; keep explicit buttons.
- Inline styles: migrate inline styles in contact sections to CSS files for maintainability (`pages/services.html:260-274`, `index.html:563-569`), keeping design consistent.

## Code Quality
- Remove `` `r`n `` literals: found across many HTML pages inside nav menus and elsewhere; these are likely accidental artifacts and should be removed to keep valid HTML (`pages/services/web-development.html:28`, plus 20 other files flagged).
- Consistent components: header, breadcrumbs, footer are consistent. Consider partials with a static site generator if updates become frequent, otherwise keep as-is.
- JS organization: `assets/js/main.js` is clean and modular. Consider splitting by feature if it grows further and adding lightweight tests for critical UX logic (e.g., form handler and slider).

## Netlify / Deployment
- Current headers are good (`netlify.toml:7-29`). Add HSTS and CSP as noted.
- Set up build to produce minified, hashed CSS/JS bundles and upload a `sitemap.xml`. Keep `/admin/*` no-cache policy.
- If moving to a build step, add a simple pipeline (e.g., PostCSS + cssnano) to compile `main.css` into one file.

## Optional Enhancements
- Add a lightweight analytics solution (e.g., Plausible/Cloudflare Web Analytics) to monitor performance and conversions without heavy scripts.
- Add a PWA manifest and icons to enable “Add to Home Screen” for students; cache only static assets, not dynamic content.
- Use `prefetch` on inner page links for faster navigation (e.g., `pages/courses/*.html`).

## Concrete Action List
- Fix HTML artifacts: remove `` `r`n `` across affected files (`pages/services/*.html`, `pages/courses/*.html`).
- Bundle CSS: replace `@import` chain with a single built stylesheet (`assets/css/main.css:1-35`).
- Add `rel="noopener noreferrer"` to all `target="_blank"` anchors (`index.html:537`, `index.html:539`, multiple in `pages/services/*.html`).
- Add `loading="lazy"` + dimensions on images (`index.html:535`, `about.html:64`).
- Add canonical and JSON-LD breadcrumbs/course/service schemas on inner pages.
- Strengthen `netlify.toml` with HSTS and CSP.
- Review Firestore and Supabase rules/policies; enforce strict write/read scopes.

## References
- `assets/css/main.css:1`
- `assets/css/utilities/responsive.css:1-180`
- `assets/js/main.js:40-86`, `assets/js/main.js:343-432`
- `index.html:535`, `index.html:893-900`, `index.html:537`, `index.html:539`
- `about.html:64`
- `pages/services.html:297-329`, `pages/services.html:58-66`
- `pages/services/web-development.html:28`
- `netlify.toml:6-29`
- `assets/js/firebase-config.js:1-19`
- `admin/js/supabase-config.js:3-17`
