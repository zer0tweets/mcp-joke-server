import handler from './api/mcp/call-tool.js';

// Mock request and response objects
const req = {
  method: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  body: {
    tool: 'get_random_joke'
  }
};

const res = {
  headers: {},
  statusCode: 200,
  setHeader(key, value) {
    this.headers[key] = value;
    console.log(`Header set: ${key} = ${value}`);
  },
  status(code) {
    this.statusCode = code;
    console.log(`Status: ${code}`);
    return this;
  },
  json(data) {
    console.log(`Response (${this.statusCode}):`, JSON.stringify(data, null, 2));
  },
  end() {
    console.log('Response ended');
  }
};

console.log('Testing MCP endpoint locally...\n');

try {
  await handler(req, res);
} catch (error) {
  console.error('Error calling handler:', error);
}
