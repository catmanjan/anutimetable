var rawLessons      = [];
var timetableData   = {};
var hasLocalStorage = typeof(Storage) !== 'undefined';
var recover         = false;
var jsonUpdatedTime = '19th of June, 2018';
var revisionNum     = 122;

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (value) {
        for (var i in this) {
            if (!this.hasOwnProperty(i)) continue;
            if (this[i] === value) return i;
        }
        return -1;
    };
}

// https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
Date.prototype.getWeekNumber = function() {
    var onejan = new Date(this.getFullYear(),0,1);
    var millisecsInDay = 86400000;
    return Math.ceil((((this - onejan) /millisecsInDay) + onejan.getDay()+1)/7);
};

var Calendar = {
    initialize: function () {
        this.tradingHours             = {
            start_hour: 8,
            normal_start_hour: 9,
            normal_end_hour: 18,
            end_hour: 20
        };
        this.weekdays                 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        this.weekdaysFull             = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        this.template                 = _.template($("#calendar-template").text());
        this.compulsoryLessonTemplate = $("#compulsory-event-template").text();
        this.groupLessonTemplate      = $("#group-event-template").text();
        this.html                     = this.template(this.tradingHours);
        this.startingDate             = 0;
        this.endingDate               = 0;
        this.currentWeek              = 0;
        this.generateCourseGrid();
    },
    generateCourseGrid: function () {
        this.courseGrids = [];
        for (var i = 0; i < (this.tradingHours.end_hour - this.tradingHours.start_hour) * 2; i++) {
            var temp = [];
            for (var j = 0; j < this.weekdays.length; j++)
                temp.push([]);
            this.courseGrids.push(temp);
        }
    },
    putItem: function (item, displayDiv) {

        // Determine the index for search in courseGrids
        var index    = (item.start - Calendar.tradingHours.start_hour) * 2;
        var dayIndex = Calendar.weekdays.indexOf(item.day);
        var rowspan  = item.dur * 2;
        var dayCell  = Calendar.dayHeaderElement(item.day);
        var colspan  = !dayCell.attr('colspan') ? 0 : parseInt(dayCell.attr('colspan'));

        // Separate empty cells
        if (!recover) Calendar.columnSeparate();

        var temp             = Calendar.fillArray(Calendar.courseGrids, item.name + ' ' + item.info, (item.start - Calendar.tradingHours.start_hour) * 2, dayIndex, rowspan, 0);
        var currentIndex     = temp[0];
        Calendar.courseGrids = temp[1];

        // Changing the colspan of the title (mon, tue, ...)
        dayCell.attr('colspan', Calendar.courseGrids[0][dayIndex].length + 1);

        // Creating empty cells if not exist, or separating the existing one
        if (!Calendar.timeslotElement(null, item.day, currentIndex).length) {
            $('.timetable-row').each(function () {
                var beforeElement = $(this).find('[data-day="' + item.day + '"]:last');
                beforeElement.after(beforeElement.clone().removeClass().addClass('timeslot').removeAttr('rowspan colspan').attr('data-index', currentIndex).empty());
            });
        }

        var targetElement = Calendar.timeslotElement(item.start, item.day, currentIndex);

        // Fill with the content
        if (rowspan > 1) {
            targetElement.attr('rowspan', rowspan).append(displayDiv);

            if (displayDiv.data('group') && !Course.tutorials[displayDiv.data('group')]) {
                targetElement.on('mouseover', function () {
                    $(this).css('cursor', 'pointer');
                    $('.lesson[data-group!="' + displayDiv.data('group') + '"]').parent().css({'background-color': '#fcfcfc'});
                }).on('mouseout', function () {
                    $(this).css('cursor', '');
                    $('.lesson[data-group!="' + displayDiv.data('group') + '"]').parent().css({'background-color': ''});
                });
            }
        }

        // Hide cells for rowspan
        for (var i = 0.5; i < item.dur; i += 0.5)
            Calendar.timeslotElement(item.start + i, item.day, currentIndex).addClass('hide rowspanHide');

        // If it's not recovering courses from storage, then merge horizontal cells
        if (!recover) Calendar.columnMerge().togglePlaceholders();

        if (item.start < 9 || item.start >= 18) {
            _($(".timetable-row")).each(function (row) {
                if ($(row).data('hour') < 9 || $(row).data('hour') >= 18) {
                    $(row).show();
                }
            })
        }

    },
    putCompulsoryItem: function (item) {
        var displayDiv = $(_.template(Calendar.compulsoryLessonTemplate, {item: item}));
        Calendar.putItem(item, displayDiv);
    },
    putGroupItem: function (item) {

        var displayDiv = $(_.template(Calendar.groupLessonTemplate, {item: item}));
		
        $(displayDiv.find('a.hide_temp')[0]).on('click', function (event) {
            event.preventDefault();
            _($(".lesson")).each(function (item) {
                var $item = $(item);
                if ($item.data("group") == displayDiv.data("group")) {
                    if ($item.data('id') == displayDiv.data('id')) {
						$item.mouseleave();
						$item.parent().off();
						
                        Calendar.removeLessonGrid($item);
                    }
                }
            });
        });

        $(displayDiv.find('a.choose')[0]).on('click', function (event) {
            event.preventDefault();

            //Cycles through every item on the timetable and compares it to the one which has been 'chosen'
            //and appropriately removes identical items. Hides the 'choose' button on the 'chosen' one.
            Course.tutorials[displayDiv.data('group')] = displayDiv.data('id');
            _($(".lesson")).each(function (item) {
                var $item = $(item);
                if ($item.data("group") == displayDiv.data("group")) {
                    if ($item.data('id') != displayDiv.data('id')) {
                        $item.parent().off('mouseover mouseout');
                        Calendar.removeLessonGrid($item);
                    } else {
                        $item.find('a.choose').hide();
                        $item.parent().off('mouseover');
                    }
                }
            });
            Course.save();
        });

        Calendar.putItem(item, displayDiv);

        if (item.solo) { //If the class has no alternatives, automatically 'choose' it
            $(displayDiv.find('a.choose')[0]).click();
        }
    },
    putLessonGroup: function (group) {
        if (group[0] === 'group') {
            for (var i = group[1].length - 1; i >= 0; i--) {
                var key = group[1][i].name + filterNumbers(group[1][i].info);
                // Build tutorial object if is not in recovering mode
                if (!Course.tutorials[key]) Course.tutorials[key] = 0;
				 if (!Course.tutorials[key] || group[1][i].solo == true || Course.tutorials[key] == group[1][i].id)
					Calendar.putGroupItem(group[1][i]);

            }
        } else {
            Calendar.putCompulsoryItem(group[1]);
			
        }
    },
    columnMerge: function () {

        var ignoreList = [];

        $('.timeslot[data-index!="-1"]:not(.hide):not(.rowspanHide)').each(function () {

            var afterElement = $(this),
                hour         = parseFloat(afterElement.data('hour')),
                day          = afterElement.data('day'),
                index        = parseInt(afterElement.data('index')),
                emptyCount   = 0,
                lastIndex    = index,
                hideList     = [[]],
                rowspan      = parseInt($(this).attr('rowspan'));

            for (var k in ignoreList) {
                var s = ignoreList[k];
                if (s[0] === hour && s[1] === day && s[2] === index) return;
            }

            // Add consecutive empty cells after the timeslot to the
            // hiding pending list and accumulates empty counts for rowspan
            while ((afterElement = afterElement.find('+ [data-day="' + day + '"]:empty:not(.hide):not(.rowspanHide)')).length) {
                if (lastIndex + 1 !== (lastIndex = parseInt(afterElement.data('index')))) break;
                hideList[0].push(afterElement);
                emptyCount++;
            }

            if (!emptyCount) return;

            // If rowspan exists, proceeding to the bound rows and add cells
            // which suits consecutive empty cells condition to the hiding
            // list, abort and delete the previous added elements if found
            // any non empty or .rowspanHide cells.
            if (rowspan > 1) {
                var abort = false;
                for (var j = 1; j <= emptyCount; j++) {
                    for (var i = 0.5; i < rowspan / 2; i += 0.5) {
                        var nextElement = Calendar.timeslotElement(hour + i, day, index + j).filter(':empty:not(.hide):not(.rowspanHide)');
                        if (!nextElement.length) {
                            abort      = j;
                            emptyCount = j - 1;
                            break;
                        }
                        if (!hideList[j]) hideList[j] = [];
                        hideList[j].push(nextElement);
                    }
                    if (abort !== false) {
                        $.each(hideList, function (j) {
                            hideList[j].splice(abort - 1, 100);
                        });
                        break;
                    }
                }
            }

            $.each(hideList, function (i, v) {
                $.each(v, function (j, l) {
                    ignoreList.push([parseFloat(l.data('hour')), l.data('day'), parseInt(l.data('index'))]);
                    l.addClass('hide');
                });
            });

            if (emptyCount > 0) $(this).attr('colspan', emptyCount + 1);
        });

        return Calendar;
    },
    columnSeparate: function () {

        var timeslots = $('.timeslot');

        // Remove all colspan and display all related hidden cells
        timeslots.filter('[colspan]').removeAttr('colspan');
        timeslots.filter('.hide[data-index!="-1"]:not(.rowspanHide)').removeClass('hide');

        // Remove rowspan for empty cells and all related hidden cells
        timeslots.filter('[rowspan]:empty').each(function () {
            var hour    = parseFloat($(this).data('hour')),
                day     = $(this).data('day'),
                index   = $(this).data('index'),
                rowspan = parseInt($(this).attr('rowspan'));
            for (var i = 0.5; i < rowspan / 2; i += 0.5)
                Calendar.timeslotElement(hour + i, day, index).removeClass('hide rowspanHide');
            $(this).removeAttr('rowspan');
        });

        return Calendar;
    },
    removeFromGrid: function (courseName) {

        // Delete the course from grid array
        $.each(Calendar.courseGrids, function (i, v) {
            $.each(v, function (j, h) {
                $.each(h, function (k, n) {
                    if (n.toString().indexOf(courseName) !== -1) Calendar.courseGrids[i][j][k] = 0;
                });
            });
        });

        // UI update
        Calendar.removeLessonGrid($('.lesson[data-name="' + courseName + '"]'));

    },
    togglePlaceholders: function () {

        $.each(Calendar.weekdays, function (i, v) {
            var timeslots    = $('.timeslot[data-day="' + v + '"]:not(.hide)');
            var placeHolders = timeslots.filter('[data-index="-1"]');

            if (placeHolders.length === timeslots.length) {
                placeHolders.removeClass('hide');
                return;
            }

            var notPlaceHolder = timeslots.filter('[data-hour="8"][data-index!="-1"]');
            var colspan        = 0;
            notPlaceHolder.each(function () {
                colspan += parseInt($(this).attr('colspan')) || 1;
            });

            placeHolders.addClass('hide');
            Calendar.dayHeaderElement(i).attr('colspan', colspan);
        });

        return Calendar;
    },
    fillArray: function (array, fillWith, hour, day, blockNum, currentIndex) {

        // Find the left most possible space and fill in the value
        // For example, if we need to fill up 2 blocks with value v
        // from vertical index 2 then the transition will be like:
        // var a = [[[], [0     , 0, 0], [], [], []],
        //          [[], [1     , 0, 0], [], [], []],
        //          [[], [0 -> v, 2, 0], [], [], []],
        //          [[], [0 -> v, 2, 3], [], [], []]];
        if ('undefined' === typeof array[hour][day][currentIndex] || !array[hour][day].length) {
            $.each(array, function (i) {
                array[i][day].push(i < hour || i >= hour + blockNum ? 0 : fillWith);
            });
        } else {
            var counter = 1;

            // Finding the available vertical blocks set
            $.each(array, function (i, row) {
                if (i <= hour) return;
                if (i >= hour + blockNum) return false;
                counter = !row[day][currentIndex] ? counter + 1 : 0;
            });
            if (counter < blockNum) return Calendar.fillArray(array, fillWith, hour, day, blockNum, currentIndex + 1);

            for (var j = 0; j < blockNum; j++)
                array[hour + j][day][currentIndex] = fillWith;
        }
        return [currentIndex, array];
    },
    timeslotElement: function (hour, day, index) {
        var selector = '.timeslot[data-index!="-1"]';
        if (null !== hour) selector += '[data-hour="' + hour + '"]';
        if (null !== day) selector += '[data-day="' + day + '"]';
        if (null !== index) selector += '[data-index="' + index + '"]';
        return $(selector);
    },
    dayHeaderElement: function (day) {
        return $('.table.table-striped th.col-sm-2:nth(' + (parseInt(day).toString() === day.toString() ? day : Calendar.weekdays.indexOf(day)) + ')');
    },
    removeLessonGrid: function (element) {
        var parents = element.parent();
        for (var i in parents) {
            if (!parents.hasOwnProperty(i)) continue;
            parents[i].className = 'timeslot';
        }
        parents.empty();
        Calendar.columnSeparate().columnMerge().togglePlaceholders();
    },
    hideChooseLinks: function () {
        for (var i in Course.tutorials) {
            if (Course.tutorials.hasOwnProperty(i) && Course.tutorials[i] > 0) $('[data-id="' + Course.tutorials[i] + '"] a.choose').hide();
        }
    },
    getOffsetWeek: function (startWeek, currentWeek) {
        return currentWeek - startWeek + 1;
    },
    updateView: function () {
		var date = Math.max(Calendar.getOffsetWeek(new Date(this.startingDate).getWeekNumber(), this.currentWeek),1)
		if(date == 7 || date == 8) 
			date = "Break";
		else 
			date = "Week " + date;
        $('#week-num').html(date);
    },
    shiftWeek: function (offset) {
        this.currentWeek = Math.min(Math.max((new Date(this.startingDate)).getWeekNumber(), this.currentWeek + offset), 43); //43 is the calendar week of the end of the teaching semester
        Calendar.generateCourseGrid();
        Course.clear(null, true).recover();
        Calendar.updateView();
    }
};

