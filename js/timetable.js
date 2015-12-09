var rawLessons, fullNameIndexes = [];
var timetableData               = {};
var hasLocalStorage             = typeof(Storage) !== "undefined";
var recover                     = false;

var Calendar = {
    initialize       : function () {
        this.template                 = _.template($("#calendar-template").text());
        this.compulsaryLessonTemplate = $("#compulsary-event-template").text();
        this.groupLessonTemplate      = $("#group-event-template").text();
        this.html                     = this.template({
            start_hour       : 8,
            normal_start_hour: 9,
            normal_end_hour  : 18,
            end_hour         : 20
        });
    },
    putItem          : function (item, displayDiv) {
        var place = _($(".timeslot")).filter(function (x) {
            return $(x).data("day") == item.day &&
                $(x).data("hour") == item.hour;
        })[0];

        if (item.hour == 8) {
            _($(".timetable-row")).each(function (row) {
                if ($(row).data("hour") == 8) {
                    $(row).show('slide');
                }
            })
        } else if (item.hour > 17) {
            _($(".timetable-row")).each(function (row) {
                if (parseInt($(row).data("hour")) > 16) {
                    $(row).show('slide');
                }
            })
        }

        $(place).prepend(displayDiv).hide().show('slide');
    },
    putCompulsaryItem: function (item) {
        var displayDiv = $(_.template(Calendar.compulsaryLessonTemplate, {item: item}));
        Calendar.putItem(item, displayDiv);
    },
    putGroupItem     : function (item) {
        var displayDiv = $(_.template(Calendar.groupLessonTemplate, {item: item}));

        $(displayDiv.find("a.choose")[0]).on("click", function (event) {
            event.preventDefault();
            _($(".lesson")).each(function (item) {
                var $item = $(item);
                if ($item.data("group") == displayDiv.data("group")) {
                    if ($item.data("fgroup") != displayDiv.data("fgroup")) {
                        var index = $.inArray($item.data('fgroup'), Course.tutorials[$item.data('group')]);
                        if (index !== -1) Course.tutorials[$item.data('group')].splice(index, 1);
                        $item.hide('slide', $item.remove);
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
    putLessonGroup   : function (group) {
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
        var courseName = $("#course-name").val().split('-')[0].toUpperCase().trim();
        if (courseName && Course.courses.indexOf(courseName) === -1) {
            $("#add-course").html("Adding...");
            $("#course-name").val("");
            Course.add(courseName);
        }
        return Course;
    },
    add       : function (courseName, isRecovering) {
        var data = timetableData[courseName];
        recover  = 'undefined' !== typeof isRecovering;

        if (data) {
            $("#add-course").html("Add");

            _(data).each(Calendar.putLessonGroup);

            Course.courses.push(courseName);

            // add course style class.
            var courseStyleNum = Course.courses.length % 6;
            $("[data-name=" + courseName + "]").addClass("lesson-style-" + courseStyleNum);

            Course.display().save();
        } else {
            $("#add-course").html("Course not found!");
            setTimeout(function () {
                $("#add-course").html("Add");
            }, 2000);
        }

        return Course;
    },
    remove    : function (courseName) {
        Course.courses = _(Course.courses).without(courseName);

        // Delete all related tutorials
        $.each(Course.tutorials, function (index) {
            if (index.indexOf(courseName !== -1)) delete Course.tutorials[index];
        });

        $(".lesson").each(function (index, lesson) {
            var $lesson = $(lesson);
            if ($lesson.data("name") == courseName)
                $lesson.hide("slide", $lesson.remove);
        });
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
        var savedCourses = getSavedData('courses');
        var temp         = getSavedData('tutorials');
        Course.tutorials = temp ? JSON.parse(temp) : {};
        if (savedCourses) {
            $.each(JSON.parse(savedCourses), function (i, courseName) {
                Course.add(courseName, true);
            });
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

var getSavedData = function (name) {
    return hasLocalStorage ? localStorage.getItem(name) : Cookie.get(name);
};

$(function () {

    Calendar.initialize();

    // https://rawgit.com/samyex6/anutimetable/master/data
    $.get("./data/timetable.json", {}, function (data) {
        Course.processRaw(data);
        timetableData = rearrangeLessons(rawLessons);
        Course.recover();
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
        var ids = _($(".lesson:not(:hidden)")).map(function (x) {
            return $(x).data("id")
        });

        var calString     = $("#cal-header").text();
        var eventTemplate = _.template($("#event-template").html());

        _(rawLessons).each(function (lesson) {
            if (ids.indexOf(lesson.id) >= 0) {
                var day = ["mon", "tue", "wed", "thu", "fri"].indexOf(lesson.day);
                calString += eventTemplate({
                    padded_hour    : (lesson.hour < 10 ? "0" : "") + lesson.hour,
                    padded_end_hour: (lesson.hour < 9 ? "0" : "") + (lesson.hour + 1),
                    first_day      : 15 + day,
                    day            : lesson.day,
                    description    : lesson.info,
                    location       : lesson.location,
                    course         : lesson.name + " " + lesson.info,
                    id             : lesson.id,
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
