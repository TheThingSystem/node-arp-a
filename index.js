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

  exports.ifTable = function(cb) {
    var i, table;

    try { table = arp.ifTable(); } catch(ex) { return cb(ex, null); }

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
          cb(null, { ip: cols[0], mac: cols[3] });
        }
      }

      cb(null, null);
    });
  };

  exports.ifTable = function(cb) {
    fs.readDir('/sys/class/net', function(err, files) {
      var i, j;

      if (!!err) return cb(err, null);

      var f = function(ifn) {
        return function(err, data) {
          if (!!err) { j = files.length; return cb(err, null); }

          cb (null, { name: ifn, mac: data });
          if (++j == files.length) cb(null, null);
        };
      };

      j = 0;
      for (i = 0; i < files.length; i++) fs.readFile('/sys/class/net/' + files[i] + '/address', f(files[i]));
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
    arp = child.spawn('/tmp/arp.sh', [ '-a' ]);
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


  exports.ifTable = function(cb) { cb(new Error('ifTable not supported for windows')); };
}

exports.table = exports.arpTable;
