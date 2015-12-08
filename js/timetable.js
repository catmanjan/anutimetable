var rawLessons      = [];
var timetableData   = {};
var hasLocalStorage = typeof(Storage) !== "undefined";
var recover         = false;

if (window.location.protocol !== 'file:') {
    $.get("./data/timetable.json", {}, function (data) {
        rawLessons    = data;
        timetableData = rearrangeLessons(rawLessons);
        recoverCourses();
    });
} else {
    $('#chosenCourses').html('(Please load data from .json first.)');
}


var compulsaryLessonTemplate = $("#compulsary-event-template").text();

var putItemInCalendar = function (item, displayDiv) {
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
};

var putCompulsaryItemInCalendar = function (item) {
    var displayDiv = $(_.template(compulsaryLessonTemplate, {item: item}));

    putItemInCalendar(item, displayDiv);
};

var groupLessonTemplate = $("#group-event-template").text();

var putGroupItemInCalendar = function (item) {
    var displayDiv = $(_.template(groupLessonTemplate, {item: item}));

    $(displayDiv.find("a.choose")[0]).on("click", function (event) {
        event.preventDefault();
        _($(".lesson")).each(function (item) {
            var $item = $(item);
            if ($item.data("group") == displayDiv.data("group")) {
                if ($item.data("fgroup") != displayDiv.data("fgroup")) {
                    var index = $.inArray($item.data('fgroup'), tutorials[$item.data('group')]);
                    if (index !== -1) tutorials[$item.data('group')].splice(index, 1);
                    $item.hide('slide', $item.remove);
                } else {
                    $("[data-fgroup='" + displayDiv.data("fgroup") + "'] a.choose").hide("scale");
                }
            }
        });
    });

    putItemInCalendar(item, displayDiv);

    // Hide all but one of the (choose) links
    $("[data-fgroup='" + displayDiv.data("fgroup") + "'] a.choose").slice(1).hide();
};

var putLessonGroupInCalendar = function (group) {
    if (group[0] == "group") {
        for (var i = group[1].length - 1; i >= 0; i--) {
            var key      = group[1][i].name + filterNumbers(group[1][i].info),
                tutFound = $.inArray(group[1][i].name + group[1][i].info, tutorials[key]) !== -1;

            // Build tutorial object if is not in recovering mode
            if (!recover && !tutFound) {
                if (!tutorials[key]) tutorials[key] = [];
                tutorials[key].push(group[1][i].name + group[1][i].info);
            }

            if (!recover || recover && tutFound) putGroupItemInCalendar(group[1][i]);
        }
    } else {
        putCompulsaryItemInCalendar(group[1]);
    }
};

var courses = [], tutorials = {};

var getCourse = function () {
    var courseName = $("#course-name").val().split('_')[0].toUpperCase().trim();
    if (courses.indexOf(courseName) === -1) {
        $("#add-course").html("Adding...");
        $("#course-name").val("");
        addCourse(courseName);
    }
};

var addCourse = function (courseName, isRecovering) {
    var data = timetableData[courseName];
    recover  = 'undefined' !== typeof isRecovering;

    if (data) {
        $("#add-course").html("Add<sup>2</sup>");

        _(data).each(putLessonGroupInCalendar);

        courses.push(courseName);

        // add course style class.
        var courseStyleNum = courses.length % 6;
        $("[data-name=" + courseName + "]").addClass("lesson-style-" + courseStyleNum);

        displayCourses();
    } else {
        $("#add-course").html("Course not found!");
        setTimeout(function () {
            $("#add-course").html("Add<sup>2</sup>");
        }, 2000);
    }
};

