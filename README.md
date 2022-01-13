# ANU Unofficial Timetable
[![Website status](https://img.shields.io/website?down_color=red&down_message=offline&up_color=success&up_message=online&url=https%3A%2F%2Ftimetable.cssa.club&logo=microsoft-azure&logoColor=white)](https://timetable.cssa.club)
[![Build status](https://img.shields.io/github/workflow/status/anucssa/anutimetable/Build%20and%20deploy?logo=github&logoColor=white)](https://github.com/anucssa/anutimetable/actions/workflows/build_and_deploy.yml)
[![Scraper status](https://img.shields.io/github/workflow/status/anucssa/anutimetable/Scrape%20official%20timetable?logo=github&logoColor=white&label=scraper)](https://github.com/anucssa/anutimetable/actions/workflows/scrape.yml)

## About

This is an unofficial alternative timetable viewer for the Australian National University built by members of the [ANU Computer Science Students' Association](https://cssa.club/). It's available [here](https://timetable.cssa.club/). It serves as an up-to-date (automatically updated each day), fast, easy to use alternative to the [official timetable](http://timetabling.anu.edu.au/sws2022/). It replaces the *old* unofficial timetable [here](https://anutimetable.com/) which has not been updated for 2022.

## Development

**Components:**
* A React.js front-end in `/src` and `/public`. It's hosted as an Azure Static Web App by @pl4nty (free tier). Commits to master are deployed to timetable.cssa.club minutes later via a GitHub Action. Commits to open PR's are pushed to staging URL's for testing.
* A Python scraping script in `scraper` inherited from anutimetable.com that scrapes the official ANU timetable website. It is run once a day by a GitHub Action and the results are saved to `public/timetable*.json`.
* Several Azure functions in `/api` hosted by @pl4nty (free tier plan). These generate useful data on the fly like the ICS exports.

**Future directions:**
* Move away from Azure functions (to client side logic and GitHub Actions where possible)
* The [Class Allocation Project](https://services.anu.edu.au/planning-governance/current-projects/class-allocation-project) team intend to roll out a new timetabling experience in semester 2 2022 or 2023. Once this transition is complete this project will be archived or rewritten as the Python scraper will be obsolete.

**Contributing:**
* If you would like to contribute bug reports or to the development, please join the [CSSA Discord server](https://cssa.club/discord) and chat with us in the #timetable channel

## Changelog

### 2022-01-13
- Another rewrite in React thanks to [@pl4nty](https://github.com/pl4nty)
- Migrated into the [ANU Computer Science Students' Association](https://cssa.club/)'s [GitHub organisation](https://github.com/anucssa) for ongoing maintenance
- Deployed to https://timetable.cssa.club/

### 2021-10-24
- Calendar file generator (ICS/webcal) thanks to [@pl4nty](https://github.com/pl4nty), available at `/api/GetICS` eg `/api/GetICS?COMP2310_S2` or `/api/GetICS?COMP2310_S2=ComA 01,COMP2310_S2=ComB 01`

### 2021-07-17
- Integration with existing scraper and frontend fixes thanks to [@OliverBalfour](https://github.com/OliverBalfour)

### 2021-04-18
- Frontend rewritten in React with ANU's official API and GitHub Actions thanks to [@pl4nty](https://github.com/pl4nty)

### 2021-02-13
- Added automatic daily scrapes of the timetable thanks to [@BishopOfTurkey](https://github.com/BishopOfTurkey)

### 2021-02-13
- Added automatic daily scrapes of the timetable thanks to [@BishopOfTurkey](https://github.com/BishopOfTurkey)

### 2018-07-20

- Fixed iCal export thanks to [@Alwinius](https://github.com/Alwinius)

### 2018-07-17

- Updated semester 2 database thanks to [@calmelb](https://github.com/calmelb), [@caitelatte](https://github.com/caitelatte), and [@tetris12367](https://github.com/tetris12367)

### 2018-06-18

- This version now maintained by [@mdchia](https://github.com/mdchia/anutimetable)
- Patched up for semester 2 by [@jackadamson](https://github.com/jackadamson)

### 2018-03-11

* Restored display of class locations
* Added week switcher

### 2018-03-09

* Temporarily removed location of classes as requested by ANU

### 2018-02-22

* Fixed an issue where updating the revision num will cause a `Course.course` initialize error
* Removed auto-selector residual code for now
* Added Mocha test directory

### 2018-02-15

* Added option to take a .PNG screenshot of the timetable
* Added hide button to activities (requested by email from a few people)

### 2018-01-16

* Finalised auto-scraper and added the following scripts under /anutimtable/anuscrape:
  1. `commit.sh` - bash script that checks for new timetable data and updates the GitHub repo
  2. `schedule_scraping.bak` - crontab configuration that sets scraping frequency
  3. `update_date.py` - python program that updates version numbers if new data is found

### 2018-01-12

* Changed the regex used in the scrapers to work correctly with the 2018 timetable
* Added a verify.py script that takes the timetable.json file and checks for conflicting course activities in terms of iid values

### 2017-12-28

* Changed scrapers to use the 2018 timetable website
* Changed mode to _S1 courses only

### 2017-02-20

* Added offline support

### 2017-02-14

* Added `autofocus` property for the course input box

### 2017-02-13

* Fixed an issue with IE/Edge where `Array.prototype.indexOf` method does not exist

### 2017-01-24

* Fixed an issue with scraper generating wrong iid
* Fixed an issue with some cell's color won't go away after deleting the course (`parent().get(0)` only returns one element, therefore need to loop over `parent()`)

### 2017-01-22

* Enhanced `choose` button to be displayed only when there's alternatives
* Fixed some spelling errors

### 2017-01-21

* Added a PHP scraper (for non-ANU network use)
* Fixed the background color issue (temporarily)

### 2016-02-06

* Fixed table displaying issue.

### 2016-02-04

* Added auto-selecting feature.
  * No UI for now, use Magic.cast() in console to see effects.
  * The result will be ordered by clashes in ascending order.

### 2016-01-28

* Temporarily fixed the problem with choosable compulsory courses.
  * It will be deprecated soon.

### 2016-01-18

* Fixed the problem with confirm window popping out while clicking re-choose buttons.
* Added border spacing.

### 2016-01-16

* Compressed JSON structure.
  * `day` will now be index instead of string.
  * Removed `name` because it's redundant.
  * Added `id`.
* Added tutorial re-choose feature (appeared as icons).
* Added pinned classes icon effect.
* Added confirm window when deleting courses.
* Added `revisionNum`.
  * If a new value is found, then clear tutorials.
  * **This value is only changed when changing data structure!**
* Added mouseover effects when you hover a choosable tutorial.
  * The purpose of this is to ease the pain of finding same tutorials with different time.
* Changed `delete` button next to course name to icons.
* Changed the behaviour of tutorial displaying.
  * It will now automatically add newly updated classes to the cookie/localStorage instead of ignoring its existence.
  * After choosing a tutorial, the element will be deleted instead of set to hidden.
  * The `choose` button will now longer appear if there's a chosen tutorial.
  * Because of the order changing after re-choose tuts, lesson style will now determined by the existence of lesson-style-x, instead of hash.
* Changed the way of deciding how different groups belong to one tutorial.
  * The normal format of a class name is: `{COURSE_NAME}{GROUP_TYPE}{GROUP_NUMBER}/ {NUMBER}`, {NUMBER} will be used.
* Changed the structure of Course.structure (`{ class: chosen tutorial id, ... }`).
* Changed weekdays header to full.
* Removed leading zeros in `item.info` and ending `/`s (because the official data sometimes mistakenly gives different numbers such as `01` and `1`).
* Removed usage of `data-fgroup`, `data-id` will now be used.
* Fixed a bug where when creating an empty timeslot, it will clone the lesson style class as well.

### 2016-01-11

* Style changes to save vertical real estate.
* Made lesson style fit to whole block.
* Fixed the issue where the color remains when a class is removed.
* Removed animations.

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

* After deleting a course located at a index other than the last index, if the current index column is all empty, it won't delete this unused index column, which will cause a redundant gap column, but it'll be re-indexed after refreshing.
* When there is only one class for a certain group left, the choose button shouldn't be visible.