// Copied from w3c
var Cookie = {
    set: function (cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires     = 'expires=' + d.toUTCString();
        document.cookie = cname + '=' + cvalue + '; ' + expires;
    },
    get: function (cname) {
        var name = cname + '=';
        var ca   = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return '';
    }
};

var Course = {
    courses: [],
    tutorials: {},
    get: function () {
        var courseNameElement = $("#course-name");
        var courseName        = courseNameElement.val().split('-')[0].toUpperCase().trim();
        if (courseName && Course.courses.indexOf(courseName) === -1) {
            $("#add-course").html("Adding...");
            courseNameElement.val("");
            Course.add(courseName);
        }
        return Course;
    },
    add: function (courseName, isRecovering) {
        var data_tmp = timetableData[courseName];
        recover  = 'undefined' !== typeof isRecovering;

        if (Course.courses.length >= 6 || !data_tmp) {
            $("#add-course").html(!data_tmp ? 'Course not found!' : 'Too many courses!');
            setTimeout(function () {
                $("#add-course").html('Add');
            }, 2000);
        } else {
            $("#add-course").html('Add');

            // remove classes which are irrelevant to the given week number
            var data = [];
            _(data_tmp).each(function (l) {
				// First try with the first group item and then iterate to check others
				var matched = false;
				var data_item = l.slice();
				for(k = 0; k < l[1].length; k++){
					var weeks   = l[1][k].weeks.split(',');			
					for (var i in weeks) {
						var range = weeks[i].split('‑'); // this is not a regular -
						if (range[1] && Calendar.currentWeek >= range[0] && Calendar.currentWeek <= range[1] ||
							!range[1] && Calendar.currentWeek === parseInt(range[0])){
							matched = true;
							data_item[1] = [l[1][k]];
						}
					}
				if(matched) break;
				}


                if (matched) {
                    data.push(data_item);
                }
            });
            console.log(data);

            //Count the number of alternatives to each class. If there are none, mark it with .solo=true so it can be pre-chosen
            var classAlternatives = []; //info as key, num alternatives as return
            var classTypes        = []; //info as key, id as return
            var classEnum         = []; //id as key, info as return

            _(data).each(
                function (group) {
                    if (group[0] === 'group') {
                        var info = filterNumbers(group[1][0].info);

                        if (classTypes[info] == undefined) {
                            classTypes[info]            = classEnum.length;
                            classEnum[classEnum.length] = info;
                        }
                        if (classAlternatives[info] == undefined) classAlternatives[info] = 0;
                        classAlternatives[info]++;
                    }
                }
            );

            _(data).each(
                function (group) {
                    if (group[0] === 'group') {
                        var info = filterNumbers(group[1][0].info);
                        group[1][0].solo = classAlternatives[info] == 1;
                    }
                }
            );

            _(data).each(Calendar.putLessonGroup);
            Course.courses.push(courseName);

            // Add course style class.
            for (var i = 1; i <= 6; i++) {
                if (i === 6 || $('.lesson-style-' + i).length < 1) {
                    $('.lesson[data-name=' + courseName + ']').parent().addClass('lesson-style-' + i);
                    break;
                }
            }

            Course.display().save();
        }

        return Course;
    },
    remove: function (courseName, prompt) {
        if ('undefined' !== typeof prompt && !confirm('Are you sure you want to delete this course?')) return;

        Course.courses = _(Course.courses).without(courseName);

        // Delete all related tutorials
        $.each(Course.tutorials, function (index) {
            if (index.indexOf(courseName) !== -1) delete Course.tutorials[index];
        });

        Calendar.removeFromGrid(courseName);
        Course.display().save();

        return Course;
    },
    display: function () {
        var displayElement = $('#chosenCourses');
        if (Course.courses.length <= 0) {
            displayElement.html('None.');
            return Course;
        }

        var html = '';
        $.each(Course.courses, function (index, courseName) {
            html += (index === 0 ? '' : ', ') + courseName + ' ';
            html += '<a href="javascript:void(0)" onclick="Course.rechooseTutorial(\'' + courseName + '\')" title="Re-choose"><span class="glyphicon glyphicon-refresh"></span></a> ';
            html += '<a href="javascript:void(0)" onclick="Course.remove(\'' + courseName + '\', true)" title="Delete"><span class="glyphicon glyphicon-trash"></span></a>';
        });
        displayElement.empty().append(html);

        return Course;
    },
    recover: function () {
        var savedCourses = Tools.getSavedData('courses');
        var temp         = Tools.getSavedData('tutorials');
        Course.tutorials = temp ? JSON.parse(temp) : {};
        if (savedCourses) {
            Calendar.columnSeparate();
            $.each(JSON.parse(savedCourses), function (i, courseName) {
                Course.add(courseName, true);
            });
            Calendar.columnMerge().togglePlaceholders().hideChooseLinks();
        }
        Course.display();
        return Course;
    },
    save: function (isOnlyTutorial) {
        if ('undefined' === typeof isOnlyTutorial)
            Tools.updateSavedData('courses', JSON.stringify(Course.courses));
        Tools.updateSavedData('tutorials', JSON.stringify(Course.tutorials));
        return Course;
    },
    clear: function (e, redraw) {
        ('undefined' !== typeof e && null !== e) && e.preventDefault();
        Course.courses   = [];
        Course.tutorials = {};
        Course.display();
        if (!redraw) Course.save();
        $("#cal-container").html(Calendar.html);
        return Course;
    },
    processRaw: function (rawData) {
	try {
        $.each(rawData[3], function (i, course) {
            rawData[3][i].fullName = rawData[0][course.nid];
            rawData[3][i].info     = rawData[1][course.iid].replace(/(\s|([^\d]))(0+)/g, '$2').replace('/', ' / ');
            rawData[3][i].location = rawData[2][course.lid];
            rawData[3][i].name     = rawData[3][i].fullName.match(/^([a-zA-Z0-9]+)_.+?\s(.+)/)[1];
            rawData[3][i].day      = parseInt(course.day) !== course.day ? course.day : Calendar.weekdays[course.day]; // update transition detection
            delete rawData[3][i].nid;
            delete rawData[3][i].iid;
            delete rawData[3][i].lid;
        });
        rawLessons = rawData[3];

        Calendar.startingDate = rawData[4][0] * 1000;
        Calendar.endingDate   = rawData[4][1] * 1000;
        Calendar.currentWeek  = (new Date()).getWeekNumber();
	}catch(e){}
    },
    rechooseTutorial: function (courseName) {
        Course.save().remove(courseName).add(courseName);
    }
};

