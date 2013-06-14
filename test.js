    var arp = require('./arp-a')
      , fin = 0
      , tbl = { ipaddrs: {}, macaddrs : {} }
      ;

    arp.table(function(err, entry) {
      if (err) console.log('arp: ' + err.message);
      if (!entry) {
        fin = 1;
console.log(JSON.stringify(tbl));
        return;
      }

      tbl.ipaddrs[entry.ip] = entry.mac;
      tbl.macaddrs[entry.mac] = entry.ip;
// {"ipaddrs":{"192.168.1.1":"50:67:f0:8c:7a:3f"},"macaddrs":{"50:67:f0:8c:7a:3f":"192.168.1.1"}}
    });
