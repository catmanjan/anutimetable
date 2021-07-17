class SessionData:
    def __init__(self, soup):
        self.viewState = soup.find(id='__VIEWSTATE')['value']
        self.viewStateGenerator = soup.find(id='__VIEWSTATEGENERATOR')['value']
        self.eventValidation = soup.find(id='__EVENTVALIDATION')['value']
    def toDict(self):
        return {"__VIEWSTATE": self.viewState, 
            "__VIEWSTATEGENERATOR": self.viewStateGenerator,
            "__EVENTVALIDATION": self.eventValidation}
    def asModuleList(self):
        dic = self.withTargetLinkType("","modules")
        return [(k, v) for k, v in dic.items()]
    def withTargetLinkType(self, target, linktype):
        params = self.toDict()
        params["__EVENTTARGET"] =  target
        params["tLinkType"] =  linktype
        params["__EVENTARGUMENT"] = ""
        return params