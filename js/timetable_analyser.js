var isCompulsory = function (string) {
    // Best guess as to whether the class is compulsory
    return false;
    if (string.toLowerCase().indexOf('lecture') > -1
        || string.toLowerCase().indexOf('group teaching') > -1
        || string.toLowerCase().indexOf('seminar') > -1) {
        return true;
    }
}

var filterCompulsory = function (string) {
    // Fallback to old filter (number based)
    return isCompulsory ? string : filterNumbers(string);
};

var filterNumbers = function (string) {
    return string.split('/')[0].trim();
};

var removeSquareBracketedBits = function (string) {
    return string.replace(/\[(.*?)\]/, "");
};

var tidyLessons = function (lessons) {
    for (var i = 0; i < lessons.length; i++) {
        var lesson  = lessons[i];
        lesson.info = removeSquareBracketedBits(lesson.info);
        lessons[i]  = lesson;
    }
};

var addToPartition = function (partition, key, value) {
    if (partition[key]) {
        partition[key].push(value);
    } else {
        partition[key] = [value];
    }
};

var partitionLessons = function (lessons) {
    var partition = {}, key, lesson;
    for (var i = 0; i < lessons.length; i++) {
        lesson = lessons[i];
        key    = filterCompulsory(lesson.info);
        addToPartition(partition, key, lesson);
    }

    var out = [];

    for (key in partition) {
        if (partition.hasOwnProperty(key)) {
            if (isCompulsory(key)) {
                for (var member in partition[key]) {
                    out.push(["compulsary", partition[key][member]]);
                }
            } else {
                out.push(["group", partition[key]]);
            }
        }
    }

    return out;
};

var rearrangeLessons = function (uglyLessons) {
    tidyLessons(uglyLessons);

    var coursesPartition = {};
    for (var i = 0; i < uglyLessons.length; i++) {
        var lesson = uglyLessons[i];
        addToPartition(coursesPartition, lesson.name, lesson);
    }

    var out = {};

    for (var courseName in coursesPartition) {
        if (coursesPartition.hasOwnProperty(courseName)) {
            out[courseName] = partitionLessons(coursesPartition[courseName]);
        }
    }

    return out;
};