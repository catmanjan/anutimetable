<?php

include 'simple_html_dom.php';

function postRequest ($url, $data = [], $cookies = []) {

    // Partch server disabled curl extension
    /*$ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);


    if ($cookies) {
        $cookie_str = [];
        foreach ($cookies as $k => $v) $cookie_str[] = $k . '=' . $v;
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Cookie: ' . implode('& ', $cookie_str)]);
    }

    $response = curl_exec($ch);

    preg_match('/^Set-Cookie:\s*([^;]*)/mi', $response, $matches);
    $cookies_new = [];
    if (isset($matches[1])) {
        foreach (explode('&', $matches[1]) as $cookie) {
            $cookie                  = explode('=', trim($cookie), 2);
            $cookies_new[$cookie[0]] = $cookie[1];
        }
    } else {
        $cookies_new = $cookies;
    }

    curl_close($ch);

    $content = substr($response, strpos($response, '<!DOCTYPE'));*/

    $data    = http_build_query($data);
    $context = [
        'http' => [
            'method'          => 'POST',
            'follow_location' => 1,
            'content'         => $data,
            'timeout'         => 100,
            'header'          => 'Content-Length: ' . strlen($data) . "\r\n" .
                'Content-type: application/x-www-form-urlencoded' . "\r\n"
        ]
    ];

    if ($cookies) {
        $cookie_str = [];
        foreach ($cookies as $k => $v) $cookie_str[] = $k . '=' . $v;
        $context['http']['header'] .= 'Cookie: ' . implode('& ', $cookie_str) . "\r\n";
    }

    $content = file_get_contents($url, FALSE, stream_context_create($context));

    $found   = FALSE;
    $matches = ['', ''];
    foreach ($http_response_header as $header) {
        preg_match('/^Set-Cookie:\s*([^;]*)/mi', $header, $matches);
        if ($matches) {
            $found = TRUE;
            break;
        }
    }
    $cookies_new = [];
    if ($found) {
        foreach (explode('&', $matches[1]) as $cookie) {
            $cookie                  = explode('=', trim($cookie), 2);
            $cookies_new[$cookie[0]] = $cookie[1];
        }
    } else {
        $cookies_new = $cookies;
    }

    return ['cookie' => $cookies_new, 'content' => str_get_html($content), 'content_raw' => $content];
}

function retrieveField ($content, $name) {
    preg_match('/<input type="hidden" name="' . $name . '" id="' . $name . '" value="(.+?)" \/>/', $content, $matches);
    return isset($matches[1]) ? $matches[1] : FALSE;
}

$url   = 'http://timetabling.anu.edu.au/sws2018/';
$stime = time();

// Enter the landing page and acquire the session id
echo 'Entering landing page...' . PHP_EOL;
$response = postRequest($url);

// If nothing, too bad
if (!isset($response['cookie']['ASP.NET_SessionId'])) {
    exit('Oops, something wrong.' . PHP_EOL);
}

// Retrieve Courses list
echo 'Retrieving course list...' . PHP_EOL;
$response = postRequest($url, $data = [
    '__EVENTTARGET'        => 'LinkBtn_modules',
    '__EVENTARGUMENT'      => '',
    '__VIEWSTATE'          => $response['content']->find('#__VIEWSTATE', 0)->value,
    '__VIEWSTATEGENERATOR' => $response['content']->find('#__VIEWSTATEGENERATOR', 0)->value,
    '__EVENTVALIDATION'    => $response['content']->find('#__EVENTVALIDATION', 0)->value,
    'tLinkType'            => 'information'
], $response['cookie']);

echo 'Processing...' . PHP_EOL;

// Get form validation data
$a = $response['content']->find('#__VIEWSTATE', 0)->value;
$b = $response['content']->find('#__VIEWSTATEGENERATOR', 0)->value;
$c = $response['content']->find('#__EVENTVALIDATION', 0)->value;

