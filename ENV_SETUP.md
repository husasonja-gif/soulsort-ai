# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Important Notes

- The `.env.local` file is gitignored and should NOT be committed
- After adding/updating environment variables, restart your Next.js dev server
- The OpenAI API key is required for the onboarding chat and radar generation features




