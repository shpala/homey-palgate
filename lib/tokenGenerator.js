'use strict';

// AES Constants
const BLOCK_SIZE = 16;
const KEY_SIZE = 16;
const TOKEN_SIZE = 23;
const TIMESTAMP_OFFSET = 2;

// AES S-box
const S_BOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

// AES Inverse S-box
const INVERSE_S_BOX = [
  0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
  0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
  0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
  0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
  0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
  0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
  0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
  0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
  0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
  0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
  0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
  0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
  0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
  0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
  0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
  0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
];

// Round constants
const RCON = [
  0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
];

// PalGate template key constant
const T_C_KEY = Buffer.from([0xfa, 0xd3, 0x25, 0x72, 0x81, 0x29, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3a, 0xb4, 0x5a, 0x65]);

/**
 * Galois field multiplication by 2
 */
function galoisMul2(value) {
  if (value >> 7) {
    return ((value << 1) ^ 0x1b) & 0xff;
  }
  return (value << 1) & 0xff;
}

/**
 * AES encrypt/decrypt implementation matching pylgate
 * This is a compact implementation that matches the Python ctypes version
 */
function aesEncryptDecrypt(state, key, isEncrypt) {
  if (state.length !== BLOCK_SIZE || key.length !== KEY_SIZE) {
    throw new Error('State and/or key are not 16 bytes');
  }

  // Create mutable copies
  const stateArray = Buffer.from(state);
  const keyArray = Buffer.from(key);

  if (isEncrypt) {
    // Key expansion for encryption (first part)
    for (let rnd = 0; rnd < 10; rnd++) {
      keyArray[0] = S_BOX[keyArray[13]] ^ keyArray[0] ^ RCON[rnd];
      keyArray[1] = S_BOX[keyArray[14]] ^ keyArray[1];
      keyArray[2] = S_BOX[keyArray[15]] ^ keyArray[2];
      keyArray[3] = S_BOX[keyArray[12]] ^ keyArray[3];
      for (let i = 4; i < KEY_SIZE; i++) {
        keyArray[i] = keyArray[i] ^ keyArray[i - 4];
      }
    }

    // Initial add round key
    for (let i = 0; i < BLOCK_SIZE; i++) {
      stateArray[i] = stateArray[i] ^ keyArray[i];
    }
  }

  // Main rounds
  for (let rnd = 0; rnd < 10; rnd++) {
    if (isEncrypt) {
      // Reverse key expansion for next round
      for (let i = KEY_SIZE - 1; i > 3; i--) {
        keyArray[i] = keyArray[i] ^ keyArray[i - 4];
      }
      keyArray[0] = S_BOX[keyArray[13]] ^ keyArray[0] ^ RCON[9 - rnd];
      keyArray[1] = S_BOX[keyArray[14]] ^ keyArray[1];
      keyArray[2] = S_BOX[keyArray[15]] ^ keyArray[2];
      keyArray[3] = S_BOX[keyArray[12]] ^ keyArray[3];
    } else {
      // SubBytes for decryption
      for (let i = 0; i < BLOCK_SIZE; i++) {
        stateArray[i] = S_BOX[stateArray[i] ^ keyArray[i]];
      }

      // ShiftRows for decryption
      let buf1 = stateArray[1];
      stateArray[1] = stateArray[5];
      stateArray[5] = stateArray[9];
      stateArray[9] = stateArray[13];
      stateArray[13] = buf1;

      let buf2;
      buf1 = stateArray[2];
      buf2 = stateArray[6];
      stateArray[2] = stateArray[10];
      stateArray[6] = stateArray[14];
      stateArray[10] = buf1;
      stateArray[14] = buf2;

      buf1 = stateArray[15];
      stateArray[15] = stateArray[11];
      stateArray[11] = stateArray[7];
      stateArray[7] = stateArray[3];
      stateArray[3] = buf1;
    }

    // MixColumns
    if ((rnd > 0 && isEncrypt) || (rnd < 9 && !isEncrypt)) {
      for (let i = 0; i < 4; i++) {
        const buf4 = i << 2;

        if (isEncrypt) {
          const buf1 = galoisMul2(galoisMul2(stateArray[buf4] ^ stateArray[buf4 + 2]));
          const buf2 = galoisMul2(galoisMul2(stateArray[buf4 + 1] ^ stateArray[buf4 + 3]));
          stateArray[buf4] ^= buf1;
          stateArray[buf4 + 1] ^= buf2;
          stateArray[buf4 + 2] ^= buf1;
          stateArray[buf4 + 3] ^= buf2;
        }

        const buf1 = stateArray[buf4] ^ stateArray[buf4 + 1] ^ stateArray[buf4 + 2] ^ stateArray[buf4 + 3];
        const buf2 = stateArray[buf4];
        let buf3 = galoisMul2(stateArray[buf4] ^ stateArray[buf4 + 1]);
        stateArray[buf4] = stateArray[buf4] ^ buf3 ^ buf1;
        buf3 = galoisMul2(stateArray[buf4 + 1] ^ stateArray[buf4 + 2]);
        stateArray[buf4 + 1] = stateArray[buf4 + 1] ^ buf3 ^ buf1;
        buf3 = galoisMul2(stateArray[buf4 + 2] ^ stateArray[buf4 + 3]);
        stateArray[buf4 + 2] = stateArray[buf4 + 2] ^ buf3 ^ buf1;
        buf3 = galoisMul2(stateArray[buf4 + 3] ^ buf2);
        stateArray[buf4 + 3] = stateArray[buf4 + 3] ^ buf3 ^ buf1;
      }
    }

    if (isEncrypt) {
      // ShiftRows for encryption
      let buf1 = stateArray[13];
      stateArray[13] = stateArray[9];
      stateArray[9] = stateArray[5];
      stateArray[5] = stateArray[1];
      stateArray[1] = buf1;

      let buf2;
      buf1 = stateArray[10];
      buf2 = stateArray[14];
      stateArray[10] = stateArray[2];
      stateArray[14] = stateArray[6];
      stateArray[2] = buf1;
      stateArray[6] = buf2;

      buf1 = stateArray[3];
      stateArray[3] = stateArray[7];
      stateArray[7] = stateArray[11];
      stateArray[11] = stateArray[15];
      stateArray[15] = buf1;

      // SubBytes and AddRoundKey for encryption
      for (let i = 0; i < BLOCK_SIZE; i++) {
        stateArray[i] = INVERSE_S_BOX[stateArray[i]] ^ keyArray[i];
      }
    } else {
      // Key expansion for decryption
      keyArray[0] = S_BOX[keyArray[13]] ^ keyArray[0] ^ RCON[rnd];
      keyArray[1] = S_BOX[keyArray[14]] ^ keyArray[1];
      keyArray[2] = S_BOX[keyArray[15]] ^ keyArray[2];
      keyArray[3] = S_BOX[keyArray[12]] ^ keyArray[3];
      for (let i = 4; i < KEY_SIZE; i++) {
        keyArray[i] = keyArray[i] ^ keyArray[i - 4];
      }
    }
  }

  if (!isEncrypt) {
    // Final add round key for decryption
    for (let i = 0; i < BLOCK_SIZE; i++) {
      stateArray[i] = stateArray[i] ^ keyArray[i];
    }
  }

  return stateArray;
}

