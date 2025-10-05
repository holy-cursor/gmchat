# Hybrid Database Setup for Parc3l

This guide will help you set up the hybrid database system for Parc3l messaging app.

## What is the Hybrid System?

The hybrid system combines:
- **Database Storage**: PostgreSQL (Supabase) for fast queries and real-time sync
- **Blockchain Proof**: Base blockchain for message integrity verification
- **IPFS Backup**: Decentralized storage for message content redundancy

## Setup Steps

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `parc3l-messaging`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be ready (2-3 minutes)

### 2. Get Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon public key

### 3. Update Configuration

1. Open `src/config/supabase.ts`
2. Replace the placeholder values:
   ```typescript
   const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your Project URL
   const supabaseAnonKey = 'your-anon-key'; // Replace with your Anon public key
   ```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `database-setup.sql`
3. Paste it into the SQL editor
4. Click "Run" to execute the schema

### 5. Test the Setup

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Connect your wallet
4. Try sending a message
5. Check the Supabase dashboard > Table Editor > messages to see if data is being stored

## Features

### Real-time Sync
- Messages appear instantly across all devices
- No need to refresh the page
- Automatic contact updates

### Data Redundancy
- Messages stored in database for fast access
- IPFS backup for decentralized storage
- Blockchain proof for integrity verification

### Security
- Row Level Security (RLS) enabled
- Users can only access their own data
- Encrypted message content support

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check that you've updated the Supabase credentials correctly
   - Make sure you're using the anon key, not the service role key

2. **"Permission denied" error**
   - Check that RLS policies are set up correctly
   - Verify the database schema was created successfully

3. **Messages not syncing**
   - Check browser console for errors
   - Verify Supabase connection in the dashboard
   - Check that the real-time subscription is working

### Debug Mode

Use the developer menu (passcode: `codernigga`) to:
- Inspect localStorage data
- Test database connections
- Debug message syncing issues

## Production Deployment

### Environment Variables

For production, use environment variables instead of hardcoded values:

```typescript
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
```

### Vercel Deployment

1. Add environment variables in Vercel dashboard
2. Redeploy your app
3. Test the production deployment

## Next Steps

1. Set up Supabase project
2. Update configuration
3. Test the hybrid system
4. Deploy to production
5. Monitor performance and usage

The hybrid system provides the best of both worlds: fast, real-time messaging with decentralized backup and blockchain verification.
