# anutimetable

## Updates

### 2015-12-08
* Added delete, clear, save and flush feature (use localStorage / cookie depends on the availability).
* Fixed an issue with tutorial selection (explained in master upstream branch issue #22).
* Fixed the issue with not being able to choose between one hour tutorials.

### 2015-12-06
* The scraper is planned for deletion.
* Instead, use the converter on the direct data source http://udsttweb99.anu.edu.au/Timetable2015/Timetable.csv (hopefully this will be updated by ANU for 2016)

### 2015-12-05
* 2016 draft timetable available.
* Added load json feature, supports local/offline (i.e. protocol file://, not local server) use.
* Fixed the /timetable.json relative path issue (was directing to the root directory).
* Changed the ics import button location and color.
