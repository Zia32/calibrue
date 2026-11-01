// Calibrue link: phone ↔ laptop messages through public MQTT relays.
// Both sides connect to every relay in RELAYS and send each message on all of them;
// the receiver drops duplicates. So the link works as long as any one relay is up,
// and it never depends on the two devices reaching each other directly.
// Topics: calibrue/v1/<code>/L (to laptop), calibrue/v1/<code>/P (to phone).
(function (root) {
  const RELAYS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
  ];
  const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');

  // role: 'laptop' | 'phone'. Returns { send(m), close(), relaysUp() }.
  function open(code, role, { onMessage, onStatus } = {}) {
    const me = role === 'laptop' ? 'L' : 'P', other = role === 'laptop' ? 'P' : 'L';
    const base = 'calibrue/v1/' + code + '/';
    const seen = new Set(), order = [], clients = [];
    const up = () => clients.filter(c => c.connected).length;
    const status = () => onStatus && onStatus({ relaysUp: up(), relays: clients.length });
    if (!root.mqtt) { setTimeout(() => onStatus && onStatus({ relaysUp: 0, relays: 0, error: 'library' }), 0); }
    else for (const url of RELAYS) {
      let c;
      try {
        c = root.mqtt.connect(url, { clientId: 'calibrue-' + me + '-' + rid(), clean: true,
          connectTimeout: 8000, reconnectPeriod: 3000, keepalive: 20 });
      } catch (e) { continue; }
      clients.push(c);
      c.on('connect', () => { c.subscribe(base + me, { qos: 0 }); status(); });
      c.on('close', status); c.on('offline', status); c.on('error', () => {});
      c.on('message', (topic, payload) => {
        let e; try { e = JSON.parse(payload.toString()); } catch (x) { return; }
        if (!e || !e.id || seen.has(e.id)) return;
        seen.add(e.id); order.push(e.id); if (order.length > 1000) seen.delete(order.shift());
        onMessage && onMessage(e.m);
      });
    }
    return {
      send(m) {
        const e = JSON.stringify({ id: rid(), m });
        for (const c of clients) if (c.connected) c.publish(base + other, e, { qos: 0 });
        return up() > 0;
      },
      close() { for (const c of clients) { try { c.end(true); } catch (e) {} } },
      relaysUp: up,
    };
  }
  root.CalLink = { open, RELAYS };
})(window);
