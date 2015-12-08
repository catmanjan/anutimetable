var isCompulsory = function(string) {
	// Best guess as to whether the class is compulsory
	if(string.toLowerCase().indexOf('lecture') > -1
	|| string.toLowerCase().indexOf('group teaching') > -1
	|| string.toLowerCase().indexOf('class') > -1
	|| string.toLowerCase().indexOf('seminar') > -1) {
		return true;
	}
}

var filterCompulsory = function(string) {
	if(isCompulsory) {
        return string;
    }
    
	// Fallback to old filter (number based)
	return filterNumbers(string);
}

var filterSingleChars = function (string) {
  var isNotSingleChar = function(x) {
    return x.length > 1;
  }
  return string.split(" ").filter(isNotSingleChar).join(" ");
};

var filterNumbers = function (string) {
  var isNotADigit = function(x) {
    return "1234567890".indexOf(x) == -1;
  };
  return string.split("").filter(isNotADigit).join("");
};

var filterNumbersAndSingleChars = function (string) {
  return filterNumbers(filterSingleChars(string));
};

var removeSquareBracketedBits = function (string) {
  return string.replace(/\[(.*?)\]/, "");
};

var Partition = function () {
  this.partition = {}
};

var tidyLessons = function (lessons) {
  for (var i = 0; i < lessons.length; i++) {
    var lesson = lessons[i];
    lesson.info = removeSquareBracketedBits(lesson.info);
    lessons[i] = lesson;
  };
}

var addToPartition = function(partition, key, value) {
  if (partition[key]) {
    partition[key].push(value);
  } else {
    partition[key] = [value];
  }
}

var partitionLessons = function (lessons) {
  var partition = {};
  for (var i = 0; i < lessons.length; i++) {
    var lesson = lessons[i];
    var key = filterCompulsory(lesson.info);
    addToPartition(partition, key, lesson);
  }

  var out = [];

  for (var key in partition) {
    if (partition.hasOwnProperty(key)) {
      if (isCompulsory(key)) {
        for(var member in partition[key]) {
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
  };

  out = {}

  for (var courseName in coursesPartition) {
    if (coursesPartition.hasOwnProperty(courseName)) {
      out[courseName] = partitionLessons(coursesPartition[courseName]);
    }
  }

  return out;
}