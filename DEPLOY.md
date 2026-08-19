# Deploying DP Light Demo to Vercel

This is a static Vite + React build with no backend — deployment is just
"connect the repo, let Vercel build it, point a subdomain at it."

## 1. Connect the GitHub repo to Vercel

1. Go to https://vercel.com/new and sign in.
2. Click **Import Project** and select the GitHub repo you pushed this project to.
3. On the configuration screen:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - Leave everything else default (no environment variables are needed — this app has no backend).
4. Click **Deploy**. Vercel will build and give you a `*.vercel.app` URL once it's done.

## 2. Add the custom subdomain

1. In the Vercel dashboard, open the project.
2. Go to **Settings → Domains**.
3. Type `demo.mydomain.com` (replace with your real domain) and click **Add**.
4. Vercel will show you the DNS record it needs — see step 3 below.

## 3. DNS record at Lumina

In your Lumina DNS panel for `mydomain.com`, add:

| Field | Value |
|---|---|
| Type | `CNAME` |
| Host / Name | `demo` |
| Target / Value | *(the value Vercel shows you on the Domains page — typically `cname.vercel-dns.com`, but use whatever Vercel displays for your project, since it can vary)* |

Vercel shows the exact target value on the same screen right after you add the domain in step 2 — use that value, not a guessed one, since it's tied to your specific project/account.

## 4. Propagation

DNS changes can take anywhere from a few minutes to a few hours to propagate,
depending on Lumina's TTL settings and caching along the way. Vercel's Domains
page will show a "Valid Configuration" (or similar) status once it detects the
record and issues an SSL certificate automatically — no action needed on your
end beyond adding the record.
