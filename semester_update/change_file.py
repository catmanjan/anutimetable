from shutil import copy
from tempfile import TemporaryDirectory
from datetime import date
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


def detect_semester():
    today = date.today()
    if 1 < today.month < 7:
        return 'fall'
    else:
        return 'spring'


today = date.today()

with open('data.yaml', 'r') as f:
    data = yaml.load(f, Loader=yaml.SafeLoader)
    
with TemporaryDirectory() as temp_dir:
    copy(os.path.join(os.path.dirname(__file__),
         'index_template.html'), os.path.join(temp_dir, 'index.html'))
    copy(os.path.join(os.path.dirname(__file__),
         'timetable_template.js'), os.path.join(temp_dir, 'timetable.js'))
    copy(os.path.join(os.path.dirname(__file__),
         'scraper_template'), os.path.join(temp_dir, 'scraper.py'))

    inplace_change(os.path.join(temp_dir, 'scraper.py'),
                   '<%= year%>', str(today.year))
    inplace_change(os.path.join(temp_dir, 'index.html'),
                   '<%= year%>', str(today.year))

    copy(os.path.join(temp_dir, 'index.html'), os.path.realpath('..'))
    copy(os.path.join(temp_dir, 'timetable.js'),
         os.path.join(os.path.realpath('..'), 'js'))
    copy(os.path.join(temp_dir, 'scraper.py'),
         os.path.join(os.path.realpath('..'), 'anuscrape'))
