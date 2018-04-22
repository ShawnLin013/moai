var exec = require('child-process-promise').exec;
var os = require('os');
var settings = require('electron-settings');
var netsh = "netsh interface ip";

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
  return Promise.all(promises).then(function (ressult) {
    console.log(result.stdout);
  }).catch(function (err) {
    console.error(err.stdout);
  });
}

function setDHCP(index, iface) {
  var cmds = [
    `${netsh} set address "${iface}" dhcp`,
    `${netsh} set dnsservers "${iface}" dhcp`,
    `${netsh} set winsservers "${iface}" dhcp`
  ]
  runExecs(cmds).then(function () {
    settings.set(index, { iface, dhcp: true });
  }).catch(function () {
  });
}

function setIP(index, iface, ip, netmask, gateway, dns1, dns2) {
  var cmds = [
    `${netsh} set address "${iface}" static ${ip} ${netmask} ${gateway} 1`,
    `${netsh} set dnsservers "${iface}" static ${dns1}`,
    `${netsh} add dnsservers "${iface}" ${dns2}`
  ]
  runExecs(cmds).then(function () {
    settings.set(index, { iface, dhcp: false, ip, netmask, gateway, dns1, dns2 })
  }).catch(function () {
  });
}

$(function () {
  console.log(getInterfaces());
});

// setDHCP(0, "乙太網路");
// setIP(0, "乙太網路", "192.168.1.2", "255.255.255.0", "192.168.1.254", "8.8.8.8", "1.1.1.1");