from bs4 import BeautifulSoup
import itertools 
from typing import List
import re

def splitHeaderTable(res):
    soup = BeautifulSoup(res.content, 'html.parser')
    
    table = soup.find_all("tbody")
    header = soup.find_all('div', attrs={"data-role": "collapsible"})
    courses = []
    # print('-------------New page-------------')
    if len(table) == 0 or len(header) == 0:
        print(soup.prettify())
        raise PermissionError
    for (t, h) in itertools.zip_longest(table, header):
        c = Course(h, t)
        courses.append(c)
        # print(c)
        
    return courses


class Course:
    def __init__(self, header, table):
        self.title = header.find("h3").string
        self.id = header.find("a").string
        self.link = header.find("a")['href']
        self.dates = header.find('h3', class_="date-info-display").string.strip()
        self.classes: List[Lesson] = self._getClasses(table)
    def _getClasses(self, table):
        classes = []
        for row in table.find_all("tr"):
            try:
                classes.append(Lesson(row))
            except Exception as e:
                print("\nEncountered Exception while parsing course page:")
                print(f"{self}")
                print(f"Raw table data\n{row.prettify()}")
                raise e
        return classes
    def __str__(self):
        return f"{self.title} -- {self.dates}"


class Lesson:
    def __init__(self, row):
        cells = row.find_all("td")
        self.name = cells[0].a.next.strip()
        self.description = None
        self.day = dayToNum(cells[1].string)
        self.start =  cells[2].string
        self.finish = cells[3].string
        self.duration = cells[4].string
        self.weeks = cells[5].a.string.strip()

        # Use regex as ANU's data cannot be matched by position/symbol - it often adds random spaces and symbols
        self.module = re.search('[A-Z]{4}[0-9]{4}', self.name).group(0)
        self.session = re.search('_\w{2}', self.name).group(0)[1:] # remove leading underscore
        self.activity = re.search('[A-Za-z0-9]+(\/| )', self.name).group(0)[:-1] # remove trailing slash
        self.occurrence = re.search('/[0-9]+', self.name).group(0)[1:] # remove leading slash
        
        if cells[7].a == None:
            self.location = cells[7].string
            self.locationID = ""
            return
        self.location = cells[7].a.string
        self.locationID = cells[7].a['href']
    def __str__(self):
        return "{}: {}, {} {} - {}: {}h, Weeks: {}, {}".format(self.name, self.description, 
            self.day, self.start, self.finish, self.duration, self.weeks, self.location)

def dayToNum(s: str):
    days = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6
    }
    return days.get(s, "Not found")
