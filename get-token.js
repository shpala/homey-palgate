#!/usr/bin/env node
'use strict';

/**
 * PalGate Session Token Helper
 *
 * This script helps you obtain a session token via Device Linking.
 * It generates a QR code that you scan with your PalGate mobile app.
 */

const https = require('https');
const { randomUUID } = require('crypto');

const BASE_URL = 'https://api1.pal-es.com';
const ANDROID_USER_AGENT = 'okhttp/4.9.3';

// Token type mapping
const TOKEN_TYPES = {
  0: 'SMS',
  1: 'PRIMARY (Linked Device - First)',
  2: 'SECONDARY (Linked Device - Second)'
};

console.log('\n' + '='.repeat(70));
console.log('PalGate Session Token Generator');
console.log('='.repeat(70) + '\n');

/**
 * Generate ASCII art QR code
 */
function generateQR(data) {
  // Simple ASCII QR code - just display the JSON for manual entry in QR generator
  console.log('QR Code Data (scan this with your PalGate app):');
  console.log('─'.repeat(70));
  console.log(data);
  console.log('─'.repeat(70));
  console.log('\nYou can also generate a QR code online at: https://www.qr-code-generator.com/');
  console.log('Just paste the JSON above into the "Text" field.\n');
}

/**
 * Make HTTPS request
 */
function makeRequest(path, method = 'GET', headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
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
          if (res.statusCode >= 200 && res.statusCode < 300 && jsonData.status === 'ok' && !jsonData.err) {
            resolve(jsonData);
          } else {
            reject(new Error(`Request failed: ${JSON.stringify(jsonData)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}\nBody: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Start device linking process
 */
async function startDeviceLinking() {
  const uniqueId = randomUUID();
  const qrData = JSON.stringify({ id: uniqueId });

  console.log('Step 1: Generating QR Code...\n');
  generateQR(qrData);

  console.log('Step 2: Waiting for you to scan the QR code with PalGate app...');
  console.log('(Open PalGate app → Menu → Device Linking → Scan QR Code)\n');
  console.log('Polling for authentication (this may take up to 60 seconds)...\n');

  // Poll the API until the user scans
  const maxAttempts = 60;
  const pollInterval = 1000; // 1 second

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await makeRequest(`/v1/bt/un/secondary/init/${uniqueId}`);

      if (response.user && response.user.token) {
        console.log('✓ Authentication successful!\n');

        const phoneNumber = response.user.id;
        const sessionToken = response.user.token;
        const tokenType = parseInt(response.secondary, 10);

        console.log('='.repeat(70));
        console.log('Your PalGate Credentials:');
        console.log('='.repeat(70));
        console.log(`\nPhone Number: ${phoneNumber}`);
        console.log(`Session Token: ${sessionToken}`);
        console.log(`Token Type: ${tokenType} (${TOKEN_TYPES[tokenType] || 'Unknown'})`);
        console.log('\n' + '='.repeat(70));
        console.log('\nIMPORTANT: Save these credentials securely!');
        console.log('You will need them to configure the Homey PalGate app.\n');
        console.log('='.repeat(70) + '\n');

        return { phoneNumber, sessionToken, tokenType };
      }
    } catch (error) {
      // Expected to fail until user scans
      if (attempt % 5 === 0) {
        process.stdout.write(`Still waiting... (${attempt}/${maxAttempts})\n`);
      } else {
        process.stdout.write('.');
      }
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Timeout: QR code was not scanned within 60 seconds');
}

/**
 * Main function
 */
async function main() {
  try {
    const credentials = await startDeviceLinking();

    console.log('Next Steps:');
    console.log('1. Copy the Session Token above');
    console.log('2. Open your Homey app');
    console.log('3. Add a new PalGate device');
    console.log('4. Enter your Phone Number and Session Token when prompted');
    console.log('5. Enter your Device ID (find it in PalGate app settings)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Make sure you have internet connection');
    console.error('- Verify you scanned the correct QR code');
    console.error('- Try running the script again');
    console.error('- Check if the PalGate API is accessible\n');
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nOperation cancelled by user.\n');
  process.exit(130);
});

// Run main function
main();
