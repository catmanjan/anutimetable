from bs4 import BeautifulSoup
from .sessionData import SessionData


class CoursesPage:
    CONSTANT_PARAMS = {
        "lbDays": "1-7;1;2;3;4;5;6;7",
        "dlPeriod": "1-32;1;2;3;4;5;6;7;8;9;10;11;12;13;14;15;16;17;18;19;20;21;22;23;24;25;26;27;28;29;30;31;32;",
        "RadioType": "module_list;cyon_reports_list_url;dummy",
        "bGetTimetable": "View+Timetable"
    }
    def __init__(self, response):
        self.soup = BeautifulSoup(response.content, 'html.parser')
        self.courseList = self._courseList()
        self.semList = self._getSems()
    def getBody(self, semseter):
        body = {}
        body.update(self.CONSTANT_PARAMS)
        body['lbWeeks'] = self.semList[semseter-1]
        return body
    def _courseList(self):
        list = []
        select = self.soup.find(id="dlObject")
        for c in select.find_all('option'):
            list.append((c.string, c["value"]))
        return list

    def _getSems(self):
        list = []
        select = self.soup.find(id="lbWeeks")
        for c in select.find_all('option'):
            if c.string == "Semester 1" or c.string == "Semester 2":
                list.append(c["value"])
        return list


def Chunk(coursesPage, chunk):
    max = len(coursesPage.courseList)
    n = 0
    while n + chunk < max:
        s = slice(n, n+chunk)
        yield coursesPage.courseList[s]
        n += chunk
    if n < max:
        s = slice(n, max)
        yield coursesPage.courseList[s]


    