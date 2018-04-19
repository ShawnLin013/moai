var { exec } = require('child_process');
var cmd = 'ipconfig';
var os = require('os');
var ifaces = os.networkInterfaces();
var names = [];

for (var iface in ifaces) {
  ifaces[iface].forEach(function(details) {
    if (details.family ==='IPv4' && details.address !== '127.0.0.1' && details.internal === false) {
      names.push(iface);
    }
  });
}

for (var name of names) {
  console.log(name);
  exec(`netsh interface ip show config name="${name}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

