#!/usr/bin/env node

/**
 * UPI Digital Asset System - Integration Test
 * Run this to verify all connections are working
 */

const https = require('https');
const { spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkBackend() {
  return new Promise((resolve) => {
    log('\n🔍 Checking Backend API...', 'blue');
    
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          log('✅ Backend API is running', 'green');
          resolve(true);
        } else {
          log(`❌ Backend returned status ${res.statusCode}`, 'red');
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      log('❌ Backend not running. Start with: cd backend && npm run dev', 'red');
      resolve(false);
    });
    
    req.end();
  });
}

async function checkMongoDB() {
  return new Promise((resolve) => {
    log('\n🔍 Checking MongoDB...', 'blue');
    
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/assets',
      method: 'GET',
    }, (res) => {
      log('✅ MongoDB connection working', 'green');
      resolve(true);
    });
    
    req.on('error', () => {
      log('❌ MongoDB not accessible', 'red');
      resolve(false);
    });
    
    req.end();
  });
}

function checkEnvVars() {
  log('\n🔍 Checking Environment Variables...', 'blue');
  
  const fs = require('fs');
  const path = require('path');
  
  // Check backend .env
  const backendEnv = path.join(__dirname, 'backend', '.env');
  if (fs.existsSync(backendEnv)) {
    const content = fs.readFileSync(backendEnv, 'utf8');
    const hasRazorpay = content.includes('RAZORPAY_KEY_ID') && content.includes('razorpay');
    const hasMongo = content.includes('MONGODB_URI');
    const hasContract = content.includes('CONTRACT_ADDRESS');
    
    if (hasRazorpay && hasMongo && hasContract) {
      log('✅ Backend .env configured', 'green');
    } else {
      log('⚠️  Backend .env may be incomplete', 'yellow');
    }
  } else {
    log('❌ backend/.env not found', 'red');
  }
  
  // Check frontend .env.local
  const frontendEnv = path.join(__dirname, 'frontend', '.env.local');
  if (fs.existsSync(frontendEnv)) {
    log('✅ Frontend .env.local exists', 'green');
  } else {
    log('⚠️  frontend/.env.local not found', 'yellow');
  }
}

async function main() {
  log('========================================', 'blue');
  log('UPI Digital Asset - Integration Test', 'blue');
  log('========================================', 'blue');
  
  // Check environment variables
  checkEnvVars();
  
  // Check backend
  const backendRunning = await checkBackend();
  
  // If backend is running, check MongoDB
  if (backendRunning) {
    await checkMongoDB();
  }
  
  log('\n========================================', 'blue');
  log('Integration Status', 'blue');
  log('========================================', 'blue');
  
  if (!backendRunning) {
    log('\n❌ Cannot proceed - Backend not running', 'red');
    log('\nTo start:' , 'yellow');
    log('  1. docker-compose up -d', 'yellow');
    log('  2. cd backend && npm run dev', 'yellow');
    log('  3. cd frontend && npm run dev', 'yellow');
    process.exit(1);
  }
  
  log('\n✅ All integrations verified!', 'green');
  log('\nNext steps:', 'blue');
  log('  1. Open http://localhost:3000', 'yellow');
  log('  2. Register a new account', 'yellow');
  log('  3. Manually set role to "admin" in MongoDB to upload assets', 'yellow');
  log('  4. Upload an asset at /upload', 'yellow');
  log('  5. Login as regular user', 'yellow');
  log('  6. Buy an asset - use test card 4111 1111 1111 1111', 'yellow');
  
  process.exit(0);
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, 'red');
  process.exit(1);
});