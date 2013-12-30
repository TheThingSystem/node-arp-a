    var arp = require('./index')
      , fin = 0
      , tbl = { ipaddrs: {}, macaddrs : {} }
      ;

    arp.table(function(err, entry) {
      if (err) console.log('arp: ' + err.message);
      if (!entry) {
        fin = 1;
        return console.log(JSON.stringify(tbl));
      }

      tbl.ipaddrs[entry.ip] = entry.mac;
      tbl.macaddrs[entry.mac] = entry.ip;
    });
