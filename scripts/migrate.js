/**
 * Database migration script for CyberSecElite contact form submissions
 * Run with: npm run migrate (requires NETLIFY_DATABASE_URL environment variable)
 */

import { neon } from '@netlify/neon';

async function migrate() {
  const sql = neon();

  console.log('Running database migrations...');

  // Create contact_submissions table
  await sql`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL,
      service TEXT,
      timeline TEXT,
      environment TEXT,
      message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  console.log('Created contact_submissions table');

  // Create index on email for faster lookups
  await sql`
    CREATE INDEX IF NOT EXISTS idx_contact_submissions_email
    ON contact_submissions(email)
  `;

  console.log('Created index on email column');

  // Create index on created_at for chronological queries
  await sql`
    CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
    ON contact_submissions(created_at)
  `;

  console.log('Created index on created_at column');

  console.log('Database migrations completed successfully!');
}

migrate().catch(console.error);
