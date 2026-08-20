# Deploying DP Light Demo

1. Create a new empty GitHub repository (e.g. `dplight-demo`). Do NOT initialize
   with a README.

2. Push:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/dplight-demo.git
   git branch -M main
   git push -u origin main
   ```

3. Go to https://vercel.com/new
   - Import the `dplight-demo` repository
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Click **Deploy**

4. Once deployed, go to **Project → Settings → Domains**
   - Add: `demo.luminadomain.com` (replace `luminadomain.com` with your actual
     Lumina domain)
   - Vercel will show you the required DNS record

5. At your Lumina domain registrar DNS settings, add:
   - Type: `CNAME`
   - Host/Name: `demo`
   - Value/Target: `cname.vercel-dns.com` (Vercel will confirm the exact value)
   - TTL: Auto or 300

6. Wait a few minutes for DNS to propagate. Vercel will auto-provision an SSL
   certificate.

7. Send the client: https://dpdemo-oymukkbhi-kanyekicollins-4802s-projects.vercel.app/
   - Login credentials are pre-filled (`demo@dplight.co.ke` / `demo1234`)
   - Everything runs in-browser — no backend, no data leaves the browser
