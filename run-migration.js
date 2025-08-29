#!/usr/bin/env node

import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { Client } from 'pg';

// Load environment variables
dotenv.config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    
    console.log('📖 Reading migration file...');
    const migrationSQL = readFileSync('./security_fields_migration.sql', 'utf8');
    
    console.log('🚀 Executing migration...');
    const result = await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();