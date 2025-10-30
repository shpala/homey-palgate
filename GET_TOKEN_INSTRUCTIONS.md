# How to Get Your PalGate Session Token

This guide explains how to obtain the 32-character session token required to set up the Homey PalGate Opener app.

## Method 1: Using the Helper Script (Recommended)

This is the easiest method. The helper script automates the Device Linking process.

### Steps:

1. **Open a terminal** and navigate to the app directory:
   ```bash
   cd /path/to/homey-palgate-opener
   ```

2. **Run the helper script**:
   ```bash
   node get-token.js
   ```

3. **The script will display a QR code** (as JSON text). You have two options:
   - Copy the JSON and generate a QR code at https://www.qr-code-generator.com/
   - Or manually enter the UUID from the JSON into the PalGate app

4. **Open your PalGate mobile app**:
   - Go to Menu (☰)
   - Select "Device Linking" or "הוספת מכשיר" (Hebrew)
   - Tap "Scan QR Code"
   - Scan the QR code you generated

5. **Wait for authentication**: The script will detect when you scan the QR code and display your credentials:
   ```
   Phone Number: 972501234567
   Session Token: a1b2c3d4e5f6789012345678901234ab
   Token Type: 1 (PRIMARY)
   ```

6. **Copy these credentials** - you'll need them for Homey setup!

## Method 2: Using Python (pylgate)

If you prefer Python:

1. **Install pylgate**:
   ```bash
   pip install git+https://github.com/shpala/pylgate.git
   ```

2. **Run the example script**:
   ```bash
   cd /tmp
   python3 << 'EOF'
   import sys
   sys.path.insert(0, '/home/shpala/dev/pylgate')
   from examples.generate_linked_device_session_token import main
   main()
   EOF
   ```

3. **Scan the QR code** with your PalGate app as in Method 1

4. **Copy the displayed credentials**

## Method 3: Manual Extraction (Advanced)

If you want to extract the token directly from the PalGate app:

1. Install a network monitoring tool (e.g., Charles Proxy, mitmproxy)
2. Configure your phone to route traffic through the proxy
3. Open the PalGate app and let it authenticate
4. Look for API requests to `api1.pal-es.com`
5. Find the `x-bt-token` header in requests
6. The session token is stored in the app's secure storage

**Note**: This method is complex and not recommended for most users.

## Understanding Token Types

When you get your token, you'll also receive a token type:

- **Type 0 (SMS)**: Token obtained via SMS verification
- **Type 1 (PRIMARY)**: First linked device token (most common)
- **Type 2 (SECONDARY)**: Second linked device token

Most users will have Type 1 (PRIMARY).

## Troubleshooting

### "Timeout: QR code was not scanned"
- Make sure you're scanning the correct QR code
- Ensure your phone has internet connection
- Try generating the QR code online if the JSON doesn't scan properly
- Run the script again

### "Request failed" or network errors
- Check your internet connection
- Verify the PalGate API is accessible
- Try again in a few minutes

### Token doesn't work in Homey
- Verify you copied the entire 32-character token
- Make sure there are no extra spaces
- Check that the phone number matches your PalGate account
- Ensure you're using the correct token type

## What's Next?

Once you have your session token:

1. Open the Homey app
2. Go to Devices → Add Device
3. Select "PalGate Opener"
4. Enter your:
   - Phone number (e.g., `972501234567`)
   - Session token (32 hex characters)
   - Device ID (from PalGate app settings)
5. Choose your token type
6. Complete the setup!

## Security Notes

- **Keep your session token private** - it's like a password
- Don't share it publicly or in screenshots
- Tokens may expire over time - you'll need to generate a new one
- Each linked device gets its own token

## Need Help?

If you're still having trouble:
- Check the main README.md for more information
- Review the Homey app logs for error messages
- Open an issue on GitHub with details about your problem
