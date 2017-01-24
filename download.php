<?php
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="anu_s1_timetable.ics";');
echo $_POST['data'];