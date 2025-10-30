'use strict';

const Homey = require('homey');
const { generateToken } = require('../../lib/tokenGenerator');
const https = require('https');

class PalGateDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('PalGate Device has been initialized');

    // Get device settings
    this.settings = this.getSettings();

    // Initialize garage door as closed
    await this.setCapabilityValue('garagedoor_closed', true).catch(this.error);

    // Register capability listeners
    this.registerCapabilityListener('button.open_gate', this.onCapabilityButtonOpenGate.bind(this));
    this.registerCapabilityListener('garagedoor_closed', this.onCapabilityGarageDoorClosed.bind(this));

    this.log(`Device initialized: ${this.getName()}`);
  }

  /**
   * onAdded is called when the user adds the device
   */
  async onAdded() {
    this.log('PalGate Device has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   */
  async onSettings({ newSettings }) {
    this.log('PalGate Device settings were changed');
    this.settings = newSettings;
  }

  /**
   * onRenamed is called when the user updates the device's name.
   */
  async onRenamed(name) {
    this.log('PalGate Device was renamed to', name);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('PalGate Device has been deleted');
  }


  /**
   * Handle button.open_gate capability
   */
  async onCapabilityButtonOpenGate() {
    this.log('Open gate button pressed');

    try {
      // Open the gate
      await this.openGate();
      this.log('Gate opened successfully');

    } catch (error) {
      this.error('Error opening gate from button:', error);
      throw error;
    }
  }

  /**
   * Handle garagedoor_closed capability
   */
  async onCapabilityGarageDoorClosed(value) {
    this.log('Garage door status changed:', value ? 'closed' : 'open');

    // If user manually sets to open, trigger the gate opening
    if (value === false) {
      try {
        await this.openGate();
      } catch (error) {
        this.error('Error opening gate:', error);
        // Reset to closed state if opening fails
        await this.setCapabilityValue('garagedoor_closed', true).catch(this.error);
        throw error;
      }
    }
  }

  /**
   * Open the gate via PalGate API
   */
  async openGate() {
    this.log('Opening gate...');

    const deviceId = this.settings.deviceId;
    const phoneNumber = this.settings.phoneNumber;
    const token = this.settings.token;
    const tokenType = parseInt(this.settings.tokenType || '1', 10);

    if (!deviceId || !phoneNumber || !token) {
      throw new Error('Device ID, phone number, and token are required');
    }

    // Generate API token
    let apiToken;
    try {
      this.log('Generating token with:', {
        phoneNumber,
        tokenLength: token.length,
        tokenType
      });
      apiToken = generateToken(token, phoneNumber, tokenType);
      this.log('Generated API token (first 20 chars):', apiToken.substring(0, 20) + '...');
    } catch (error) {
      this.error('Error generating token:', error);
      throw new Error('Failed to generate authentication token');
    }

    // Make API request
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api1.pal-es.com',
        port: 443,
        path: `/v1/bt/device/${deviceId}/open-gate?outputNum=1`,
        method: 'GET',
        headers: {
          'x-bt-token': apiToken,
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Type': 'application/json',
          'User-Agent': 'okhttp/4.9.3'
        }
      };

      this.log(`Making API request to: ${options.hostname}${options.path}`);

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', async () => {
          this.log(`API response status: ${res.statusCode}`);
          this.log(`API response body: ${data}`);

          if (res.statusCode === 200 || res.statusCode === 204) {
            this.log('Gate opened successfully');

            // Update garage door status to open
            await this.setCapabilityValue('garagedoor_closed', false).catch(this.error);

            // Reset to closed after configured delay
            const resetDelay = (this.settings.resetDelay || 5) * 1000;
            setTimeout(async () => {
              await this.setCapabilityValue('garagedoor_closed', true).catch(this.error);
              this.log('Gate status reset to closed');
            }, resetDelay);

            resolve(data);
          } else {
            const error = new Error(`API request failed with status ${res.statusCode}: ${data}`);
            this.error(error);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        this.error('API request error:', {
          message: error.message,
          code: error.code,
          errno: error.errno,
          syscall: error.syscall,
          address: error.address
        });
        reject(new Error(`Network error: ${error.message} (${error.code || 'UNKNOWN'})`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        const error = new Error('API request timeout after 10 seconds. Check network connectivity to api1.pal-es.com');
        this.error(error);
        reject(error);
      });

      req.end();
    });
  }

}

module.exports = PalGateDevice;
