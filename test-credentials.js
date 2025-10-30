#!/usr/bin/env node
'use strict';

/**
 * Test Your PalGate Credentials
 *
 * This script verifies that your phone number, session token, and token type
 * are correct by making a test API call to PalGate.
 */

const https = require('https');
const readline = require('readline');
const { generateToken } = require('./lib/tokenGenerator');

const BASE_URL = 'https://api1.pal-es.com';
const ANDROID_USER_AGENT = 'okhttp/4.9.3';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt for input
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Make HTTPS request
 */
function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': ANDROID_USER_AGENT,
        'Accept': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test credentials
 */
async function testCredentials(phoneNumber, sessionToken, tokenType) {
  console.log('\nGenerating API token...');

  let apiToken;
  try {
    apiToken = generateToken(sessionToken, phoneNumber, tokenType);
    console.log('✓ API token generated successfully');
    console.log(`  Token (first 20 chars): ${apiToken.substring(0, 20)}...`);
  } catch (error) {
    throw new Error(`Failed to generate token: ${error.message}`);
  }

  console.log('\nTesting API authentication...');

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await makeRequest(
      `/v1/bt/user/check-token?ts=${timestamp}&ts_diff=0`,
      { 'X-Bt-Token': apiToken }
    );

    if (response.statusCode === 200 && response.data.status === 'ok' && !response.data.err) {
      console.log('✓ Authentication successful!');
      console.log('\n' + '='.repeat(70));
      console.log('Your credentials are VALID and working correctly!');
      console.log('='.repeat(70));
      console.log('\nYou can now use these credentials in the Homey app:');
      console.log(`- Phone Number: ${phoneNumber}`);
      console.log(`- Session Token: ${sessionToken}`);
      console.log(`- Token Type: ${tokenType}`);
      console.log('\n' + '='.repeat(70) + '\n');
      return true;
    } else {
      throw new Error(`API returned an error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('PalGate Credentials Tester');
  console.log('='.repeat(70) + '\n');

  console.log('This tool will verify that your PalGate credentials are valid.');
  console.log('You\'ll need:\n');
  console.log('1. Phone number (with country code, e.g., 972501234567)');
  console.log('2. Session token (32 hex characters)');
  console.log('3. Token type (0=SMS, 1=Primary, 2=Secondary)\n');

  try {
    // Get phone number
    const phoneNumber = await prompt('Enter your phone number: ');
    if (!/^\d+$/.test(phoneNumber)) {
      throw new Error('Invalid phone number format. Use only digits with country code.');
    }

    // Get session token
    const sessionToken = await prompt('Enter your session token (32 hex chars): ');
    if (!/^[0-9a-fA-F]{32}$/.test(sessionToken)) {
      throw new Error('Invalid token format. Must be exactly 32 hexadecimal characters.');
    }

    // Get token type
    const tokenTypeStr = await prompt('Enter your token type (0/1/2) [default: 1]: ');
    const tokenType = tokenTypeStr === '' ? 1 : parseInt(tokenTypeStr, 10);
    if (![0, 1, 2].includes(tokenType)) {
      throw new Error('Invalid token type. Must be 0, 1, or 2.');
    }

    console.log('\n' + '-'.repeat(70));
    console.log('Testing credentials...');
    console.log('-'.repeat(70));

    await testCredentials(phoneNumber, sessionToken, tokenType);

    console.log('Next steps:');
    console.log('1. Open your Homey app');
    console.log('2. Add a new PalGate device');
    console.log('3. Enter these credentials when prompted');
    console.log('4. Enter your Device ID (from PalGate app settings)\n');

  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('✗ CREDENTIAL TEST FAILED');
    console.error('='.repeat(70));
    console.error(`\nError: ${error.message}\n`);
    console.error('Possible issues:');
    console.error('- Session token is incorrect or expired');
    console.error('- Phone number doesn\'t match the token');
    console.error('- Wrong token type selected');
    console.error('- Network connectivity issues');
    console.error('\nTry running "node get-token.js" to get fresh credentials.\n');
    console.error('='.repeat(70) + '\n');
    rl.close();
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\nOperation cancelled.\n');
  rl.close();
  process.exit(130);
});

// Run main
main();