var loadJSON = {
    status: function (succeed, isLoading) {
        var element = $('#load');
        succeed ? element.removeClass('text-warning').html('Loaded!') : element.addClass('text-warning').html(isLoading ? 'Loading..' : 'Not a valid JSON file!');
        setTimeout(function () {
            element.html('Load data from .json');
        }, 2000);
        return succeed;
    },
    eventHandler: function (e) {
        var reader         = new FileReader();
        reader.onloadstart = function () {
            loadJSON.status(0, 1);
        };
        reader.onload      = function (e) {
            try {
                Course.processRaw($.parseJSON(e.target.result));
            } catch (err) {
                rawLessons = [];
            } finally {
                if (loadJSON.status(!!rawLessons.length)) {
                    $('#clear-courses').click();
                    timetableData = rearrangeLessons(rawLessons);
                    Course.recover();
                }
            }
        };
        reader.readAsText(e.target.files[0]);
    }
};

var Tools = {
    pad: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    hourify: function (num) {
        var parts = num.toString().split('.');
        return Tools.pad(parts[0], 2) + (parts[1] === '5' ? '30' : '00');
    },
    getSavedData: function (name) {
        return hasLocalStorage ? localStorage.getItem(name) : Cookie.get(name);
    },
    updateSavedData: function (name, value) {
        return hasLocalStorage ? localStorage.setItem(name, value) : Cookie.set(name, value);
    },
    displayUpdatedTime: function (itemNumber) {
        $('#jsonUpdatedTime').html(jsonUpdatedTime + '.' + ('undefined' !== typeof itemNumber ? ' (' + itemNumber + ' courses)' : ''));
    },
    size: function (object) {
        return object.length || Object.keys(object).length;
    },
    deepCopy: function (object) {
        return JSON.parse(JSON.stringify(object));
    }
};

