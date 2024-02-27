var hostnames = [];
var interval = 5;
var chart1 = false;
var chart2 = false;
var chart3 = false;

Chart.defaults.borderColor = '#80808060';
Chart.defaults.color = $('body').css('color');
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.animation.duration = 1000;


function init() {
  $('body').attr('data-bs-theme', color_theme);
  $('#color_theme').val(color_theme);
  $('#speed_units').val(speed_units);
  charts_init();
  Chart.defaults.color = $('body').css('color');
  Chart.defaults.font.size = parseInt($('body').css('font-size').slice(0, -2));
  Chart.defaults.font.family = $('body').css('font-family');
  $('#alert').hide();
  main();
}


async function main() {
  await update_hostnames();
  await update_stat();
  if (typeof update_hostnames_timer !== 'undefined') clearInterval(update_hostnames_timer);
  if (typeof update_stat_timer !== 'undefined') clearInterval(update_stat_timer);
  update_hostnames_timer = setInterval(update_hostnames, 60 * 1000);
  update_stat_timer = setInterval(update_stat, interval * 1000);
}


async function update_hostnames() {
  console.log('update hostnames');
  data = await connector_request('connector.php?hostnames');
  lan_hosts = parse_section(data);
  hostnames = config_hosts.concat(lan_hosts);
}


async function update_stat() {
  console.log('update stat');
  data = await connector_request('connector.php?stat');
  interval = parse_interval(data);
  hosts = parse_section(data);
  for (i in hosts) {
    hosts[i].id = i;
    hosts[i].ipAddress_f = int_to_ip(hosts[i].ipAddress);
    hosts[i].Name = get_hostname(hosts[i]);
    hosts[i].totalBytes_f = format_bytes(parseInt(hosts[i].totalBytes));
    hosts[i].currSpeed = parseInt(hosts[i].currBytes) / interval;
    hosts[i].currSpeed_f = format_speed(hosts[i].currSpeed);
    hosts[i].color = color_from_str(hosts[i].macAddress);
  }
  update_bar_chart(hosts, chart1, 'totalBytes');
  update_bar_chart(hosts, chart2, 'currSpeed');
  update_timeline_chart(hosts);
  update_table(hosts);
}


async function change_interval() {
  console.log('change interval');
  data = await connector_request('connector.php?interval=' + $('#interval').val());
  main();
}


async function reset_stat() {
  console.log('reset stat');
  data = await connector_request('connector.php?reset');
  chart1.data.labels = [];
  chart2.data.labels = [];
  chart3.data.labels = [];
  chart1.data.datasets = [];
  chart2.data.datasets = [];
  chart3.data.datasets = [];
  main();
}


async function delete_stat() {
  console.log('delete stat');
  data = await connector_request('connector.php?delete');
  chart1.data.labels = [];
  chart2.data.labels = [];
  chart3.data.labels = [];
  chart1.data.datasets = [];
  chart2.data.datasets = [];
  chart3.data.datasets = [];
  main();
}


async function connector_request(url) {
  data = await $.ajax({
    url: url,
    error: function (xhr, status) {
      show_error(status);
    }
  });
  error = parse_error(data);
  if (error === '0') {
    return data;
  } else {
    show_error(error);
  }
}


function parse_error(data) {
  regex_error = /\[error\](.+)/g;
  error = regex_error.exec(data)[1];
  return error;
}


function show_error(str) {
  var time_now = new Date().toLocaleTimeString();
  error_text = time_now + ' - Error - ' + str;
  $('#alert-text').text(error_text);
  $('#alert').show();
  console.log(error_text);
  throw new Error(error_text);
}


function parse_interval(data) {
  regex_interval = /interval=(\d+)/g;
  interval = parseInt(regex_interval.exec(data)[1]);
  $('#interval').val(interval);
  return interval;
}


