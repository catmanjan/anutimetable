var rawLessons = [];
var timetableData = {};


$('#load').click(function () {
    $('#file').click();
});

$('#file').change(function (e) {
    var file = e.target.files, f = file[0], reader = new FileReader();
    reader.onloadstart = function () {
        loadStatus(0, 1);
    };
    reader.onload = function (e) {
        try {
            rawLessons = $.parseJSON(e.target.result);
        } catch (err) {
            rawLessons = [];
        } finally {
            if (!loadStatus(!!rawLessons.length)) return false;
            timetableData = rearrangeLessons(rawLessons);
        }
    };
    reader.readAsText(f);
});

var loadStatus = function (succeed, isLoading) {
    succeed ? $('#load-status').removeClass('text-warning').html('Loaded!') : $('#load-status').addClass('text-warning').html(isLoading ? 'Loading..' : 'Not a valid JSON file!');
    return succeed;
};

if (window.location.protocol !== 'file:')
    $.get("./timetable.json", {}, function (data) {
        rawLessons = data;
        timetableData = rearrangeLessons(rawLessons);
    });


var compulsaryLessonTemplate = $("#compulsary-event-template").text();

var putItemInCalendar = function (item, displayDiv) {
    var place = _($(".timeslot")).filter(function (x) {
        return $(x).data("day") == item.day &&
            $(x).data("hour") == item.hour;
    })[0];

    if (item.hour == 8) {
        _($(".timetable-row")).each(function (row) {
            if ($(row).data("hour") == 8) {
                $(row).show();
            }
        })
    } else if (item.hour > 17) {
        _($(".timetable-row")).each(function (row) {
            if (parseInt($(row).data("hour")) > 16) {
                $(row).show();
            }
        })
    }

    $(place).prepend(displayDiv);
}

var putCompulsaryItemInCalendar = function (item) {
    var displayDiv = $(_.template(compulsaryLessonTemplate, {item: item}));

    putItemInCalendar(item, displayDiv);
}

var groupLessonTemplate = $("#group-event-template").text();

var putGroupItemInCalendar = function (item) {
    var displayDiv = $(_.template(groupLessonTemplate, {item: item}));

    $(displayDiv.find("a.choose")[0]).on("click", function (event) {
        event.preventDefault();
        _($(".lesson")).each(function (item) {
            var $item = $(item);
            if ($item.data("group") == displayDiv.data("group")) {
                if ($item.data("id") != displayDiv.data("id")) {
                    $item.remove();
                } else {
                    $("[data-id='" + displayDiv.data("id") + "'] a.choose").hide("scale");
                }
            }
        });
    });

    putItemInCalendar(item, displayDiv);

    // Hide all but one of the (choose) links
    $("[data-id='" + displayDiv.data("id") + "'] a.choose").slice(1).hide();
};

var putLessonGroupInCalendar = function (group) {
    if (group[0] == "group") {
        for (var i = group[1].length - 1; i >= 0; i--) {
            putGroupItemInCalendar(group[1][i]);
        }
        ;
    } else {
        putCompulsaryItemInCalendar(group[1]);
    }
};

var courses = [];

var getCourse = function () {
    var courseName = $("#course-name").val().toUpperCase().trim();
    if (courseName.length == 8 && courses.indexOf(courseName) === -1) {
        $("#add-course").html("Adding...");
        $("#course-name").val("");
        addCourse(courseName);
    }
}

var addCourse = function (courseName) {
    data = timetableData[courseName];

    if (data) {
        $("#add-course").html("Add course");

        _(data).each(putLessonGroupInCalendar);

        var newCourseLabel = $("<a class='btn btn-sm btn-danger'>delete " + courseName + "</a>");
        $("#courses").append(newCourseLabel);
        newCourseLabel.on("click", function (event) {
            removeCourse(courseName, event);
        })
        courses.push(courseName);

        // add course style class.
        var courseStyleNum = courses.length % 6;
        $("[data-name=" + courseName + "]").addClass("lesson-style-" + courseStyleNum);
    } else {
        $("#add-course").html("Course not found!");
        setTimeout(function () {
            $("#add-course").html("Add course");
        }, 1000);
    }
}

var removeCourse = function (courseName, event) {
    event.preventDefault();
    $(event.target).hide("slide");
    courses = _(courses).without(courseName);
    $(".lesson").each(function (index, lesson) {
        var $lesson = $(lesson);
        if ($lesson.data("name") == courseName) {
            $lesson.remove();
        }
    });
}

$(function () {
    var calendarTemplate = _.template($("#calendar-template").text());
    var calendarHtml = calendarTemplate({
        start_hour: 8,
        normal_start_hour: 9,
        normal_end_hour: 18,
        end_hour: 20
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
        var ids = _($(".lesson")).map(function (x) {
            return $(x).data("id")
        });

        var calString = $("#cal-header").text();

        var eventTemplate = _.template($("#event-template").html());

        _(rawLessons).each(function (lesson) {
            if (ids.indexOf(lesson.id) >= 0) {
                var day = ["mon", "tue", "wed", "thu", "fri"].indexOf(lesson.day);
                calString += eventTemplate({
                    padded_hour: (lesson.hour < 10 ? "0" : "") + lesson.hour,
                    padded_end_hour: (lesson.hour < 9 ? "0" : "") + (lesson.hour + 1),
                    first_day: 16 + day,
                    day: lesson.day,
                    description: lesson.info,
                    location: lesson.location,
                    course: lesson.name + " " + lesson.info,
                    id: lesson.id,
                    holiday1: (6 + day < 10) ? "0" + (6 + day) : (6 + day),
                    holiday2: 13 + day
                });
            }
        });

        calString += "\nEND:VCALENDAR";
        download(calString, "anu_s1_timetable.ics", "text/plain");
    })
});
