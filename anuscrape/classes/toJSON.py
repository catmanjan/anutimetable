from .course import (Course, Lesson)
from typing import List
from json import JSONEncoder
from time import strptime
from calendar import timegm

import re


def formatCourses(courses: List[Course]):
    Lessons = list()
    CourseNames = list()
    LessonNames = list()
    LessonLocations = list()
    m = re.findall(r"\d{2} \w{3} \d{2}", courses[0].dates)

    startSem = timegm(strptime(m[0] ,"%d %b %y"))
    endSem = timegm(strptime(m[1] ,"%d %b %y"))
    startend = [startSem, endSem]
    id = 1
    for course in courses:
        if len(course.classes) == 0:
            print(course.title, "has no data!")
            continue
        try:
            nid = CourseNames.index(course.title)
        except ValueError:
            CourseNames.append(course.title)
            nid = len(CourseNames) - 1
        
        for lesson in course.classes:
            lessonJSON = {"id": id, "nid": nid}
            id += 1
            m = re.findall(r"\w{4}/\d{1,2}", lesson.name)
            if len(m) == 0:
                print("Failed:", lesson.name)
                m = ""
            else:
                m = m[0]
            try:
                lessonJSON["iid"] = LessonNames.index(m)
            except ValueError:
                LessonNames.append(m)
                lessonJSON["iid"] = len(LessonNames) - 1
            try:
                lessonJSON["lid"] = LessonLocations.index(lesson.location)
            except ValueError:
                LessonLocations.append(lesson.location)
                lessonJSON["lid"] = len(LessonLocations) - 1
            lessonJSON["start"] = clockToDecimal(lesson.start)
            lessonJSON["dur"] = clockToDecimal(lesson.duration)
            lessonJSON["weeks"] = lesson.weeks
            # .replace("‑","-")
            lessonJSON["day"] = dayToNum(lesson.day)
            if lesson.description:
                lessonJSON["note"] = lesson.description
            Lessons.append(lessonJSON)
    finalList = [CourseNames, LessonNames, LessonLocations, Lessons, startend]
    json = JSONEncoder().encode(finalList)
    
    f = open("timetable.json", "w+")
    f.write(json)
    f.close()
    
    
    

def clockToDecimal(s: str):
    l = re.split(r":",s)
    h = int(l[0])
    m = int(l[1])/60
    if m == 0:
        return h
    return h+m

def dayToNum(s: str):
    days = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6
    }
    return days.get(s, "Not found")