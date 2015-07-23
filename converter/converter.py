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

f = open('Timetable_Test_Data_File.csv', 'rt')
try:
    reader = csv.reader(f)
    next(reader)
    cid = 0
    for row in reader:
        if 'hidden' in row[1]:
            continue
            
        st = int(row[3][:2])
        et = int(row[4][:2])
        n = et - st
        
        for i in range (0, n):
            item = Entry()
            item.id = cid
            item.info = re.sub(r'(.+)_S2 (\D+)(\d+)(.+)', r'\2 \3', row[1])
            item.name = row[0][:8]
            item.hour = st + i
            item.location = row[8]
            item.day = shrinkDay(row[2])
            data.append(item)
            
        cid = cid + 1
        
finally:
    f.close()
    
with open('timetable.json', 'w') as jsonf:
    jsonf.write(json.dumps(data, sort_keys=True, indent=4, cls=StupidEncoder))