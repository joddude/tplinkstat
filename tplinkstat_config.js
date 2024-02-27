var color_theme = 'dark';              // 'dark' or 'light'
var speed_units = 'bits';              // 'bits' or 'bytes' (1 byte = 8 bit)
var bar_chart_length = 10;             // maximum number of elements for bar charts

var used_chart_max = 4294967296;       // in bytes (default - 4294967296 - 4.29GB - 4GiB - maximum for router counter)
var used_chart_step = 500000000;       // in bytes (default - 500000000 - 500MB)

var speed_chart_max = 125000;          // in bytes/s (default - 125000 - 125KB/s - 1Mbit/s)
var speed_chart_step = 25000;          // in bytes/s (default - 25000 - 25KB/s - 200Kbit/s)

var timeline_chart_max = 250000;       // in bytes/s (default - 250000 - 250KB/s - 2Mbit/s)
var timeline_chart_step = 50000;       // in bytes/s (default - 50000 - 50KB/s - 400Kbit/s)
var timeline_chart_length = 600;       // in seconds (default - 600 - 10min) halved when portrait orientation


var config_hosts = [

  {'MACAddress':    '01:23:45:67:89:AB',
     'hostName':    'my pc',
  },

  {'MACAddress':    '12:34:56:78:9A:BC',
     'hostName':    'my phone',
  },

  {'MACAddress':    '23:45:67:89:AB:CD',
     'hostName':    'my tv',
  },

];

