node-arp-a
==========

A node.js native implementation (when possible) of "arp -a"

Why not use [the arp module](https://github.com/teknopaul/arp)?
I dislike parsing programmatic output (which can change at any time),
and prefer using API-based approaches. That's possible for Linux and Mac OS.

Also, I wanted a node.js module that returns the entire ARP table.


Install
-------

    npm install arp-a


API
---

    var arp = require('./arp-a')
      , fin = 0
      , tbl = { ipaddrs: {}, macaddrs : {} }
      ;

    arp.table(function(err, entry) {
      if (err) console.log('arp: ' + err.message);
      if (!entry) {
        fin = 1;
        return;
      }

      tbl.ipaddrs[entry.ip] = entry.mac;
      tbl.macaddrs[entry.mac] = entry.ip;
    });
