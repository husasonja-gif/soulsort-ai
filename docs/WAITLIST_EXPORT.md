# Waitlist Email Export Guide

## How to Export Waitlist Emails for Gmail BCC

1. **Access the Admin Endpoint:**
   - Navigate to: `https://soulsortai.com/api/admin/waitlist-export`
   - You must be logged in with an admin email (configured in `ADMIN_EMAILS` env var)

2. **Copy the Email List:**
   - The API returns a JSON response with:
     - `emails`: Comma-separated list (ready for Gmail BCC)
     - `csv`: Newline-separated list (alternative format)
     - `count`: Total number of subscribers

3. **Use in Gmail:**
   - Open Gmail → Compose
   - Click "Bcc" (Blind Carbon Copy)
   - Paste the `emails` value from the API response
   - Gmail will automatically parse the comma-separated emails

## Example API Response

```json
{
  "count": 42,
  "emails": "user1@example.com, user2@example.com, user3@example.com",
  "csv": "user1@example.com,\nuser2@example.com,\nuser3@example.com"
}
```

## Notes

- Only subscribed users are included (`subscribed = true`)
- Emails are sorted by creation date (oldest first)
- The endpoint requires admin authentication
- All emails are lowercase and trimmed

