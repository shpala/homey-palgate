# PalGate Opener for Homey Pro

Control your PalGate entrance gates and barriers directly from your Homey Pro smart home system.

## About

This app enables integration between PalGate controlled gates/barriers and Homey Pro, allowing you to:
- Open your gate remotely through Homey
- Create automations (e.g., auto-open when arriving home)
- Control your gate with voice commands (if using voice assistants with Homey)
- Integrate gate control with other smart home devices

## Based On

This app is based on the excellent [homebridge-palgate-opener](https://github.com/RoeiOfri/homebridge-palgate-opener) by Roei Ofri, ported to work with Homey Pro.

## Prerequisites

Before installing this app, you need to obtain your PalGate credentials:

### 1. Session Token (32-character hex string)

You need a session token from the PalGate system. This is the most important credential.

**Easy Method - Use the Helper Script:**

1. Install Node.js dependencies:
   ```bash
   cd /path/to/homey-palgate-opener
   npm install
   ```

2. Run the token generator helper:
   ```bash
   node get-token.js
   ```

3. Scan the QR code with your PalGate mobile app (Menu → Device Linking → Scan QR)

4. The script will display your session token, phone number, and token type

**Alternative Method - Using Python:**

If you prefer Python, use the `pylgate` library:

```bash
pip install git+https://github.com/shpala/pylgate.git
python3 -c "from pylgate.examples import generate_linked_device_session_token; generate_linked_device_session_token.main()"
```

**Manual Method:**

You can also extract the token from the PalGate app using network monitoring tools, but this is more complex.

### 2. Phone Number
Your PalGate account phone number with country code (e.g., `972501234567` for Israel)

### 3. Device ID
Your gate's device identifier - found in the PalGate app under device settings

### 4. Token Type
Choose the appropriate token type:
- **0**: SMS token
- **1**: Primary device (recommended for first linked device)
- **2**: Secondary device (for additional linked devices)

## Quick Start Guide

### Step 1: Get Your Session Token

Run the helper script to obtain your credentials:
```bash
node get-token.js
```

See [GET_TOKEN_INSTRUCTIONS.md](GET_TOKEN_INSTRUCTIONS.md) for detailed instructions.

### Step 2: Test Your Credentials (Optional but Recommended)

Verify your credentials work before setting up Homey:
```bash
node test-credentials.js
```

This will confirm your phone number, session token, and token type are valid.

### Step 3: Install in Homey

1. Install this app on your Homey Pro
2. Go to Devices → Add Device
3. Select "PalGate Opener"
4. Follow the pairing wizard:
   - Enter your phone number (with country code, e.g., `972501234567`)
   - Enter your session token (32 hex characters)
   - Enter your device ID (from PalGate app)
5. Configure additional settings if needed

## Configuration

After adding your device, you can configure:

- **Device ID**: Your PalGate device identifier
- **Phone Number**: Your account phone number with country code
- **Session Token**: Your 32-character session token
- **Token Type**: Token type (0=SMS, 1=Primary, 2=Secondary)
- **Reset Delay**: How many seconds before the gate status resets to "closed" (default: 5)

## Usage

### Manual Control
- Open the device card in Homey
- Toggle the gate control to open your gate
- The gate status will automatically reset after the configured delay

### Automation
Create flows to automate your gate:

**Example: Open gate when arriving home**
- Trigger: Phone enters home zone
- Action: Open PalGate device

**Example: Open gate at specific time**
- Trigger: Time is 08:00
- Action: Open PalGate device

## Device Type

This app uses the "garagedoor" device class, which:
- Appears as a garage door in Homey's interface
- Works with standard garage door automation flows
- Provides binary open/closed states

## How It Works

The app:
1. Generates a temporary authentication token using AES-128 encryption
2. Sends an HTTPS request to the PalGate API endpoint
3. Opens the gate/barrier
4. Automatically resets the state after the configured delay

## API Details

- **Endpoint**: `https://api1.pal-es.com/v1/bt/device/{deviceId}/open-gate`
- **Authentication**: Token-based via `x-bt-token` header
- **Method**: GET request with output parameter

## Security Notes

- Your session token is stored securely in Homey's settings
- A new temporary token is generated for each gate operation
- Tokens expire automatically after use
- No credentials are sent over the network except during API calls

## Troubleshooting

### Gate doesn't open
- Verify your session token is correct and hasn't expired
- Check your phone number format (include country code, no spaces or special characters)
- Ensure your device ID is correct
- Check Homey's app logs for error messages

### Token expired
- Session tokens may expire over time
- You'll need to extract a new token from the PalGate app
- Update the token in your device settings

### Invalid token format
- Token must be exactly 32 hexadecimal characters
- No spaces, dashes, or other characters

## Support

For issues and feature requests, please check:
- Homey Community Forums
- Original homebridge plugin: https://github.com/RoeiOfri/homebridge-palgate-opener

## Credits

- Original implementation: [Roei Ofri](https://github.com/RoeiOfri)
- Homebridge plugin: [homebridge-palgate-opener](https://github.com/RoeiOfri/homebridge-palgate-opener)
- Ported to Homey Pro by the Homey Community

## License

MIT License

## Disclaimer

This app is not affiliated with or endorsed by PalGate. Use at your own risk.
