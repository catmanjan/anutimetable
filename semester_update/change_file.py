from shutil import copy
from tempfile import TemporaryDirectory
import os
with TemporaryDirectory() as temp_dir:
    copy(os.path.join(os.path.dirname(os.path.realpath(__file__)) ,  'index_template.html'), temp_dir+'/index.html')
    copy(os.path.join(os.path.dirname(os.path.realpath(__file__)) , 'timetable_template.js'), temp_dir+'/timetable.js')
