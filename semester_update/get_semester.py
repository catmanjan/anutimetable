from icalevents.icalevents import events
from datetime import date
import yaml
import os

# Create a folder for temporary files

# Get current year
year = date.today().year
# year = 2022
# Open the exist file. PS: pyyaml can't read the file if using a+ mode
with open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'data.yml'), 'r') as f:
    # Read from data.yml, get current database
    l = yaml.load(f, Loader=yaml.SafeLoader)
    # If the current year is in the database, end the program
    try:
        l[year]
        flag = True
    except (TypeError, KeyError):
        flag = False


if not flag:
    with open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'data.yml'), 'a+') as f:
        # Get ANU offical academic calendar
        url = 'https://www.anu.edu.au/directories/university-calendar/' + \
            str(year) + '/calendar.ics'
        # If current year's data is not downloaded, download it
        #url = 'http://localhost:5500/calendar.ics'
        all_event = events(url, start=date(year, 1, 1), end=date(year, 12, 31))
        # Structure the base
        data = {year: {'Semester 1': {'start': '', 'end': ''},
                       'Semester 2': {'start': '', 'end': ''}}}
        for event in all_event:
            # https://stackoverflow.com/questions/3389574/check-if-multiple-strings-exist-in-another-string/3389611
            if ("semester" in event.summary.lower()) and not("research" in event.summary.lower()):
                s1 = ["1", "one","first"]
                start = ["starts", "begins"]
                end = ["ends"]
                s2 = ["2", "two","second"]
                if any(x in event.summary.lower() for x in s1) and any(x in event.summary.lower() for x in start):
                    data[year]['Semester 1']['start'] = event.start.date().isoformat()
                if any(x in event.summary.lower() for x in s2) and any(x in event.summary.lower() for x in start):
                    data[year]['Semester 2']['start'] = event.start.date().isoformat()
                if any(x in event.summary.lower() for x in s1) and any(x in event.summary.lower() for x in end):
                    data[year]['Semester 1']['end'] = event.start.date().isoformat()
                if any(x in event.summary.lower() for x in s2) and any(x in event.summary.lower() for x in end):
                    data[year]['Semester 2']['end'] = event.start.date().isoformat()
        # write the data to the database
        yaml.dump(data, f)
