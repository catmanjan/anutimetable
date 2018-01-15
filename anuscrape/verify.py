#!/usr/bin/env python

""" verify.py: Verifies that all courses have unique iid numbers.
    Helps in checking if the parsers work accurately. To run, ensure that
    timetable.json is in the same folder as this script and run:
    python3 verify.py 
"""
__author__ = "Emmanuel Morfiadakis"
__copyright__ = "Copyright 2018, E. M."
__license__ = "MIT"
__version__ = "1.0.0"

import json
from pprint import pprint

def has_uniques(list_of_iids):
    """
    Check if a list has unique entries.
    @param list_of_iids list of integers
    @return True if there are only unique elements in the list, False if there
            are duplicates.
    """
    list_of_iids.sort()
    for i in range(0, len(list_of_iids) - 1):
        if list_of_iids[i] == list_of_iids[i + 1]:
            return False
        else:
            continue
    return True

# Load JSON data from timetable.json
data = json.load(open('timetable.json'))
courses_dict = {}

# data[3] has the format {"id":,"nid":,"iid":,"lid":,"start":,"dur":,"day":}
for i in range(0, len(data[3])):
    # Case where a course is present in the dictionary
    if data[3][i]['nid'] in courses_dict:
        courses_dict[data[3][i]['nid']].append(data[3][i]['iid'])
    # Otherwise create a new entry in the dictionary for that course
    else:
        courses_dict[data[3][i]['nid']] = []
        courses_dict[data[3][i]['nid']].append(data[3][i]['iid'])


instances = 0
for key, value in courses_dict.items():
                   if (not has_uniques(value)):
                       instances +=1
                       print("Course with nid", key, "and name", data[0][key],  "has overlapping iids: ", end = "")
                       print(courses_dict[key])
                       print("\n")

print("Counted", instances, "instances with conflicts")

