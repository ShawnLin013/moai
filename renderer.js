var exec = require('child-process-promise').exec;
var os = require('os');

function getInterfaces() {
  var result = [];
  var ifaces = os.networkInterfaces();
  for (var iface in ifaces) {
    ifaces[iface].forEach(function(details) {
      if (details.family ==='IPv4' && details.address !== '127.0.0.1' && details.internal === false) {
        result.push(iface);
      }
    });
  }
  return result;
}

function runExecs(cmds) {
  var promises = [];
  cmds.forEach(cmd => {
    promises.push(exec(cmd));
  });
  Promise.all(promises).then(function (result) {
    console.log(result.stdout);
  })
  .catch(function (err) {
    console.error(err.stdout);
  });
}

function setDHCP(name) {
  var cmds = [
    `netsh interface ip set address "${name}" dhcp`,
    `netsh interface ip set dnsservers "${name}" dhcp`,
    `netsh interface ip set winsservers "${name}" dhcp`
  ]
  runExecs(cmds);
}

function setIP(name, ip, netmask, gateway, dns1, dns2) {
  var cmds = [
    `netsh interface ip set address "${name}" static ${ip} ${netmask} ${gateway} 1`,
    `netsh interface ip set dnsservers "${name}" static ${dns1}`,
    `netsh interface ip add dnsservers "${name}" ${dns2}`
  ]
  runExecs(cmds);
}

// setDHCP("乙太網路");
// setIP("乙太網路", "192.168.1.2", "255.255.255.0", "192.168.1.254", "8.8.8.8", "1.1.1.1");