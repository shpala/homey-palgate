'use strict';

const Homey = require('homey');

class PalGateDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('PalGate Driver has been initialized');
  }

  /**
   * onPair is called when a user starts pairing
   */
  async onPair(session) {
    this.log('Pairing started');

    let pairingDevice = null;

    // Handle credentials from custom view
    session.setHandler('credentials_entered', async (data) => {
      this.log('Credentials received:', {
        phoneNumber: data.phoneNumber,
        deviceId: data.deviceId,
        tokenType: data.tokenType,
        tokenLength: data.token.length
      });

      // Validate inputs
      if (!data.phoneNumber || !/^\d+$/.test(data.phoneNumber)) {
        throw new Error('Invalid phone number format. Use only digits with country code (e.g., 972501234567)');
      }

      if (!data.token || !/^[0-9a-fA-F]{32}$/.test(data.token)) {
        throw new Error('Invalid token format. Token should be 32 hexadecimal characters.');
      }

      if (!data.deviceId) {
        throw new Error('Device ID is required');
      }

      // Store the pairing device data
      pairingDevice = {
        name: `PalGate (${data.deviceId})`,
        data: {
          id: data.deviceId
        },
        settings: {
          deviceId: data.deviceId,
          phoneNumber: data.phoneNumber,
          token: data.token,
          tokenType: data.tokenType || '1',
          resetDelay: 5
        }
      };

      this.log('Device prepared for pairing:', pairingDevice.name);
      return true;
    });

    // Handle list_devices
    session.setHandler('list_devices', async () => {
      this.log('List devices called');

      if (!pairingDevice) {
        this.log('No pairing device found, returning empty list');
        return [];
      }

      this.log('Returning device:', pairingDevice.name);
      return [pairingDevice];
    });
  }

}

module.exports = PalGateDriver;
