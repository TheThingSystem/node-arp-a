var child    = require('child_process')
  , fs       = require('fs')
  ;

if (process.platform.indexOf('darwin') === 0) {
  var arp = require('./build/Release/macos.node');

  exports.arpTable = function(cb) {
    var i, table;

    try { table = arp.arpTable(); } catch(ex) { return cb(ex, null); }

    for (i = 0; i < table.length; i++) {
      cb(null, table[i]);
    }

    cb(null, null);
  };
}

if (process.platform.indexOf('linux') === 0) {
/* as noted in node-arp

  parse this format

  IP address       HW type     Flags       HW address            Mask     Device
  192.168.1.1      0x1         0x2         50:67:f0:8c:7a:3f     *        em1

 */

  exports.arpTable = function(cb) {
    fs.readFile('/proc/net/arp', function(err, data) {
      var cols, i, lines;

      if (!!err) return cb(err, null);

      lines = data.toString().split('\n');
      for (i = 0; i < lines.length; i++) {
        if (i === 0) continue;

        cols = lines[i].replace(/ [ ]*/g, ' ').split(' ');
        if ((cols.length > 3) && (cols[0].length !== 0) && (cols[3].length !== 0)) {
          cb(null, { ip: cols[0], mac: cols[3], iface: cols[5] });
        }
      }

      cb(null, null);
    });
  };
}

if (process.platform.indexOf('win') === 0) {
/* as noted in node-arp

  parse this format

  [blankline]
  Interface: 192.168.1.54
    Internet Address      Physical Address     Type
    192.168.1.1           50-67-f0-8c-7a-3f    dynamic

 */

  exports.arpTable = function(cb) {
    var arp, cols, i, lines, stderr, stdout;

    stdout = '';
    stderr = '';
    arp = child.spawn('arp', [ '-a' ]);
    arp.stdin.end();
    arp.stdout.on('data', function(data) { stdout += data.toString() ; });
    arp.stderr.on('data', function(data) { stderr += data.toString() ; });

    arp.on('close', function(code) {
      if (code !== 0) return cb(new Error('exit code ' + code + ', reason: ' + stderr), null);

      lines = stdout.split('\r');
      for (i = 0; i < lines.length; i++) {
        if (i < 3) continue;

        cols = lines[i].replace(/ [ ]*/g, ' ').split(' ');
        if ((cols.length === 4) && (cols[1].length !== 0) && (cols[2].length !== 0)) {
          cb(null, { ip: cols[1], mac: cols[2] });
        }
      }

      cb(null, null);
    });
  };
}

exports.table = exports.arpTable;
