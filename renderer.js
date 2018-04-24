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

function saveConfig(index, name, iface, dhcp, ip, netmask, gateway, dns1, dns2) {
  configs[index] = { name, iface, dhcp, ip, netmask, gateway, dns1, dns2 };
  setConfig(configs);
  initMenu();
}

function setDHCP(index, name, iface) {
  var cmds = [
    `${netsh} set address "${iface}" dhcp`,
    `${netsh} set dnsservers "${iface}" dhcp`,
    `${netsh} set winsservers "${iface}" dhcp`
  ]
  return runExecs(cmds).then(function () {
    saveConfig(index, name, iface, true, '', '', '', '', '');
  }).catch(function () {
    return Promise.resolve();
  });
}

function setIP(index, name, iface, ip, netmask, gateway, dns1, dns2) {
  var cmds = [
    `${netsh} set address "${iface}" static ${ip} ${netmask} ${gateway} 1`,
    `${netsh} set dnsservers "${iface}" static ${dns1}`,
    `${netsh} add dnsservers "${iface}" ${dns2}`
  ]
  return runExecs(cmds).then(function () {
    saveConfig(index, name, iface, false, ip, netmask, gateway, dns1, dns2);
  }).catch(function () {
    return Promise.resolve();
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

function initInterfaces(currentInterface) {
  $('#interfaces').empty();

  let ifaces = getInterfaces();
  let ifaceIndex = ifaces.indexOf(currentInterface);
  if (ifaceIndex === -1) {
    ifaceIndex = 0;
  }

  for (let index = 0; index < ifaces.length; index++) {
    let iface = ifaces[index];
    let field = $('<div class="field"></div>');
    let radio = $('<div class="ui radio checkbox"></div>');
    radio.append('<input type="radio" name="interface-checkbox" ' + (index === ifaceIndex ? ' checked="checked"' : '') + '>');
    radio.append('<label>' + iface + '</label>');
    $('#interfaces').append(field.append(radio));
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
        .addClass('active teal')
        .siblings()
        .removeClass('active teal');

      $('#name').val(config.name);
      $('input[name="dhcp"]').prop('checked', config.dhcp);
      initInterfaces(config.iface);

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
        if (config.dhcp) {
          $(this).parent().addClass('disabled');
        } else {
          $(this).parent().removeClass('disabled');
        }
      });
    });
    $('#menu').append(item);
  }
  $('.item').get(currentTab).click();
}

function toggleApply() {
  $('#apply').toggleClass('loading');
}

function getConfig() {
  let name = $('#name').val();
  let iface = $('input[name="interface-checkbox"]').filter(':checked').next().text();
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

  let config = { name, iface, dhcp, ip, netmask, gateway, dns1, dns2 };
  console.log(config);
  return config;
}

$(function () {
  // Initial configs
  initConfigs();
  // Initial menu
  initMenu();
  // Initial ip inputs
  $('.ip').autotab({ format: 'number', maxlength: 3 });
  // Initial dhcp
  $('input[name="dhcp"]').on('change', function () {
    let disabled = $(this).is(':checked');
    $('.ip').each(function () {
      $(this).parent().toggleClass('disabled');
    });
  });

  $('#save').on('click', function () {
    let config = getConfig();
    saveConfig(currentTab, config.name, config.iface, config.dhcp, config.ip, config.netmask, config.gateway, config.dns1, config.dns2);
  });

  $('#apply').on('click', function () {
    toggleApply();

    let config = getConfig();

    setTimeout(function () {
      if (config.dhcp) {
        setDHCP(currentTab, config.name, config.iface)
          .then(function() { toggleApply(); });
      } else {
        setIP(currentTab, config.name, config.iface, config.ip, config.netmask, config.gateway, config.dns1, config.dns2)
          .then(function() { toggleApply(); });
      }
    }, 500);
  });
});

// setDHCP(0, "乙太網路");
// setIP(0, "乙太網路", "192.168.1.2", "255.255.255.0", "192.168.1.254", "8.8.8.8", "1.1.1.1");