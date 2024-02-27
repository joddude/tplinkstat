<?php

require_once 'connector_config.php';

if (isset($_GET['hostnames'])) {
  $tplinkurl = $tplinkurl.'cgi?5';
  $post_data = "[LAN_HOST_ENTRY#0,0,0,0,0,0#0,0,0,0,0,0]0,4\r\nleaseTimeRemaining\r\nMACAddress\r\nhostName\r\nIPAddress\r\n";
}
elseif (isset($_GET['stat'])) {
  $tplinkurl = $tplinkurl.'cgi?1&5';
  $post_data = "[STAT_CFG#0,0,0,0,0,0#0,0,0,0,0,0]0,0\r\n[STAT_ENTRY#0,0,0,0,0,0#0,0,0,0,0,0]1,0\r\n";
}
elseif (isset($_GET['reset'])) {
  $tplinkurl = $tplinkurl.'cgi?2';
  $post_data = "[STAT_CFG#0,0,0,0,0,0#0,0,0,0,0,0]0,1\r\naction=1\r\n";
}
elseif (isset($_GET['delete'])) {
  $tplinkurl = $tplinkurl.'cgi?2';
  $post_data = "[STAT_CFG#0,0,0,0,0,0#0,0,0,0,0,0]0,1\r\naction=2\r\n";
}
elseif (isset($_GET['interval']) and ($_GET['interval'] > 0)) {
  $tplinkurl = $tplinkurl.'cgi?2';
  $post_data = "[STAT_CFG#0,0,0,0,0,0#0,0,0,0,0,0]0,1\r\ninterval=".$_GET['interval']."\r\n";
}
else exit;

$authorization_cookie = 'Authorization=Basic '.base64_encode(substr($username, 0, 15).':'.substr($password, 0, 15));

list($result, $http_response_header) = router_request($tplinkurl, $post_data, $authorization_cookie);
if ($result === FALSE) {
  sleep (0.5);
  list($result, $http_response_header) = router_request($tplinkurl, $post_data, $authorization_cookie);
}
if ($result === FALSE) {
  echo('[error] Router connection error: '.$http_response_header[0].PHP_EOL);
  exit;
} else {
  header("Content-Type: text/plain; charset=utf-8");
  header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1.
  header("Pragma: no-cache"); // HTTP 1.0.
  header("Expires: 0"); // Proxies.
  echo($result);
  exit;
}

function router_request($tplinkurl, $post_data, $authorization_cookie) {
  $timeout = 2;
  $options = array(
      'http' => array(
          'header'  => "Content-type: text/plain\r\n".
                       "Referer: $tplinkurl\r\n".
                       "Cookie: $authorization_cookie\r\n",
          'method'  => 'POST',
          'content' => $post_data,
          'timeout' => $timeout,
      )
  );
  $context  = stream_context_create($options);
  $result = @file_get_contents($tplinkurl, false, $context);
  return array($result, $http_response_header);
}

