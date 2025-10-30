'use strict';

const Homey = require('homey');

class PalGateApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('PalGate app has been initialized');
  }

}

module.exports = PalGateApp;
