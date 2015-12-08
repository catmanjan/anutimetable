# anutimetable

## Updates

### 2015-12-08
* Added delete, clear, save and flush feature (use localStorage / cookie depends on the availability).
* Fixed an issue with tutorial selection (explained in master upstream branch issue #22).
* Fixed the issue with not being able to choose between one hour tutorials.
* Fixed the issue with ics export will include all the tutorials regardless of choosing or not.
* Categorized files into folders (js, css and data, all json files will be saved in data).
* Updated the newest timetable.json.
* Added auto-complete feature.
  * For matching, if the user is using his/her/theirs own data without fullName field, then it'll use name instead.
* Added a spider written in jQuery.
  * Usage: Go to the pre-course-selection page, execute the code in a console or inline javascript: link.
  * Will retrieve validation data automatically, no need to input by yourself.
  * Appends an extra field 'fullName' to the data, which denotes the human readable name of the course (for use of auto-complete).
  * When executing, it'll display a mini progress box in the middle of the page.
  * This will fix the issue #22 without using a new identifier.

### 2015-12-06
* The scraper is planned for deletion.
* Instead, use the converter on the direct data source http://udsttweb99.anu.edu.au/Timetable2015/Timetable.csv (hopefully this will be updated by ANU for 2016)

### 2015-12-05
* 2016 draft timetable available.
* Added load json feature, supports local/offline (i.e. protocol file://, not local server) use.
* Fixed the /timetable.json relative path issue (was directing to the root directory).
* Changed the ics import button location and color.

## Known issues

* The builder only display courses in whole hours calendar.