from icalevents.icalevents import events
from datetime import date
import yaml
import os

# Create a folder for temporary files

# Get current year
# year = date.today().year
year = 2022
# Open the exist file.
with open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'data.yml'), 'r') as f:
    # Read from data.yml, get current database
    l=yaml.load(f,Loader=yaml.SafeLoader)
    try:
        l[year]
        flag=True
    except TypeError:
        flag=False
    print(flag)
    
    
if not flag:
    with open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'data.yml') , 'a+') as f: 
        #Get ANU offical academic calendar
        url= 'https://www.anu.edu.au/directories/university-calendar/' + str(year)+  '/calendar.ics'
        #If current year's data is not downloaded, download it
        url='http://localhost:5500/calendar.ics'
        all_event=events(url, start=date(year, 1, 1), end=date(year, 12, 31))
        data={}
        data={year:{'Semester 1':{'start':'','end':''},'Semester 2':{'start':'','end':''}}}
        for event in all_event:
            if event.summary == 'Semester 1 begins':
                data[year]['Semester 1']['start'] = event.start.date().isoformat()
            if event.summary=='Semester 2 begins':
                data[year]['Semester 2']['start']=event.start.date().isoformat()
            if event.summary=='Semester 1 ends':
                data[year]['Semester 1']['end']=event.start.date().isoformat()
            if event.summary=='Semester 2 ends':
                data[year]['Semester 2']['end']=event.start.date().isoformat()
        yaml.dump(data, f) 