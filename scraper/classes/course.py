from bs4 import BeautifulSoup
import itertools 
from typing import List
import re
import requests

def splitHeaderTable(res, geodata):
    soup = BeautifulSoup(res.content, 'html.parser')
    
    table = soup.find_all("tbody")
    header = soup.find_all('div', attrs={"data-role": "collapsible"})
    courses = []
    # print('-------------New page-------------')
    if len(table) == 0 or len(header) == 0:
        print(soup.prettify())
        raise PermissionError
    for (t, h) in itertools.zip_longest(table, header):
        c = Course(h, t, geodata)
        courses.append(c)
        # print(c)
        
    return courses


class Course:
    def __init__(self, header, table, geodata):
        self.title = header.find("h3").string
        self.id = header.find("a").string
        self.link = header.find("a")['href']
        self.dates = header.find('h3', class_="date-info-display").string.strip()
        self.classes: List[Lesson] = self._getClasses(table, geodata)
    def _getClasses(self, table, geodata):
        classes = []
        for row in table.find_all("tr"):
            try:
                classes.append(Lesson(row, geodata))
            except Exception as e:
                print("\nEncountered Exception while parsing course page:")
                print(f"{self}")
                print(f"Raw table data\n{row.prettify()}")
                raise e
        return classes
    def __str__(self):
        return f"{self.title} -- {self.dates}"


class Lesson:
    def __init__(self, row, geodata):
        cells = row.find_all("td")
        self.name = cells[0].a.next.strip()
        self.description = None
        self.day = dayToNum(cells[1].string)
        self.start =  cells[2].string
        self.finish = cells[3].string
        self.duration = cells[4].string
        self.weeks = cells[5].a.string.strip()

        # Use regex as ANU's data cannot be matched by position/symbol - it often adds random spaces and symbols
        self.module = re.search('[A-Za-z]{4}[0-9]{4}', self.name).group(0)
        self.session = re.search('_\w{2}', self.name).group(0)[1:] # remove leading underscore
        self.activity = re.search('[A-Za-z0-9]+(\/| )', self.name).group(0)[:-1] # remove trailing slash
        self.occurrence = re.search('/[0-9]+', self.name).group(0)[1:] # remove leading slash
        
        if cells[7].a == None:
            self.location = cells[7].string
            self.locationID = ""
            return
        self.location = cells[7].a.string
        self.locationID = cells[7].a['href']

        # Wanted to use https://www.anu.edu.au/anu-campus-map/show/mapID
        # But took roughly 25x longer (1200s), and had no pagination or search options
        mapID = re.search('show=([0-9]+)', self.locationID)
        if mapID and mapID.group(1):
            mapID = int(mapID.group(1))

            for item in geodata['items']:
                if item['id'] == mapID:
                    # get cached geo directly or from related parent (eg building)
                    geo = item.get('point')
                    if not geo:
                        geo = geodata['points'][str(item['related_points'][0])]
                    self.lat = geo['latitude']
                    self.lon = geo['longitude']
                    return
                    
            try:
                geo = [*requests.get('https://www.anu.edu.au/anu-campus-map/show/'+str(mapID)).json()['points'].values()][0]
                self.lat = str(geo['latitude'])
                self.lon = str(geo['longitude'])
                geodata['items'].append({'id': mapID, 'point': geo})
                # print(f"Cached location {mapID} for {self.location}")
            except:
                print(f"Could not find location for {self.name} at {mapID}")
                print(f"{self.locationID}")
        
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
