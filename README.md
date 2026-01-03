<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1wbKs7udBvmoxaImDiNVNnewJm9nXI8Ll

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase Storage Setup

This app uses Supabase for file storage. To set it up through Vercel:

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key from the project settings

2. **Deploy to Vercel with Supabase integration:**
   - Connect your repository to Vercel
   - In Vercel dashboard, go to Integrations > Marketplace
   - Search for "Supabase" and install the integration
   - Follow the prompts to connect your Supabase project
   - The integration will automatically set the environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Configure Storage Bucket (optional):**
   - In your Supabase dashboard, go to Storage
   - Create a bucket for your files (e.g., "career-documents")
   - Set appropriate policies for public/private access

4. **Local Development:**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase URL and anon key
   - The app will use these for local development

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
- `GEMINI_API_KEY`: Your Google Gemini API key

The Supabase storage service provides functions for:
- Uploading files: `uploadFile(bucket, path, file)`
- Downloading files: `downloadFile(bucket, path)`
- Deleting files: `deleteFile(bucket, path)`
- Listing files: `listFiles(bucket, folder)`
- Getting public URLs: `getPublicUrl(bucket, path)`
