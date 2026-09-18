# RailGaadi Production Deployment Guide

Deploying RailGaadi is straightforward since it is built on Next.js 16 and utilizes serverless API routes. For this tech stack, **Vercel** is the most highly optimized platform, as it natively handles Next.js API rate-limiting, caching, and serverless edge functions.

Follow these steps to take RailGaadi live.

---

## Phase 1: Preparation

Before deploying, ensure you have all your production secrets ready.

1. **Push your code to GitHub**: Make sure all recent changes (including the new catalog and Redis configurations) are pushed to your main branch on GitHub.
2. **Gather your API Keys**: Keep a copy of these ready (do not commit them to Git):
   - **RailRadar API Key**
   - **Upstash Redis Credentials** (URL & Token)
   - **MapTiler Key**
   - **OpenWeather API Key**
   - **Auth Secret** (Generate a strong one using `openssl rand -base64 32`)
   - **Google/GitHub OAuth Client IDs** (If using authentication)

> [!WARNING]
> Never commit your `.env.local` file to GitHub. The `.env.example` file is sufficient for deployment templates.

---

## Phase 2: Deploying to Vercel (Recommended)

Vercel is the creator of Next.js and provides zero-config deployments.

1. **Log in to Vercel**: Go to [vercel.com](https://vercel.com/) and sign in with your GitHub account.
2. **Add New Project**: Click **"Add New"** > **"Project"**.
3. **Import Repository**: Find your RailJatra/RailGaadi repository in the list and click **"Import"**.
4. **Configure Project**:
   - **Framework Preset**: Vercel will automatically detect `Next.js`. Leave this as is.
   - **Root Directory**: If your app is inside a folder (e.g., `railgaadi/`), click Edit and select that folder.
   - **Build Command**: Leave default (`npm run build`).
   - **Install Command**: Leave default (`npm install`).
5. **Set Environment Variables**: 
   Copy the variables from your local `.env.local` and paste them into the Vercel Environment Variables section. **Crucially**, ensure you update `NEXT_PUBLIC_APP_URL` to match your intended production domain (e.g., `https://railgaadi.com`).

   *Required Variables:*
   ```env
   RAILRADAR_API_KEY=rg_your_key_here
   NEXT_PUBLIC_MAPTILER_KEY=your_key_here
   OPENWEATHER_API_KEY=your_key_here
   UPSTASH_REDIS_REST_URL=https://magnetic-glider-52968.upstash.io
   UPSTASH_REDIS_REST_TOKEN=Ac7I...
   NEXT_PUBLIC_APP_URL=https://your-deployment-url.vercel.app
   AUTH_SECRET=your_generated_secret
   ```

6. **Deploy**: Click the **Deploy** button. Vercel will now install dependencies, compile the application using Turbopack, and provision the serverless infrastructure.

---

## Phase 3: Post-Deployment Verification

Once Vercel finishes building (usually under 2 minutes based on our recent 8.1s build time), you will be given a live URL (e.g., `railgaadi.vercel.app`).

### 1. Verify API Integration
- Navigate to your live URL.
- Search for a popular train (e.g., `12952`).
- Verify that the live map loads without errors and the train icon is visible.

### 2. Verify MapTiler Domain Restrictions
> [!IMPORTANT]
> If your map fails to load with a 403 Forbidden error, it means MapTiler doesn't recognize your new Vercel domain.
- Go to your MapTiler Cloud Dashboard.
- Under **API Keys**, locate the key you used.
- In the **Allowed origins** section, add your new Vercel production domain (e.g., `https://railgaadi.vercel.app`).

### 3. Verify Redis Caching
- Open multiple tabs and track the same train simultaneously.
- Because of your Upstash Redis integration, the app will serve the cached result instantly to all tabs, protecting your RailRadar API limits.

### 4. Custom Domain (Optional)
- In your Vercel project settings, go to **Domains**.
- Add your custom domain (e.g., `railgaadi.in`).
- Follow the instructions to configure your DNS records (A and CNAME). Vercel will automatically provision SSL certificates.

---

## Alternative: Docker Deployment

If you prefer deploying to AWS EC2, DigitalOcean, or Railway via Docker, ensure you have a `Dockerfile` that executes `npm run build` followed by `npm run start`. You will pass the same Environment Variables to the container at runtime. Since Next.js produces a `.next/standalone` build (as configured in our `next.config.ts`), the Docker image will be highly optimized and lightweight.