var removeCourse = function (courseName) {
    courses = _(courses).without(courseName);

    // Delete all related tutorials
    $.each(tutorials, function (index) {
        if (index.indexOf(courseName !== -1)) delete tutorials[index]
    });

    $(".lesson").each(function (index, lesson) {
        var $lesson = $(lesson);
        if ($lesson.data("name") == courseName)
            $lesson.hide("slide", $lesson.remove);
    });
    displayCourses();
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

var displayCourses = function () {
    var displayElement = $('#chosenCourses');
    if (courses.length <= 0) {
        displayElement.html('None.');
        return;
    }

    var html = '';
    $.each(courses, function (index, courseName) {
        html += (index === 0 ? '' : ', ') + courseName + ' <a href="javascript:void(0)" onclick="removeCourse(\'' + courseName + '\')">(delete)</a>';
    });
    displayElement.empty().append(html);
};

var recoverCourses = function () {
    var savedCourses = getSavedData('courses');
    var temp         = getSavedData('tutorials');
    tutorials        = temp ? JSON.parse(temp) : {};
    if (savedCourses) {
        $.each(JSON.parse(savedCourses), function (i, courseName) {
            addCourse(courseName, true);
        });
    }
    displayCourses();
};

var loadStatus = function (succeed, isLoading) {
    var element = $('#load');
    succeed ? element.removeClass('text-warning').html('Loaded!') : element.addClass('text-warning').html(isLoading ? 'Loading..' : 'Not a valid JSON file!');
    setTimeout(function () {
        element.html("Load data from .json");
    }, 2000);
    return succeed;
};

var getSavedData = function (name) {
    return hasLocalStorage ? localStorage.getItem(name) : Cookie.get(name);
};

$(function () {
    var calendarTemplate = _.template($("#calendar-template").text());
    var calendarHtml     = calendarTemplate({
        start_hour       : 8,
        normal_start_hour: 9,
        normal_end_hour  : 18,
        end_hour         : 20
    });

    $("#cal-container").append(calendarHtml);

    document.onkeydown = function (e) {
        if (e.which == 13) {
            event.preventDefault();
            getCourse();
        }
    };

    $("#add-course").on("click", function (event) {
        getCourse();
        event.preventDefault();
    });

    $("#download").on("click", function (event) {
        var ids = _($(".lesson:not(:hidden)")).map(function (x) {
            return $(x).data("id")
        });

        var calString = $("#cal-header").text();

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


    $('#load').on('click', function () {
        $('#file').click();
    });

    $('#file').change(function (e) {
        var reader         = new FileReader();
        reader.onloadstart = function () {
            loadStatus(0, 1);
        };
        reader.onload      = function (e) {
            try {
                rawLessons = $.parseJSON(e.target.result);
            } catch (err) {
                rawLessons = [];
            } finally {
                if (loadStatus(!!rawLessons.length)) {
                    $('#clear-courses').click();
                    timetableData = rearrangeLessons(rawLessons);
                    recoverCourses();
                }
            }
        };
        reader.readAsText(e.target.files[0]);
    });

    $('#save-courses').on('click', function (e) {
        e.preventDefault();
        if (hasLocalStorage) {
            localStorage.setItem('courses', JSON.stringify(courses));
            localStorage.setItem('tutorials', JSON.stringify(tutorials));
        } else {
            Cookie.set('courses', JSON.stringify(courses));
            Cookie.set('tutorials', JSON.stringify(tutorials));
        }
        $(this).html('Saved!');
        setTimeout(function () {
            $('#save-courses').html('Save<sup>2</sup>');
        }, 2000);
    });

    $('#clear-courses').on('click', function (e) {
        e.preventDefault();
        courses   = [];
        tutorials = {};
        displayCourses();
        $("#cal-container").html(calendarHtml);
    });

    $('#flush-storage').on('click', function (e) {
        e.preventDefault();
        if (hasLocalStorage) {
            localStorage.setItem('courses', '');
            localStorage.setItem('tutorials', '');
        } else {
            Cookie.set('courses', '');
            Cookie.set('tutorials', '');
        }
        $(this).html('Flushed!');
        setTimeout(function () {
            $('#flush-storage').html('Flush<sup>3</sup>');
        }, 2000);
    });

    $('#course-name').typeahead({
        highlight: true,
        hint     : false
    }, {
        source: function (query, process) {
            var matches = [];

            query = query.trim().toLowerCase();
            $.each(rawLessons, function (i, course) {
                if (course.fullName && course.fullName.toLowerCase().indexOf(query) !== -1 && $.inArray(course.fullName, matches) === -1 ||
                    !course.fullName && course.name.toLowerCase().indexOf(query) !== -1 && $.inArray(course.name, matches) === -1)
                    matches.push(course.fullName || course.name);
            });
            process(matches);
        }
    });

});
