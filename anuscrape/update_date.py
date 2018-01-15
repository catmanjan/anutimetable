#!/usr/bin/env python

""" update_date.py: Set the new date in the timetable.js, README.MD,
    manifest.appcache files automatically.
"""
__author__ = "Emmanuel Morfiadakis"
__copyright__ = "Copyright 2018, E. M."
__license__ = "MIT"
__version__ = "1.0.0"

from pathlib import Path
from datetime import datetime as dt
import sys

# The two functions here were taken from https://stackoverflow.com/questions/5891555/display-the-date-like-may-5th-using-pythons-strftime

def suffix(d):
    """ Get the suffix of a day, so for example the suffix of 1 is st: 1st
        @param d the day as an integer (1-30)
        @return the correct suffix
    """
    return 'th' if 11<=d<=13 else {1:'st',2:'nd',3:'rd'}.get(d%10, 'th')

def custom_strftime(format, t):
    """ Format a date in the form 1st of January, 2018
        @param format the format to be used
        @param the date object
        @return string in the above form
    """
    return t.strftime(format).replace('{S}', str(t.day) + suffix(t.day))

home = str(Path.home()) + "/anutimetable"
scrape_directory = home + "/anuscrape"
js_directory = home + "/js"
current_date_string = custom_strftime('{S} of %B, %Y', dt.now())

# Open timetable.js and read revision number
timetable_js = open(js_directory + "/timetable.js", 'r')
lines=timetable_js.readlines()
revision_id = lines[5].replace(";","")
revision_id = [int(s) for s in revision_id.split() if s.isdigit()][0]
timetable_js.close()

# Increment revision number, replace file with updated one
timetable_js = open(js_directory + "/timetable.js", 'w')
new_revision_id = int(revision_id) + 1
lines[4] = "var jsonUpdatedTime = '" + current_date_string + "';" +"\n"
lines[5] = "var revisionNum     = " + str(new_revision_id) + ";" + "\n"
timetable_js.writelines(lines)
timetable_js.close()

# Read readme.md contents
readme_md = open(home + "/README.md", 'r')
lines=readme_md.readlines()
readme_md.close()

# Write updated date and close file
readme_md = open(home + "/README.md", 'w')
current_date_string = dt.now().strftime('%Y-%m-%d')
lines[2] = "* Timetable database last update: " + current_date_string + "\n"
readme_md.writelines(lines)
readme_md.close()

# Read manifest.appcache contents
manifest = open(home + "/manifest.appcache", 'r')
lines=manifest.readlines()
manifest.close()

# Write updated date and revision and close file
manifest = open(home + "/manifest.appcache", 'w')
lines[1] = "#  " + current_date_string + " " + "v" + str(new_revision_id) + "\n"
manifest.writelines(lines)
manifest.close()

sys.exit(0)



