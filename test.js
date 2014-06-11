    var arp = require('./index')
      , tbl = { ipaddrs: {}, ifnames : {} }
      ;

    arp.arpTable(function(err, entry) {
      if (err) console.log('arp: ' + err.message);
      if (!entry) return console.log(JSON.stringify(tbl));

      tbl.ipaddrs[entry.ip] = { ifname : entry.ifname, mac: entry.mac };
      if (!tbl.ifnames[entry.ifname]) tbl.ifnames[entry.ifname] = {};
      tbl.ifnames[entry.ifname][entry.mac] = entry.ip;
    });

    arp.ifTable(function(err, entry) {
      if (err) console.log('arp: ' + err.message);
      if (!!entry) console.log(entry);
    });
