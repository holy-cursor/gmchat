// Mock crypto for browser environment
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto');
}

// Mock stream for browser environment
if (typeof global.stream === 'undefined') {
  global.stream = require('stream');
}
