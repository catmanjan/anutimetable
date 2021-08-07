from icalevents.icalevents import events
from datetime import date
import yaml
import os

# Create a folder for temporary files

# Get current year
# year = date.today().year
year = 2022
# Check if current year's data is already downloaded
if not os.path.exists(os.path.join(os.path.dirname(os.path.realpath(__file__)),  str(year)+'.yml')):
    # if checked, no need to run.
    with open(os.path.join(os.path.dirname(os.path.realpath(__file__)),  str(year)+'.yml'), 'w') as f: 
        # Get ANU offical academic calendar
        # url= 'https://www.anu.edu.au/directories/university-calendar/' + str(year)+ '/calendar.ics'
        url='http://localhost:5500/calendar.ics'
        all_event=events(url, start=date(year, 1, 1), end=date(year, 12, 31))
        data={}
        data={'Semester 1':{'start':'','end':''},'Semester 2':{'start':'','end':''}}

        for event in all_event:
            if event.summary == 'Semester 1 begins':
                data['Semester 1']['start'] = event.start.date().isoformat()
            if event.summary=='Semester 2 begins':
                data['Semester 2']['start']=event.start.date().isoformat()
            if event.summary=='Semester 1 ends':
                data['Semester 1']['end']=event.start.date().isoformat()
            if event.summary=='Semester 2 ends':
                data['Semester 2']['end']=event.start.date().isoformat()
        yaml.dump(data, f)
