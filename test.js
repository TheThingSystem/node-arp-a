    var arp = require('./index')
      , tbl = { ipaddrs: {}, macaddrs : {} }
      ;

    arp.arpTable(function(err, entry) {
      if (err) console.log('arp: ' + err.message);
      if (!entry) return console.log(JSON.stringify(tbl));

      tbl.ipaddrs[entry.ip] = entry.mac;
      tbl.macaddrs[entry.mac] = entry.ip;
    });

    arp.ifTable(function(err, entry) {
      if (err) console.log('arp: ' + err.message);
      if (!!entry) console.log(entry);
    });
