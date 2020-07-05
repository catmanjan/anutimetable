#!/usr/bin/env python3

import requests
import pprint
import time
from bs4 import BeautifulSoup

from classes.course import (Course, splitHeaderTable)
from classes.coursesPage import (Chunk, CoursesPage)
from classes.sessionData import SessionData
from classes.loadingBar import printProgressBar
from classes.toJSON import formatCourses

URL = "http://timetabling.anu.edu.au/sws2020/"
SEMESTER = 2

# 1-50: 50 is the maximum allowed request
CHUNK = 1

start_time = time.time()
# Get landing page
print("Getting landing page...")
res = requests.get(URL)
cookies = res.cookies
landingSoup = BeautifulSoup(res.content, 'html.parser')

session = SessionData(landingSoup)
print("Got landing page! Getting list of courses...")
res = requests.post(URL, data=session.withTargetLinkType("LinkBtn_modules","information"), cookies=cookies)
cookies = res.cookies
session =  SessionData(BeautifulSoup(res.content, 'html.parser'))
coursesPage = CoursesPage(res)

coursesPage.courseList = list(filter(lambda x: x[0].endswith(f"S{SEMESTER}"), coursesPage.courseList))

courseCount = len(coursesPage.courseList)
print(f"Found {courseCount} courses.")


body = coursesPage.getBody(SEMESTER)
body = [(k, v) for k, v in body.items()]

courses = []
printProgressBar(0, courseCount)
for courseCodes in Chunk(coursesPage, CHUNK):
    reqBody = [] + session.asModuleList() + body
    for code in courseCodes:
        reqBody.append(('dlObject', code[1]))
    res = requests.post(URL, data=reqBody, cookies=cookies)
    try:
        new = splitHeaderTable(res)
    except PermissionError:
        print("Request error!")
        exit(1)
    courses = courses + new
    printProgressBar(len(courses), courseCount)

formatCourses(courses)
print(f"Scraping complete, scraped {len(courses)} courses in total, time elapsed: { time.time() - start_time}s")