if (typeof global === 'undefined' || typeof global.it !== 'function') {
    $(function () {

        if (Tools.getSavedData('revisionNum') != revisionNum) {
            Tools.updateSavedData('revisionNum', revisionNum);
            Course.tutorials = {};
            Course.courses   = [];
            Course.save(true);
        }
        if (window.applicationCache) {
            window.applicationCache.addEventListener('updateready', function() {
                if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                    if (confirm('A new version of this site is available. Load it?')) {
                        window.location.reload(true);
                    }
                }
            }, false);
        }

        Calendar.initialize();
        Tools.displayUpdatedTime();

        $.get('./data/timetable.json?VERSION=' + revisionNum, {}, function (data) {
            Course.processRaw(data);
            timetableData = rearrangeLessons(rawLessons);
            Course.recover();
            Tools.displayUpdatedTime(rawLessons.length);
            Calendar.updateView();
            Calendar.shiftWeek(0); // This is a stupid hack to get the correct week to display before the current week gets changed. Please remove this if you find a work around!
        }).fail(function () {
            $('#load').removeClass('hide');
            $('#chosenCourses').html('Unable to load data from source, please try to refresh or manually load pre-fetched JSON from ./data folder.');
        });

        // Generate UI table
        $('#cal-container').append(Calendar.html);

        // Bind key Enter with Add button
        document.onkeydown = function (e) {
            if ((e.which || e.keyCode) == 13) {
                e.preventDefault();
                Course.get();
            }
        };

        $('#screenshot').on('click', function(){
            html2canvas(document.querySelector("#cal-container"), {scale:2}).then(function(canvas) {
                var dataURL = canvas.toDataURL("image/png" );
                var data = atob( dataURL.substring( "data:image/png;base64,".length ) ),
                    asArray = new Uint8Array(data.length);
                for( var i = 0, len = data.length; i < len; ++i ) {
                    asArray[i] = data.charCodeAt(i);
                }
                var blob = new Blob( [ asArray.buffer ], {type: "image/png"} );
                download(blob, "timetable.png");
            });
        });


        // Generate downloadable ICS calendar
        $('#download').on('click', function (event) {
            var calString     = $('#cal-header').text();
            var eventTemplate = _.template($("#event-template").html());
            var unselected_tutorials = false;
            if (Course.courses.length === 0){
                $('#download').html("No courses selected");
                setTimeout(function() { $('#download').html("Export .ics")}, 2000);
                return;
            }
            _(rawLessons).each(function (lesson) {
                if (Course.courses.indexOf(lesson.name) !== -1 && $.inArray(lesson.id, Object.values(Course.tutorials)) !== -1) {
                    var day = Calendar.weekdays.indexOf(lesson.day);
                    calString += eventTemplate({
                        padded_hour: Tools.hourify(lesson.start),
                        padded_end_hour: Tools.hourify(lesson.start + lesson.dur),
                        first_day: 19 + day,
                        day: lesson.day,
                        description: lesson.info,
                        location: lesson.location,
                        course: lesson.name + ' ' + lesson.info,
                        holiday1: (2 + day < 10) ? '0' + (2 + day) : (2 + day),
                        holiday2:(9 + day < 10) ? '0' + (9 + day) : (9 + day)
                    });
                }
                if($.inArray(0, Object.values(Course.tutorials)) !== -1){
                    unselected_tutorials = true;
                }
            });
            if(unselected_tutorials){
                if(!confirm("You have unselected tutorials. These will not be exported. Click OK to continue."))
                {
                    return;
                }
            }

            calString += "\nEND:VCALENDAR";

            //try {
            download(calString, 'anu_s1_timetable.ics', 'text/plain');
            //} catch(e) {
            //    window.open('download.php?data=' + calString);
            //}
        });

        $('#add-course').on('click', Course.get);
        $('#clear-courses').on('click', Course.clear);
        $('#load').on('click', $('#file').change(loadJSON.eventHandler).click);

        $('#course-name').typeahead({
            highlight: true,
            hint: false
        }, {
            source: function (query, process) {
                var matchIndexes = [], matches = [];

                // Building the array matchIndexes which stores query's appearance position
                // in the course name, also fills the array matches for temporary ease of use.
                query = query.trim().toLowerCase();
                $.each(rawLessons, function (i, course) {
                    var matchIndex     = course.fullName.toLowerCase().indexOf(query),
                        simplifiedName = course.fullName.replace(/_[a-zA-Z][0-9]/, ' -');
                    if (course.fullName && matchIndex !== -1 && $.inArray(simplifiedName, matches) === -1) {
                        matchIndexes.push({
                            name: simplifiedName,
                            matchIndex: matchIndex
                        });
                        matches.push(simplifiedName);
                    }
                });

                // Sort them depends on the appeared position and name in ascending order
                matchIndexes.sort(function (a, b) {
                    return a.matchIndex - b.matchIndex + a.name.localeCompare(b.name);
                });

                // Build the final result.
                matches = [];
                $.each(matchIndexes, function (i, course) {
                    matches.push(course.name);
                });

                process(matches);
            }
        });

    });
} else {
    exports._ = {
        Calendar: Calendar,
        Cookie: Cookie,
        Course: Course,
        loadJSON: loadJSON,
        Tools: Tools
    };
}
