import csv
import sys
import json
import re

class Entry:
    info = ''
    name = ''
    hour = 0
    id = 0
    location = ''
    day = ''
    def to_JSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
    
class StupidEncoder(json.JSONEncoder):
    def default(self, obj):
        if not isinstance(obj, Entry):
            return super(StupidEncoder, self).default(obj)

        return obj.__dict__
        
def shrinkDay(day):
    return {
        'Monday': 'mon',
        'Tuesday': 'tue',
        'Wednesday': 'wed',
        'Thursday': 'thu',
        'Friday': 'fri',
        'Saturday': 'sat',
        'Sunday': 'sun'
    }[day]

data = []

f = open('Timetable.csv', 'rt')
try:
    reader = csv.reader(f, quotechar='"')
    next(reader)
    cid = 0
    for row in reader:
        if len(row) < 1:
            continue
    
        try:
            # start time
            st = int(row[7][:2])
            # end time
            et = int(row[8][:2])
            n = et - st
        except:
            print(cid)
            print(row)
            
        for i in range (0, n):
            item = Entry()
            item.id = cid
            item.info = re.sub(r'(.+) (\D+)(\d+)(.+)', r'\2 \3', row[0])
            # parent activity name
            item.name = row[3][:8]
            item.hour = st + i
            # location
            item.location = row[12]
            # day
            item.day = shrinkDay(row[6])
            data.append(item)
            
        cid = cid + 1
        
finally:
    f.close()
    
with open('timetable.json', 'w') as jsonf:
    jsonf.write(json.dumps(data, sort_keys=True, indent=4, cls=StupidEncoder))