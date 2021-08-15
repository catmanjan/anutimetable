from .course import (Course, Lesson)
from typing import List
import json
from time import strptime
from calendar import timegm

import re

def removeEmptyCourses(course):
    if len(course.classes) == 0:
        print(course.id, "has no data!")
        return False
    return True

# Converts a list of objects to a list of property dicts
def courseToDicts(course):
    course.classes = [x.__dict__ for x in course.classes]
    return course.__dict__

def formatCourses(courses: List[Course]):
    dicts = [courseToDicts(x) for x in list(filter(removeEmptyCourses, courses))]
    
    obj = {}
    for x in dicts:
        obj[x['id']] = x
    print(obj)
    data = json.JSONEncoder().encode(obj)
    f = open("timetable.json", "w+")
    f.write(data)
    f.close()

def clockToDecimal(s: str):
    l = re.split(r":",s)
    h = int(l[0])
    m = int(l[1])/60
    if m == 0:
        return h
    return h+m