# Shivanand Banahatti — consulting website

Multi-page site for **shivanandbanahatti.com**, shipped as the Frappe app `shivanand_consulting`. HTML lives under `shivanand_consulting/www/`. **Theme and site JS** must live in `shivanand_consulting/public/` (e.g. `public/css/site-theme.css`, `public/js/site.js`) so Frappe serves them at `/assets/shivanand_consulting/...`. Do not put CSS/JS only under `www/assets/` — the `/assets` URL is reserved for `sites/assets` and your theme would not load.

## a. How to replace the photo

1. Add your image under this app’s `public` folder (recommended):  
   `shivanand_consulting/public/images/shiv-portrait.jpg`
2. Run `bench build` or `bench --site <yoursite> clear-website-cache` after asset changes if you reference `/assets/...` URLs.
3. For a quick swap without the asset pipeline, you can replace the two **photo placeholder** blocks in `www/index.html` (hero and About) with:
   ```html
   <img src="/assets/shivanand_consulting/images/shiv-portrait.jpg" alt="Shivanand Banahatti" width="220" height="220" class="rounded-full object-cover" style="width:220px;height:220px;border:3px solid #0F172A;" />
   ```
4. Recommended crop: **square**, at least **800×800** px; displayed at **220px** (hero) and **200px** (About).

## b. How to update the WhatsApp number

1. Open `shivanand_consulting/www/index.html`.
2. Search for **`919000000000`** or **`WHATSAPP_TEL`** in the `<script>` block at the bottom.
3. Set **`WHATSAPP_TEL`** to your full number **without** `+`, e.g. `919876543210` for +91 98765 43210.
4. Replace any remaining placeholder display text in the footer if you still show a formatted number.

## c. How to update the Calendly link

1. In `index.html`, find **`CALENDLY_URL`** in the bottom `<script>` (default `'#'`).
2. Set it to your Calendly booking URL, e.g. `https://calendly.com/your-handle/30min`.
3. The hero button with id **`calendly-cta`** picks up this value automatically.

## d. How to connect the real ERPNext web form / API

The form posts JSON to:

`https://erp.athrutec.com/api/method/frappe.www.website.capture_lead`

1. On the **ERPNext** site that should receive leads, implement and whitelist `frappe.www.website.capture_lead` (or point **`LEAD_API`** in `index.html` to your actual method path).
2. Enable **CORS** for `https://shivanandbanahatti.com` (and localhost for testing) on that ERPNext site, or serve the page from the same origin as the API.
3. If you use a **Web Form** instead of a custom method, change the `fetch()` URL and body to match Frappe’s web-form endpoint and field names.
4. Guest POST usually requires `allow_guest=True` on the server method and correct CSRF handling; adjust headers if your deployment uses cookie-based CSRF instead of the literal `fetch` token.

## e. How to add real testimonials

1. Edit the **Social proof** section in `index.html`.
2. Replace the placeholder quotes, names, business types, and cities.
3. Remove the “Placeholder testimonials” note above the cards when you go live.

## f. How to add the GST number in the footer

1. Search for **`[placeholder]`** next to “GST No” in the footer.
2. Replace with your GSTIN (e.g. `29ABCDE1234F1Z5`).

## g. Deployment option 1 — Frappe / ERPNext (bench)

1. Ensure the app folder is at `apps/shivanand_consulting` and **`shivanand_consulting`** is listed in `sites/apps.txt`.
2. Install into the **bench virtualenv** (not only the user `pip`):  
   `./env/bin/pip install -e ./apps/shivanand_consulting`
3. Install on the site:  
   `bench --site shivanandbanahatti.com install-app shivanand_consulting`
4. Ensure **Website Settings → Home page** is **`index`** (the app sets `home_page = "index"` in `hooks.py`; this site was also set explicitly to `index`).
5. `bench --site shivanandbanahatti.com clear-website-cache`
6. Restart **nginx** / **supervisor** if you cache HTML at the proxy.

## h. Deployment option 2 — Netlify drag-and-drop

1. Upload only **`index.html`** (and your images if not using a CDN) to a Netlify site.
2. Set environment-specific links (WhatsApp, Calendly, API URL) in the file before upload, or use a small script to inject secrets at build time.
3. Note: cross-origin `fetch` to ERPNext still requires CORS on the API server.

## i. How to point **shivanandbanahatti.com**

1. In your DNS provider, add an **A** or **CNAME** record to the server that runs this Frappe site (same as your bench / reverse proxy).
2. On the server: `bench setup add-domain shivanandbanahatti.com` (or your hosting’s equivalent) and obtain SSL (e.g. Let’s Encrypt).
3. If the domain should only show this landing page, keep **Website Settings → Home page** as **`index`** and avoid another app overriding `home_page` in hooks.