/**
 * Step 1: Generate intermediate key from session token and phone number
 */
function step1(sessionToken, phoneNumber) {
  const key = Buffer.from(T_C_KEY);

  // Pack phone number as big-endian 8 bytes and copy bytes 2-7 to key[6:12]
  const phoneBytes = Buffer.alloc(8);
  phoneBytes.writeBigUInt64BE(BigInt(phoneNumber));
  phoneBytes.copy(key, 6, 2, 8);

  return aesEncryptDecrypt(sessionToken, key, true);
}

/**
 * Step 2: Generate token component from intermediate key and timestamp
 */
function step2(resultFromStep1, timestampMs, timestampOffset) {
  const nextState = Buffer.alloc(BLOCK_SIZE);

  // Pack 0x0a0a as little-endian uint16 at bytes 1-2
  nextState.writeUInt16LE(0x0a0a, 1);

  // Pack timestamp + offset as big-endian uint32 at bytes 10-13
  nextState.writeUInt32BE(timestampMs + timestampOffset, 10);

  return aesEncryptDecrypt(nextState, resultFromStep1, false);
}

/**
 * Generate PalGate API token
 * @param {string} sessionTokenHex - 32-character hex session token
 * @param {string|number} phoneNumber - Phone number with country code
 * @param {number} tokenType - Token type (0=SMS, 1=Primary, 2=Secondary)
 * @returns {string} Uppercase hex-encoded API token
 */
function generateToken(sessionTokenHex, phoneNumber, tokenType = 1) {
  // Convert hex string to buffer
  const sessionToken = Buffer.from(sessionTokenHex, 'hex');

  if (sessionToken.length !== BLOCK_SIZE) {
    throw new Error('Invalid session token - must be 16 bytes (32 hex characters)');
  }

  // Convert phone number to integer
  const phoneNum = typeof phoneNumber === 'string' ? parseInt(phoneNumber, 10) : phoneNumber;

  if (isNaN(phoneNum)) {
    throw new Error('Invalid phone number');
  }

  // Get current timestamp in seconds
  const timestampMs = Math.floor(Date.now() / 1000);

  // Execute two-step token generation
  const step2Key = step1(sessionToken, phoneNum);
  const step2Result = step2(step2Key, timestampMs, TIMESTAMP_OFFSET);

  // Assemble final token (23 bytes)
  const result = Buffer.alloc(TOKEN_SIZE);

  // Byte 0: Token type
  if (tokenType === 0) {
    result[0] = 0x01; // SMS
  } else if (tokenType === 1) {
    result[0] = 0x11; // PRIMARY
  } else if (tokenType === 2) {
    result[0] = 0x21; // SECONDARY
  } else {
    throw new Error(`Unknown token type: ${tokenType}`);
  }

  // Bytes 1-6: Phone number component
  // Use BigInt for phone number to handle > 32-bit values correctly
  const phoneBigInt = BigInt(phoneNum);
  result[1] = Number((phoneBigInt >> 40n) & 0xffn);
  result[2] = Number((phoneBigInt >> 32n) & 0xffn);
  result[3] = Number((phoneBigInt >> 24n) & 0xffn);

  const phoneBytes = Buffer.alloc(8);
  phoneBytes.writeBigUInt64BE(phoneBigInt);
  phoneBytes.copy(result, 4, 5, 8);

  // Bytes 7-22: Encrypted token component
  step2Result.copy(result, 7);

  // Return as uppercase hex string
  return result.toString('hex').toUpperCase();
}

module.exports = {
  generateToken
};
