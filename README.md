# SARAS Next public website

## Published Windows preview

The unsigned Windows preview is published: [download the single Setup EXE](https://github.com/muhammadfarhan138223-cmyk/saras-next-downloads/releases/download/v0.2.0-dev.10/SARAS-Next-0.2.0-dev.10-Windows-x64-Setup.exe). No GitHub account, Python or VS Code is required to download/install. The download manifest is connected and the exact public file SHA-256/size were verified. This is a preview; clean-device and real phone/microphone acceptance remain pending.

Import this repository into Vercel. Its root is the website source; the checked-in vercel.json sets the build command and output directory. Select Other if asked for a framework. Add SITE_URL for your final HTTPS domain, then configure that domain in Vercel and its DNS provider. No website deployment was performed by the release publication.

This is the Vercel-ready marketing and installable website project. It is separate from the Windows companion release and contains no user accounts, PC pairing secrets, API keys, or customer data.

## Mobile install

The website is a Progressive Web App (PWA). On a supported Android browser, open the deployed HTTPS link and choose **Install SARAS**. On iPhone/iPad, open the link in Safari, tap **Share**, then **Add to Home Screen**. After install it opens in a standalone app window, and the public pages it has already visited remain available offline. Vercel hosting and HTTPS are required for installation.

This installs the SARAS website shell. Remote PC control still needs the separately installed Windows companion and its secure pairing/approval flow; installing the website does not install a native phone binary or enable access by itself.

## Deploy to Vercel

1. Import the project from a GitHub repository in Vercel. If you prefer uploading from your computer, extract the ZIP, open a terminal in that folder, and deploy it with Vercel CLI (`vercel`, then `vercel --prod`).
2. Framework preset: **Other**. Build command: `npm run build`. Output directory: `dist`. Node.js 20 or newer.
3. Set `SITE_URL` to the final HTTPS domain (for example `https://saras.yourdomain.com`) in Vercel's project environment variables. If left blank, the build uses Vercel's project URL. This generates matching canonical links, structured data and sitemap URLs.
4. Add the custom domain in Vercel and point its DNS records to Vercel. Wait until Vercel reports the domain and HTTPS certificate as ready, then redeploy.

To turn on optional email updates, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as **server-only Vercel environment secrets** (Production and Preview only if intended), plus `SITE_URL` matching the exact public origin. The `.env.example` lists the existing SARAS project URL; add its service key directly in the Vercel dashboard, never in source files or chat. The separate `marketing_subscribers` table has RLS enabled and no `anon` or `authenticated` grants; the browser never receives the service key. The email form requires explicit consent and supports unsubscribe from the browser used to subscribe. If the secrets are absent, the form reports that it is unavailable. Do not paste secrets into source files or chat.

No Python installation is needed to build the website. The Windows Setup is a verified unsigned preview, accepted by the owner. See RELEASE-HOSTING.md for free GitHub hosting and remaining external checks. Never publish the internal developer payload ZIP.

## Mobile browser notes

- Android: Chrome/Edge usually show the install prompt after the site is opened over HTTPS. The button appears when the browser reports install support.
- iOS/iPadOS: use Safari's **Share â†’ Add to Home Screen** flow. Other in-app browsers may need **Open in Safari** first.
- Installed pages use a small offline cache. The service worker never caches API routes or cross-origin requests.
- Updates to the website arrive with the next visit; the service worker refreshes its cache when the site changes.

## Release assurance status

See [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md). A website project cannot prove clean-machine installation, Defender reputation, or the runtime isolation of a PC-control companion. See the exact local results and remaining external checks in the release evidence. No clean-machine certification is claimed.
