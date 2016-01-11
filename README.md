# anutimetable

* Timetable database last update: 2016-01-11 10:07

## Updates

### 2016-01-11
* Style changes to save vertical real estate.

### 2016-01-06
* Fixed an issue with colspan.
* Cleared redundant code.

### 2015-12-21
* Fixed course deletion animation (slideDown() -> slideUp()).
* Fixed pressing enter will not add a course issue under some browsers (event.which is not supported).

### 2015-12-19
* Rewrote the code related to :30 courses support.
  * Instead of remove unused cells, it will now just hide them, this makes searching much easier.
  * It's now fully functional and the code is much cleaner than the previous version.
  * **There should be no broken table if used proper, but if it occurs, please submit an issue with a screeshot and the course addition/deletion order.**
* 'class' label is now treated as 'non-compulsory' category and is selectable between different ones.
* Added one more color to make sure six courses all get a different widget color.
* Replaced the text 'Updated for 2016.' with default timetable update time.
* Changed the table to show borders since it's hard to see which timeslot section the class belongs to without them
  * If we set the lesson block to inherit the cell height (cell height 1px and lesson block height 100%), it'll cause some issues when adding/deleting classes, even not, it shows too much space and looks weird).

### 2015-12-15
* Added maximum 6 courses adding limitation.
  * Code is messy, will need to rewrite it someday.
  * If the table displays in an abnormal way, submit an issue with a screeshot and the course addition/deletion order.
* Added :30 courses supports.
* Changed the structure for JSON (**Note that the old JSON will no longer work!**).
  * Removed key 'hour', added key 'start', altered key from 'duration' to 'dur'.
  * Combined all identical data classes.
  * Size reduced by 50%.

### 2015-12-09
* Deprecated save & flush button, these operations will now be processed automatically. <issue #26>
* Reconstructed functions & variables into OOP style.
  * Not sure why 'this' keyword sometimes not working so using the direct name (e.g. Course.display()) instead for now.
* Made the load JSON button only visible when the online source is not accessible. <issue #27>
* Made the auto-complete more smarter. <issue #29, #31>
  * It'll now order by matching relevance.
  * The name will be more readable.
  * Course addition will be now ignore everything after the dash, instead of underscore.
* Changed the structure for JSON (**Note that the old JSON will no longer work!**).
  * The structure will now be: [[fullName], [info], [location], [course]].
  * Removed key 'fullName', added key 'nid', 'iid' and 'lid' in course object.
  * This provides an index searching for fullName, location and info, which reduces the size of the data by about 50%.
  * The structure will change again in the upcoming days to merge same classes together and suit :30 classes. The file size will be significantly reduced.

### 2015-12-08
* Added delete, clear, save and flush feature (use localStorage / cookie depends on the availability).
* Fixed an issue with tutorial selection (explained in master upstream branch issue #22).
* Fixed the issue with not being able to choose between one hour tutorials.
* Fixed the issue with ics export will include all the tutorials regardless of choosing or not.
* Categorized files into folders (js, css and data, all json files will be saved in data).
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

### Known issues
* After choosing the tutorial for a lesson, the choose button will be hid, but if the page is refreshed, it will appear again.
* After deleting a course located at a index other than the last index, if the current index column is all empty, it won't delete this unused index column, which will cause a redundant gap column, but it'll be re-indexed after refreshing.
* After updating the timetable database, if there're new tutorials available, the user won't notice until they re-add the course.