$courses   = [];
$locations = [];
$infos     = [];
$fullNames = [];
$nid       = 0;
$id        = 1;
$count     = [0, 0];
$weekdays  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
foreach ($response['content']->find('#dlObject option') as $courseElement) {

    // get only semester 2 courses
    if (substr($courseElement->value, -2) !== 'S1')
        continue;

    $response = postRequest($url, [
        '__EVENTTARGET'        => '',
        '__EVENTARGUMENT'      => '',
        '__LASTFOCUS'          => '',
        '__VIEWSTATE'          => $a,
        '__VIEWSTATEGENERATOR' => $b,
        '__EVENTVALIDATION'    => $c,
        'tLinkType'            => 'modules',
        'dlFilter'             => '',
        'tWildcard'            => '',
        'dlObject'             => $courseElement->value,
        'lbWeeks'              => '1-52',
        'lbDays'               => '1-7;1;2;3;4;5;6;7',
        'dlPeriod'             => '1-32;1;2;3;4;5;6;7;8;9;10;11;12;13;14;15;16;17;18;19;20;21;22;23;24;25;26;27;28;29;30;31;32;',
        'RadioType'            => 'module_list;cyon_reports_list_url;dummy',
        'bGetTimetable'        => 'View Timetable'
    ], $response['cookie']);

    $pre_id = $id;
    foreach ($response['content']->find('tbody > tr') as $courseRow) {

        $tds = $courseRow->find('td');

        if (!isset($tds[7]) || $tds[7]->class === 'type-string') continue;

        preg_match('/([a-zA-Z0-9]+)_.+?\s(.+)/', trim($tds[0]->plaintext), $className);
        if (!$className) {
            $className = ['', '', ''];
        }

        $location = trim($tds[7]->plaintext);
        $lid      = array_search($location, $locations);
        $iid      = array_search($className[2], $infos);

        if ($lid === FALSE) {
            $locations[] = $location;
            $lid         = count($locations) - 1;
        }
        if ($iid === FALSE) {
            $infos[] = $className[2];
            $iid     = count($infos) - 1;
        }

        $courses[] = [
            'id'    => $id,
            'nid'   => $nid,
            'iid'   => $iid,
            'lid'   => $lid,
            'start' => (float) str_replace(':30', '.5', trim($tds[3]->plaintext)),
            'dur'   => (float) str_replace(':30', '.5', trim($tds[5]->plaintext)),
            'day'   => array_search(strtolower(substr(trim($tds[2]->plaintext), 0, 3)), $weekdays)
        ];

        ++$id;
    }

    $fullName = str_replace('&nbsp;', ' ', trim($response['content']->find('[data-role="collapsible"] > h3', 0)->plaintext));
    if ($pre_id != $id) {
        $fullNames[] = $fullName;
        ++$nid;
        ++$count[0];
        echo 'Course ' . $courseElement->value . ' succeed!' . PHP_EOL;
    } else {
        ++$count[1];
        echo 'Course ' . $courseElement->value . ' has no data!' . PHP_EOL;
    }

}

$fp = fopen('timetable.json', 'w+');
fwrite($fp, preg_replace('/(}|]),/', '$1,' . PHP_EOL, json_encode([$fullNames, $infos, $locations, $courses])));
fclose($fp);

$min   = floor((time() - $stime) / 60);
$sec   = (time() - $stime) % 60;
$part  = 'scraped ' . array_sum($count) . ' courses in total, ' . $count[1] . ' of them have empty data';
$part2 = 'time elapsed: ' . $min . ' minute' . ($min < 2 ? '' : 's') . ' and ' . $sec . ' second' . ($sec < 2 ? '' : 's') . '.';

$fp = fopen('scrape.log', 'a');
fwrite($fp, date('Y-m-d H:i:s', $stime) . '~' . date('Y-m-d H:i:s') . ' - ' . $part . ', ' . $part2 . PHP_EOL);
fclose($fp);

echo 'Scraping complete, ' . $part . ', ' . $part2 . PHP_EOL;
