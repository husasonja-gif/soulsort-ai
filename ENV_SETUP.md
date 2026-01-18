# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# BMNL Encryption (for answer encryption at rest)
# Generate with: node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('base64'));"
ANSWER_ENCRYPTION_KEY=your_32_byte_base64_encoded_key_here
```

## Important Notes

- The `.env.local` file is gitignored and should NOT be committed
- After adding/updating environment variables, restart your Next.js dev server
- The OpenAI API key is required for the onboarding chat and radar generation features
- The `SUPABASE_SERVICE_ROLE_KEY` is required for BMNL (Burning Man Netherlands) features. You can find it in your Supabase project settings under API → service_role key (keep this secret!)

## Generating ANSWER_ENCRYPTION_KEY

The `ANSWER_ENCRYPTION_KEY` is required for encrypting participant answers at rest (GDPR compliance). It must be a 32-byte random value, base64-encoded.

### Generate a Key (Windows PowerShell):

```powershell
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('base64'));"
```

Or using Node.js directly:
```bash
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('base64'));"
```

### Alternative Methods:

**Using OpenSSL (if installed):**
```bash
openssl rand -base64 32
```

**Using Python:**
```python
import secrets
import base64
key = secrets.token_bytes(32)
print(base64.b64encode(key).decode())
```

**Using online tool (less secure, only for testing):**
Generate a random base64 string of 44 characters (32 bytes = 44 base64 characters including padding).

### Adding to .env.local:

Copy the generated key and add it to your `.env.local` file:

```env
ANSWER_ENCRYPTION_KEY=your_generated_key_here
```

**Security Note**: Keep this key secret! If you lose it, encrypted data cannot be decrypted. Store it securely and never commit it to version control.





