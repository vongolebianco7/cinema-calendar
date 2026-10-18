const net = require('node:net');

// Probe only the listener. The browser verifies HTTP/DOM readiness afterwards.
// Do not leave an undici HTTP parser attached when terminating the local server.
async function waitForLocalServer(port, timeoutMs = 10000, retryMs = 100) {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    const ready = await new Promise(resolve => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => { socket.destroy(); resolve(false); });
      socket.setTimeout(500, () => socket.destroy(new Error('local server probe timeout')));
    });
    if (ready) return;
    if (Date.now() >= deadline) throw new Error('local static server did not start');
    await new Promise(resolve => setTimeout(resolve, retryMs));
  }
}
module.exports = { waitForLocalServer };
