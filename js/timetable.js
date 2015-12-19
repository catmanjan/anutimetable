var rawLessons      = [];
var timetableData   = {};
var hasLocalStorage = typeof(Storage) !== "undefined";
var recover         = false;
var jsonUpdatedTime = '2015-12-19';

var Calendar = {
    initialize        : function () {
        this.tradingHours             = {
            start_hour       : 8,
            normal_start_hour: 9,
            normal_end_hour  : 18,
            end_hour         : 20
        };
        this.weekdays                 = ['mon', 'tue', 'wed', 'thu', 'fri'];
        this.template                 = _.template($("#calendar-template").text());
        this.compulsaryLessonTemplate = $("#compulsary-event-template").text();
        this.groupLessonTemplate      = $("#group-event-template").text();
        this.html                     = this.template(this.tradingHours);
        this.courseGrids              = []; // new Array(12 * 2).fill(new Array(5).fill([]));
        for (var i = 0; i < (this.tradingHours.end_hour - this.tradingHours.start_hour) * 2; i++) {
            var temp = [];
            for (var j = 0; j < this.weekdays.length; j++)
                temp.push([]);
            this.courseGrids.push(temp);
        }
    },
    putItem           : function (item, displayDiv) {

        // Determine the index for search in courseGrids
        var index    = (item.start - Calendar.tradingHours.start_hour) * 2;
        var dayIndex = Calendar.weekdays.indexOf(item.day);
        var rowspan  = item.dur * 2;
        var dayCell  = Calendar.dayHeaderElement('dayHeaderElement');
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
                beforeElement.after(beforeElement.clone().removeClass('hide').removeClass('rowspanHide').removeAttr('rowspan').removeAttr('colspan').attr('data-index', currentIndex).empty());
            });
        }

        var targetElement = Calendar.timeslotElement(item.start, item.day, currentIndex);

        // Fill with the content
        if (rowspan > 1) {
            targetElement.attr('rowspan', rowspan).append(displayDiv.hide());
            displayDiv.slideDown();
        }

        // Hide cells for rowspan
        for (var i = 0.5; i < item.dur; i += 0.5)
            Calendar.timeslotElement(item.start + i, item.day, currentIndex).addClass('hide').addClass('rowspanHide');

        // If it's not recovering courses from storage, then merge horizontal cells
        if (!recover) Calendar.columnMerge().togglePlaceholders();

        if (item.start < 9 || item.start >= 18) {
            _($(".timetable-row")).each(function (row) {
                if ($(row).data('hour') < 9 || $(row).data('hour') >= 18) {
                    $(row).slideDown();
                }
            })
        }

    },
    putCompulsaryItem : function (item) {
        var displayDiv = $(_.template(Calendar.compulsaryLessonTemplate, {item: item}));
        Calendar.putItem(item, displayDiv);
    },
    putGroupItem      : function (item) {
        var displayDiv = $(_.template(Calendar.groupLessonTemplate, {item: item}));

        $(displayDiv.find("a.choose")[0]).on("click", function (event) {
            event.preventDefault();
            _($(".lesson")).each(function (item) {
                var $item = $(item);
                if ($item.data("group") == displayDiv.data("group")) {
                    if ($item.data("fgroup") != displayDiv.data("fgroup")) {
                        var index = $.inArray($item.data('fgroup'), Course.tutorials[$item.data('group')]);
                        if (index !== -1) Course.tutorials[$item.data('group')].splice(index, 1);
                        $item.slideUp(function () {
                            $item.parent().empty();
                            Calendar.columnSeparate().columnMerge().togglePlaceholders();
                        });
                    } else {
                        $("[data-fgroup='" + displayDiv.data("fgroup") + "'] a.choose").hide("scale");
                    }
                }
            });
            Course.save();
        });

        Calendar.putItem(item, displayDiv);

        // Hide all but one of the (choose) links
        $("[data-fgroup='" + displayDiv.data("fgroup") + "'] a.choose").slice(1).hide();
    },
    putLessonGroup    : function (group) {
        if (group[0] == "group") {
            for (var i = group[1].length - 1; i >= 0; i--) {
                var key      = group[1][i].name + filterNumbers(group[1][i].info),
                    tutFound = $.inArray(group[1][i].name + group[1][i].info, Course.tutorials[key]) !== -1;

                // Build tutorial object if is not in recovering mode
                if (!recover && !tutFound) {
                    if (!Course.tutorials[key]) Course.tutorials[key] = [];
                    Course.tutorials[key].push(group[1][i].name + group[1][i].info);
                }

                if (!recover || recover && tutFound) Calendar.putGroupItem(group[1][i]);
            }
        } else {
            Calendar.putCompulsaryItem(group[1]);
        }
    },
    columnMerge       : function () {

        $('.timeslot[data-index!="-1"]:not(.hide)').each(function () {

            var afterElement = $(this),
                hour         = parseFloat(afterElement.data('hour')),
                day          = afterElement.data('day'),
                index        = parseInt(afterElement.data('index')),
                emptyCount   = 0,
                lastIndex    = index,
                hideList     = [[]],
                rowspan;

            // Add consecutive empty cells after the timeslot to the
            // hiding pending list and accumulates empty counts for rowspan
            while ((afterElement = afterElement.find('+ [data-day="' + day + '"]:empty:not(.rowspanHide)')).length) {
                if (lastIndex + 1 !== (lastIndex = parseInt(afterElement.data('index')))) break;
                hideList[0].push(afterElement);
                emptyCount++;
            }

            if (!emptyCount) return;

            // If rowspan exists, proceeding to the bound rows and add cells
            // which suits consecutive empty cells condition to the hiding
            // list, abort and delete the previous added elements if found
            // any non empty or .rowspanHide cells.
            if (rowspan = parseInt($(this).attr('rowspan'))) {
                var abort = false;
                for (var i = 0.5; i < rowspan / 2; i += 0.5) {
                    for (var j = 1; j <= emptyCount; j++) {
                        var nextElement = Calendar.timeslotElement(hour + i, day, index + j).filter(':empty:not(.rowspanHide)');
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
                    l.addClass('hide');
                });
            });

            if (emptyCount > 0) $(this).attr('colspan', emptyCount + 1);
        });

        return Calendar;
    },
    columnSeparate    : function () {

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
                Calendar.timeslotElement(hour + i, day, index).removeClass('hide').removeClass('rowspanHide');
            $(this).removeAttr('rowspan');
        });

        return Calendar;
    },
    removeFromGrid    : function (courseName) {

        // Delete the course from grid array
        $.each(Calendar.courseGrids, function (i, v) {
            $.each(v, function (j, h) {
                $.each(h, function (k, n) {
                    if (n.toString().indexOf(courseName) !== -1) Calendar.courseGrids[i][j][k] = 0;
                });
            });
        });

        // UI update
        $('.lesson[data-name="' + courseName + '"]').slideDown(function () {
            $(this).parent().empty();
            Calendar.columnSeparate().columnMerge().togglePlaceholders();
        });

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
    fillArray         : function (array, fillWith, hour, day, blockNum, currentIndex) {

        // Find the left most possible space and fill in the value
        // For example, if we need to fill up 2 blocks with value v
        // from vertical index 2 then the transition will be like:
        // var a = [[[], [0        , 0, 0], [], [], []],
        //          [[], [1        , 0, 0], [], [], []],
        //          [[], [0 -> v   , 2, 0], [], [], []],
        //          [[], [0 -> v~~~, 2, 3], [], [], []]];
        // ~~~ is used to identify if this should be an empty cell
        // but occupied by v from last cell vertically.
        if ('undefined' === typeof array[hour][day][currentIndex] || !array[hour][day].length) {
            $.each(array, function (i) {
                array[i][day].push(i < hour || i >= hour + blockNum ? 0 : fillWith + (hour == i ? '' : '~~~'));
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
                array[hour + j][day][currentIndex] = fillWith + (j === 0 ? '' : '~~~');
        }
        return [currentIndex, array];
    },
    timeslotElement   : function (hour, day, index) {
        var selector = '.timeslot[data-index!="-1"]';
        if (null !== hour) selector += '[data-hour="' + hour + '"]';
        if (null !== day) selector += '[data-day="' + day + '"]';
        if (null !== index) selector += '[data-index="' + index + '"]';
        return $(selector);
    },
    dayHeaderElement  : function (day) {
        return $('.table.table-striped th.col-sm-2:nth(' + (parseInt(day).toString() === day.toString() ? day : Calendar.weekdays.indexOf(day)) + ')');
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
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return '';
    }
};

var Course = {
    courses   : [],
    tutorials : {},
    get       : function () {
        var courseNameElement = $("#course-name");
        var courseName        = courseNameElement.val().split('-')[0].toUpperCase().trim();
        if (courseName && Course.courses.indexOf(courseName) === -1) {
            $("#add-course").html("Adding...");
            courseNameElement.val("");
            Course.add(courseName);
        }
        return Course;
    },
    add       : function (courseName, isRecovering) {
        var data = timetableData[courseName];
        recover  = 'undefined' !== typeof isRecovering;

        if (Course.courses.length >= 6 || !data) {
            $("#add-course").html(!data ? 'Course not found!' : 'Too many courses!');
            setTimeout(function () {
                $("#add-course").html("Add");
            }, 2000);
        } else {
            $("#add-course").html("Add");
            _(data).each(Calendar.putLessonGroup);
            Course.courses.push(courseName);

            // add course style class.
            var courseStyleNum = Math.abs(Course.courses.indexOf(courseName) % 5) + 1;
            $("[data-name=" + courseName + "]").addClass("lesson-style-" + courseStyleNum);

            Course.display().save();
        }

        return Course;
    },
    remove    : function (courseName) {
        Course.courses = _(Course.courses).without(courseName);

        // Delete all related tutorials
        $.each(Course.tutorials, function (index) {
            if (index.indexOf(courseName) !== -1) delete Course.tutorials[index];
        });

        Calendar.removeFromGrid(courseName);
        Course.display().save();

        return Course;
    },
    display   : function () {
        var displayElement = $('#chosenCourses');
        if (Course.courses.length <= 0) {
            displayElement.html('None.');
            return Course;
        }

        var html = '';
        $.each(Course.courses, function (index, courseName) {
            html += (index === 0 ? '' : ', ') + courseName + ' <a href="javascript:void(0)" onclick="Course.remove(\'' + courseName + '\')">(delete)</a>';
        });
        displayElement.empty().append(html);

        return Course;
    },
    recover   : function () {
        var savedCourses = Tools.getSavedData('courses');
        var temp         = Tools.getSavedData('tutorials');
        Course.tutorials = temp ? JSON.parse(temp) : {};
        if (savedCourses) {
            Calendar.columnSeparate();
            $.each(JSON.parse(savedCourses), function (i, courseName) {
                Course.add(courseName, true);
            });
            Calendar.columnMerge().togglePlaceholders();
        }
        Course.display();
        return Course;
    },
    save      : function () {
        if (hasLocalStorage) {
            localStorage.setItem('courses', JSON.stringify(Course.courses));
            localStorage.setItem('tutorials', JSON.stringify(Course.tutorials));
        } else {
            Cookie.set('courses', JSON.stringify(Course.courses));
            Cookie.set('tutorials', JSON.stringify(Course.tutorials));
        }
        return Course;
    },
    clear     : function (e) {
        ('undefined' !== typeof e) && e.preventDefault();
        Course.courses   = [];
        Course.tutorials = {};
        Course.display().save();
        $("#cal-container").html(Calendar.html);
        return Course;
    },
    processRaw: function (rawData) {
        $.each(rawData[3], function (i, course) {
            rawData[3][i].fullName = rawData[0][course.nid];
            rawData[3][i].info     = rawData[1][course.iid];
            rawData[3][i].location = rawData[2][course.lid];
            delete rawData[3][i].nid;
            delete rawData[3][i].iid;
            delete rawData[3][i].lid;
        });
        rawLessons = rawData[3];
    }
};

var loadJSON = {
    status      : function (succeed, isLoading) {
        var element = $('#load');
        succeed ? element.removeClass('text-warning').html('Loaded!') : element.addClass('text-warning').html(isLoading ? 'Loading..' : 'Not a valid JSON file!');
        setTimeout(function () {
            element.html("Load data from .json");
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
    pad               : function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    hourify           : function (num) {
        var parts = num.toString().split('.');
        return Tools.pad(parts[0], 2) + (parts[1] === '5' ? '30' : '00');
    },
    getSavedData      : function (name) {
        return hasLocalStorage ? localStorage.getItem(name) : Cookie.get(name);
    },
    displayUpdatedTime: function (itemNumber) {
        $('#jsonUpdatedTime').html(jsonUpdatedTime + '.' + ('undefined' !== typeof itemNumber ? ' (' + itemNumber + ' classes)' : ''));
    }
};

$(function () {

    Calendar.initialize();
    Tools.displayUpdatedTime();

    $.get('https://rawgit.com/samyex6/anutimetable/master/data/timetable-test.json', {}, function (data) {
        Course.processRaw(data);
        timetableData = rearrangeLessons(rawLessons);
        Course.recover();
        Tools.displayUpdatedTime(rawLessons.length);
    }).fail(function () {
        $('#load').removeClass('hide');
        $('#chosenCourses').html('Unable to load data from source, please try to refresh or manually load pre-fetched JSON from ./data folder.');
    });

    $("#cal-container").append(Calendar.html);

    document.onkeydown = function (e) {
        if (e.which == 13) {
            event.preventDefault();
            Course.get();
        }
    };

    $("#download").on("click", function (event) {

        var calString     = $("#cal-header").text();
        var eventTemplate = _.template($("#event-template").html());

        _(rawLessons).each(function (lesson) {
            if (Course.courses.indexOf(lesson.name) !== -1) {
                var day = Calendar.weekdays.indexOf(lesson.day);
                calString += eventTemplate({
                    padded_hour    : Tools.hourify(lesson.start),
                    padded_end_hour: Tools.hourify(lesson.start + lesson.dur),
                    first_day      : 15 + day,
                    day            : lesson.day,
                    description    : lesson.info,
                    location       : lesson.location,
                    course         : lesson.name + ' ' + lesson.info,
                    holiday1       : (6 + day < 10) ? "0" + (6 + day) : (6 + day),
                    holiday2       : 13 + day
                });
            }
        });

        calString += "\nEND:VCALENDAR";
        download(calString, "anu_s1_timetable.ics", "text/plain");
    });

    $('#add-course').on('click', Course.get);
    $('#clear-courses').on('click', Course.clear);
    $('#load').on('click', $('#file').change(loadJSON.eventHandler).click);

    $('#course-name').typeahead({
        highlight: true,
        hint     : false
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
                        name      : simplifiedName,
                        matchIndex: matchIndex
                    });
                    matches.push(simplifiedName);
                }
            });

            // Sort them depends on the appeared position and name in ascending order
            matchIndexes.sort(function (a, b) {
                return a.matchIndex - b.matchIndex + a.name.localeCompare(b.name);
            });

            // Builds the final result.
            matches = [];
            $.each(matchIndexes, function (i, course) {
                matches.push(course.name);
            });

            process(matches);
        }
    });

});
