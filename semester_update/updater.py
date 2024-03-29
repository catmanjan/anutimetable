from string import punctuation
from shutil import copy
from tempfile import TemporaryDirectory
from datetime import date, datetime, time
from zoneinfo import ZoneInfo
import os
import yaml


def inplace_change(filename, old_string, new_string):
    # Safely read the input filename using 'with'
    with open(filename) as f:
        s = f.read()
        if old_string not in s:
            print('"{old_string}" not found in {filename}.'.format(**locals()))
            return

    # Safely write the changed content, if found in the file
    with open(filename, 'w') as f:
        print(
            'Changing "{old_string}" to "{new_string}" in {filename}'.format(**locals()))
        s = s.replace(old_string, new_string)
        f.write(s)


def detect_semester(data):
    today = date.today()
    if today <= data['Semester 1']['end']:
        return 1
    elif today >= data['Semester 1']['end'] and today <= data['Semester 2']['end']:
        return 2
    else:
        return -1 # Although semester 2 is ended, the new timetable is not available yet.

def csf(input):  # change_semester_format
    if input == 1:
        return 'Semester 1'
    elif input == 2:
        return 'Semester 2'
    elif input == 'Semester 1':
        return 1
    elif input == 'Semester 2':
        return 2


today = date.today()

with open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'data.yml'), 'r') as f:
    data = yaml.load(f, Loader=yaml.SafeLoader)
    data = data[today.year]
    data['Semester 1']['start'] = date.fromisoformat(
        data['Semester 1']['start'])
    data['Semester 1']['end'] = date.fromisoformat(data['Semester 1']['end'])
    data['Semester 2']['start'] = date.fromisoformat(
        data['Semester 2']['start'])
    data['Semester 2']['end'] = date.fromisoformat(data['Semester 2']['end'])

with TemporaryDirectory() as temp_dir:
    copy(os.path.join(os.path.dirname(__file__),
         'index_template.html'), os.path.join(temp_dir, 'index.html'))
    copy(os.path.join(os.path.dirname(__file__),
         'timetable_template.js'), os.path.join(temp_dir, 'timetable.js'))
    copy(os.path.join(os.path.dirname(__file__),
         'scraper_template'), os.path.join(temp_dir, 'scraper.py'))

    cur_sem = detect_semester(data)
    if cur_sem == -1:
        print('New timetable is not available yet.')
        exit() 
    # https://www.tutorialspoint.com/How-to-convert-date-to-datetime-in-Python
    max_time = time(23, 59, 59)
    end_timestamp = datetime.combine(data[csf(cur_sem)]['end'], max_time, tzinfo=ZoneInfo(
        'Australia/Sydney')).astimezone(ZoneInfo('UTC')) .replace(tzinfo=None).isoformat(timespec='seconds').translate(str.maketrans('', '', punctuation))+'Z'

    inplace_change(os.path.join(temp_dir, 'scraper.py'),
                   '<%= year%>', str(today.year))
    inplace_change(os.path.join(temp_dir, 'index.html'),
                   '<%= year%>', str(today.year))
    inplace_change(os.path.join(temp_dir, 'timetable.js'),
                   'startday_template', str(data[csf(cur_sem)]['start'].day))
    inplace_change(os.path.join(temp_dir, 'index.html'),
                   '<%= semester_no%>', str(cur_sem))
    inplace_change(os.path.join(temp_dir, 'index.html'),
                   '<%= semester%>', csf(cur_sem))
    inplace_change(os.path.join(temp_dir, 'scraper.py'),
                   '<%= semester_no%>', str(cur_sem))
    inplace_change(os.path.join(temp_dir, 'timetable.js'),'%semester_no%',str(cur_sem))
    inplace_change(os.path.join(temp_dir, 'index.html'),
                   '<%= month%>', "{:02d}".format(data[csf(cur_sem)]['start'].month))
    inplace_change(os.path.join(temp_dir, 'index.html'),
                   '<%= end_datestamp%>',end_timestamp)
    copy(os.path.join(temp_dir, 'index.html'), os.path.realpath('..'))
    copy(os.path.join(temp_dir, 'timetable.js'),
         os.path.join(os.path.realpath('..'), 'js'))
    copy(os.path.join(temp_dir, 'scraper.py'),
         os.path.join(os.path.realpath('..'), 'anuscrape'))
