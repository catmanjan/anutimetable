from bs4 import BeautifulSoup
import itertools 
from typing import List

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
        self.link = header.find("a")['href']
        self.dates = header.find('h3', class_="date-info-display").string.strip()
        self.classes: List[Lesson] = self._getClasses(table)
    def _getClasses(self, table):
        classes = []
        for row in table.find_all("tr"):
            classes.append(Lesson(row))
        return classes
    def __str__(self):
        return f"{self.title} -- {self.dates}"


class Lesson:
    def __init__(self, row):
        cells = row.find_all("td")
        self.name = cells[0].a.string.strip()
        self.description = cells[1].string
        self.day = cells[2].string
        self.start =  cells[3].string
        self.finish = cells[4].string
        self.duration = cells[5].string
        self.weeks = cells[6].a.string.strip()
        
        if cells[7].a == None:
            self.location = ""
            self.locationID = ""
            return
        self.location = cells[7].a.string
        self.locationID = cells[7].a['href']
    def __str__(self):
        return "{}: {}, {} {} - {}: {}h, Weeks: {}, {}".format(self.name, self.description, 
            self.day, self.start, self.finish, self.duration, self.weeks, self.location)