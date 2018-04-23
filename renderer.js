var exec = require('child-process-promise').exec;
var os = require('os');
var settings = require('electron-settings');
var netsh = "netsh interface ip";
var configs;
var currentTab = 0;

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

function setConfig(configs) {
  settings.set('configs', configs);
}

function setDHCP(index, name, iface) {
  var cmds = [
    `${netsh} set address "${iface}" dhcp`,
    `${netsh} set dnsservers "${iface}" dhcp`,
    `${netsh} set winsservers "${iface}" dhcp`
  ]
  runExecs(cmds).then(function () {
    configs[index] = { name, iface, dhcp: true, ip: '', netmask: '', gateway: '', dns1: '', dns2:'' };
    setConfig(configs);
  }).catch(function () {
  });
}

function setIP(index, name, iface, ip, netmask, gateway, dns1, dns2) {
  var cmds = [
    `${netsh} set address "${iface}" static ${ip} ${netmask} ${gateway} 1`,
    `${netsh} set dnsservers "${iface}" static ${dns1}`,
    `${netsh} add dnsservers "${iface}" ${dns2}`
  ]
  runExecs(cmds).then(function () {
    configs[index] = { name, iface, dhcp: false, ip, netmask, gateway, dns1, dns2 };
    setConfig(configs);
  }).catch(function () {
  });
}

function initConfigs() {
  configs = settings.get('configs');
  if (configs === undefined || configs.length === 0) {
    configs = [];
    for (let index = 0; index < 5; index++) {
      configs.push({name: `Config${index + 1}`, iface: '', dhcp: true, ip: '', netmask: '', gateway: '', dns1: '', dns2:''});
    }
    setConfig(configs);
  }
}

function initIP(ips, configIP, startIndex) {
  let ip = configIP.split('.');
  if (ip.length == 4) {
    for (let j = startIndex; j < startIndex + 4; j++) {
      ips[j] = ip[j];
    }
  }
}

function initMenu() {
  $('#menu').empty();
  for (let index = 0; index < configs.length; index++) {
    let config = configs[index];
    var item = $('<a class="' + (index === 0 ? 'active ' : '') + 'item">' + config.name + '</a>');
    item.on('click', function() {
      currentTab = index;

      $(this)
        .addClass('active')
        .siblings()
        .removeClass('active');

      $('#name').val(config.name);
      $('input[name="dhcp"]').prop('checked', config.dhcp);
      // TODO: iface

      let ips = [];
      for (let j = 0; j < 20; j++) {
        ips.push('');
      }

      initIP(ips, config.ip,       0);
      initIP(ips, config.netmask,  4);
      initIP(ips, config.gateway,  8);
      initIP(ips, config.dns1,    12);
      initIP(ips, config.dns2,    16);

      $('.ip').each(function (i) {
        $(this).val(ips[i]);
      });
    });
    $('#menu').append(item);
  }
  $('.item').get(currentTab).click();
}

function initInterfaces() {
  let ifaces = getInterfaces();
  for (let index = 0; index < ifaces.length; index++) {
    let iface = ifaces[index];
    let field = $('<div class="field"></div>');
    let radio = $('<div class="ui radio checkbox"></div>');
    radio.append('<input type="radio" name="interface-checkbox" ' + (index === 0 ? ' checked="checked"' : '') + '>');
    radio.append('<label>' + iface + '</label>');
    $('#interfaces').append(field.append(radio));
  }
}

$(function () {
  // Initial configs
  initConfigs();
  // Initial menu
  initMenu();
  // Initial interfaces
  initInterfaces();
  // Initial ip inputs
  $('.ip').autotab({ format: 'number', maxlength: 3 });

  $('#apply').on('click', function () {
    let iface = $('input[name="interface-checkbox"]').filter(':checked').next().text();
    let name = $('#name').val();
    let dhcp = $('input[name="dhcp"]').is(':checked');

    let ips = [];
    $('.ip').each(function () {
      ips.push($(this).val());
    });
    let ip      = `${ips[ 0]}.${ips[ 1]}.${ips[ 2]}.${ips[ 3]}`;
    let netmask = `${ips[ 4]}.${ips[ 5]}.${ips[ 6]}.${ips[ 7]}`;
    let gateway = `${ips[ 8]}.${ips[ 9]}.${ips[10]}.${ips[11]}`;
    let dns1    = `${ips[12]}.${ips[13]}.${ips[14]}.${ips[15]}`;
    let dns2    = `${ips[16]}.${ips[17]}.${ips[18]}.${ips[19]}`;

    console.log('iface', iface);
    console.log('name', name);
    console.log('dhcp', dhcp);
    console.log('ip', ip);
    console.log('netmask', netmask);
    console.log('gateway', gateway);
    console.log('dns1', dns1);
    console.log('dns2', dns2);

    if (dhcp) {
      setDHCP(currentTab, name, iface);
    } else {
      setIP(currentTab, name, iface, ip, netmask, gateway, dns1, dns2);
    }
  });
});

// setDHCP(0, "乙太網路");
// setIP(0, "乙太網路", "192.168.1.2", "255.255.255.0", "192.168.1.254", "8.8.8.8", "1.1.1.1");