function parse_section(data) {
  var a = [];
  regex_section = /\[[1-9]\d*,0,0,0,0,0\]\d+\n([^\[]+)/g;
  while (match_section = regex_section.exec(data)) {
    a.push(parse_key_value(match_section[1]));
  }
  return a;
}


function parse_key_value(section) {
  var a = {};
  regex_key_value = /(\w+)=(.+)/g;
  while (match_key_value = regex_key_value.exec(section)) {
    a[match_key_value[1]] = match_key_value[2];
  }
  return a;
}


function change_speed_units() {
  console.log('change speed units');
  speed_units = $('#speed_units').val();
  main();
}


function color_theme_switch() {
  console.log('color theme switch');
  color_theme = $('#color_theme').val();
  $('body').attr('data-bs-theme', color_theme);
  Chart.defaults.color = $('body').css('color');
  main();
}


function update_bar_chart(hosts, chart, field) {
  if (hosts.length < bar_chart_length) {
    chart_height = hosts.length * 2.5 + 4;
  } else {
    chart_height = bar_chart_length * 2.5 + 4;
  }
  $('.chart-bar').height(chart_height.toString() + 'rem');
  hosts_chart = hosts.slice();
  hosts_chart.sort(function(a, b) {return b[field] - a[field]});
  hosts_chart = hosts_chart.slice(0, bar_chart_length);
  if (typeof chart.data.datasets[0] == 'undefined') chart.data.datasets[0] = {};
  chart.data.labels =                      hosts_chart.map((a) => {return a.Name;});
  chart.data.datasets[0].id =              hosts_chart.map((a) => {return a.id;});
  chart.data.datasets[0].data =            hosts_chart.map((a) => {return a[field];});
  chart.data.datasets[0].borderColor =     hosts_chart.map((a) => {return a.color;});
  chart.data.datasets[0].backgroundColor = hosts_chart.map((a) => {return a.color;});
  chart.update();
}


function update_timeline_chart(hosts) {
  var date_now = Date.now();
  if(window.innerHeight > window.innerWidth){
    date_min = date_now - timeline_chart_length * 1000/2
  } else {
    date_min = date_now - timeline_chart_length * 1000
  }
  chart3.options.scales['x'].min = date_min;
  chart3.data.labels.push(date_now);
  for (i in hosts) {
    if (typeof chart3.data.datasets[i] == 'undefined') chart3.data.datasets[i] = {};
    if (typeof chart3.data.datasets[i].data == 'undefined') chart3.data.datasets[i].data = [];
    chart3.data.datasets[i].label =           hosts[i].Name;
    chart3.data.datasets[i].backgroundColor = hosts[i].color;
    chart3.data.datasets[i].fill =            true;
    chart3.data.datasets[i].pointRadius =     0;
    chart3.data.datasets[i].data.push(hosts[i].currSpeed);
  }
  chart3.update();
}


function update_table(hosts) {
  var data =[];
  for(i in hosts){
    colored_name = '<span class="color_box" style="background-color:' + hosts[i].color + ';">' + hosts[i].Name + '</span>';
    data.push({
      name: colored_name,
      ip: hosts[i].ipAddress,
      mac: hosts[i].macAddress,
      used: hosts[i].totalBytes,
      speed: hosts[i].currSpeed,
    })
  }
  $('#table1').bootstrapTable('load', data);
}


function get_hostname(host) {
  for(key in hostnames){
    if(hostnames[key].MACAddress == host.macAddress){
      return hostnames[key].hostName;
    }
  }
  return host.ipAddress_f;
}


function int_to_ip(num) {
  var d = num%256;
  for (var i = 3; i > 0; i--) {
    num = Math.floor(num/256);
    d = num%256 + '.' + d;
  }
  return d;
}


function format_bytes(bytes) {
  bytes = parseInt(bytes);
  var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 B';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)));
  var units = bytes / Math.pow(1000, i)
  if (units < 10) digits = 1
  else digits = 0;
  return units.toFixed(digits) + ' ' + sizes[i];
};


function format_speed(bytes) {
  bytes = parseInt(bytes);
  if (speed_units == 'bits') {
    var speed = bytes * 8;
    var sizes = ['bit/s', 'Kbit/s', 'Mbit/s', 'Gbit/s', 'Tbit/s'];
    if (bytes == 0) return '0 bit/s';
  } else {
    var speed = bytes;
    var sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
    if (bytes == 0) return '0 B/s';
  }
  var i = parseInt(Math.floor(Math.log(speed) / Math.log(1000)));
  speed = speed / Math.pow(1000, i);
  if (speed < 10) digits = 1
  else digits = 0;
  return speed.toFixed(digits) + ' ' + sizes[i];
};


function color_from_str(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  if (color_theme == 'dark') {
    saturation = 40 + ((hash << 3) % 40);
    lightness = 30 + ((hash << 7) % 10);
  } else {
    saturation = 40 + ((hash << 3) % 40);
    lightness = 60 + ((hash << 7) % 10);
  }
  return `hsl(${(hash % 360)}, ${saturation}%, ${lightness}%)`;
}


function charts_init() {
  ctx = document.getElementById("chart1").getContext('2d');
  chart1 = new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [],
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          min: 0,
          suggestedMax: used_chart_max,
          ticks: {
            beginAtZero:true,
            align: 'start',
            stepSize: used_chart_step,
            maxRotation: 0,
            minRotation: 0,
            callback: function(value, index, values) {
              return format_bytes(value);
            }
          },
          grid: {
            z: 1,
          },
          afterTickToLabelConversion: function(scaleInstance) {
            scaleInstance.ticks.pop();
          },
        },
        y: {
          position: 'left',
          ticks: {
            mirror: true,
            z: 2,
            callback: function(value, index, ticks) {
              return '  ' + this.chart.data.labels[value] + ' - ' + format_bytes(this.chart.data.datasets[0].data[value]);
            },
          },
          grid: {
            z: 1,
            drawTicks: false,
          },
        }
      },
      plugins: {
        legend: false,
        title: {
          text: 'Used',
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function(tooltipItems, data) {
              return '  ' + format_bytes(tooltipItems.raw);
            }
          }
        },
      },
    }
  });

  ctx = document.getElementById("chart2").getContext('2d');
  chart2 = new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [],
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          min: 0,
          suggestedMax: speed_chart_max,
          ticks: {
            beginAtZero:true,
            align: 'start',
            stepSize: speed_chart_step,
            maxRotation: 0,
            minRotation: 0,
            callback: function(value, index, values) {
              return format_speed(value);
            }
          },
          grid: {
            z: 1,
          },
          afterTickToLabelConversion: function(scaleInstance) {
            scaleInstance.ticks.pop();
          },
        },
        y: {
          position: 'left',
          ticks: {
            mirror: true,
            z: 2,
            callback: function(value, index, ticks) {
              return '  ' + this.chart.data.labels[value] + ' - ' + format_speed(this.chart.data.datasets[0].data[value]);
            },
          },
          grid: {
            z: 1,
            drawTicks: false,
          },
        }
      },
      plugins: {
        legend: false,
        title: {
          text: 'Speed',
          display: true,
        },
        tooltip: {
          callbacks: {
            label: function(tooltipItems, data) {
              return '  ' + format_speed(tooltipItems.raw);
            }
          }
        },
      },
    }
  });

  ctx = document.getElementById("chart3").getContext('2d');
  chart3 = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [],
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit :'minute',
              displayFormats: {
              minute: 'H:mm'
            },
            tooltipFormat: 'H:mm:ss'
          },
          scaleLabel: {
            display: true,
            labelString: 'Time'
          },
          ticks: {
            align: 'start',
            maxRotation: 0,
            minRotation: 0,
          },
          grid: {
            z: 1,
          },
        },
        y: {
          stacked: true,
          min: 0,
          suggestedMax: timeline_chart_max,
          ticks: {
            mirror: true,
            z: 2,
            align: 'end',
            beginAtZero:true,
            stepSize: timeline_chart_step,
            major: true,
            callback: function(value, index, values) {
              return '  ' + format_speed(value);
            }
          },
          grid: {
            z: 1,
            drawTicks: false,
          },
        }
      },
      events: ['mousemove', 'mouseout', 'click'],
      plugins: {
        legend: false,
        title: {
          text: 'Timeline',
          display: true,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(tooltipItems, data) {
              if (tooltipItems.raw) {
                return '  ' + tooltipItems.dataset.label + ' - ' + format_speed(tooltipItems.raw);
              } else {
                return false;
              }
            }
          },
        },
      },
    }
  });
}