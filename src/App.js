import React, { Component } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, endOfWeek, getDay, startOfDay, add, sub, isBefore, isAfter } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import ReactSearchBox from "react-search-box";
import { IconContext } from "react-icons";
import { RiDeleteBinLine } from "react-icons/ri";
import "./App.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button, ButtonGroup, InputGroup, Col, Row, Container } from "react-bootstrap";
import * as ics from "ics";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactPlugin, withAITracking } from "@microsoft/applicationinsights-react-js";
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import {nextMonday} from 'date-fns';

let reactPlugin, appInsights;
const hasInsights = process.env.NODE_ENV !== 'development';
if (hasInsights) {
  reactPlugin = new ReactPlugin();
  appInsights = new ApplicationInsights({
    config: {
      connectionString: process.env.REACT_APP_INSIGHTS_STRING,
      disableFetchTracking: false,
      enableCorsCorrelation: true,
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true,
      extensions: [reactPlugin]
    }
  });
}

const locales = {
  'en-US': require('date-fns/locale/en-US'),
}
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales
});

const anuTimeZone = "Australia/Canberra";
const anuInitialTime = utcToZonedTime(new Date(), anuTimeZone);

function ClassTag({ module, deleteModule, title }) {
  let under = module.indexOf('_');
  const displayModule = module.substring(0, under > 0 ? under : module.length);
  return (
    <Col md='auto' key={module} className='class-tag'>
      <span title={title}>{displayModule}</span>
      <RiDeleteBinLine onClick={deleteModule} />
    </Col>
  );
}

class App extends Component {
  state = {
    dayStart: add(startOfDay(anuInitialTime), {hours: 9}),
    dayEnd: add(startOfDay(anuInitialTime), {hours: 17, minutes: 30}),
    cacheStart: sub(startOfWeek(anuInitialTime), {weeks: 1}),
    cacheEnd: add(endOfWeek(anuInitialTime), {weeks: 1}),
    modules: [],
    enrolled: JSON.parse(localStorage.getItem('enrolled')) || [],
    events: (JSON.parse(localStorage.getItem('events')) || []).map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    })),
    icalEndDate: add(endOfWeek(anuInitialTime), {weeks: 1})
  };

  addEvent(start, end, event) {
    fetch(`/api/ClassSchedules?name=${event
        }&start=${format(start, "yyyy-MM-dd")
        }&end=${format(end, "yyyy-MM-dd")}`
    ).then(res => {
        if (!res.ok) {
          try {
            return res.json();
          } catch (e) {
            throw new Error('Timetable API invalid response. Try starting the function emulator with func start.')
          }
        } else throw new Error('Timetable API request failed.')
      })
      .then(
        res => {
          if (res.TeachingSessions) {
            let events = [...this.state.events];
            for (let session of res.TeachingSessions) {
              // TODO add faculty or randomised (hash) colours
              events.push({
                title: `${session.modulename} ${session.activitytype}`,
                description: session.moduledescription,
                start: utcToZonedTime(new Date(session.teachingsessionstartdatetime), anuTimeZone),
                end: utcToZonedTime(new Date(session.teachingsessionenddatetime), anuTimeZone)
              })
            }
            this.setState({ events });
          }
        },
        err => console.error(err)
      )
  }

  addEvents(start, end) {
    for (let module of this.state.enrolled) {
      this.addEvent(start, end, module);
    }
  }

  downloadEvents() {
    if (this.state.icalEndDate) {
      this.addEvents(this.state.cacheEnd, this.state.icalEndDate)
    }

    const element = document.createElement("a");
    const { value } = ics.createEvents(this.state.events.map(event => ({
      ...event,
      start: format(event.start, 'y,M,d,H,m,s').split(',').map(Number),
      end: format(event.end, 'y,M,d,H,m,s').split(',').map(Number)
    })))
    const file = new Blob([value], {type: 'text/calendar'});
    element.href = URL.createObjectURL(file);
    const d = new Date();
    element.download = `ANU Timetable ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}.ics`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  eventColor(event) {
    // TODO prettier faculty-based colours (_drama_)? Also hash could cause black on black and other problems
    return "#" + this.intToRGB(this.hashCode(event.title));
  }
  // https://stackoverflow.com/a/3426956/
  hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }
  intToRGB(i){
    var c = (i & 0x00FFFFFF)
      .toString(16)
      .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
  }

  componentDidMount(){
    if (hasInsights) {
      appInsights.loadAppInsights();
      appInsights.trackPageView();
    }

    fetch('./timetable.json')
      .then(res => res.json())
      .then(res => {
        this.setState(this.processScrapedJSON(res))
      })

    this.addEvents(this.state.cacheStart, this.state.cacheEnd);
  }

  keyValArrayToDict(arr) {
    let obj = {};
    for (let x of arr) {
      obj[x.key] = x.value;
    }
    return obj;
  }

  processScrapedJSON(rawData) {
    let modules = [];
    let modulesDict = {};
    rawData[0].forEach(x => {
      const key = x.split('\xa0')[0];
      const value = x.replace('\xa0', ' ')
      modules.push({ key, value })
      modulesDict[key] = value
    })
    // Source: https://github.com/catmanjan/anutimetable/blob/ea9a68e12ab2993bfaeb9e7fee48d9756d47dab9/js/timetable.js#L563
    const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    rawData[3].forEach((course, i) => {
      rawData[3][i].fullName = rawData[0][course.nid];
      // eslint-disable-next-line
      rawData[3][i].info = rawData[1][course.iid].replace(/(\s|([^\d]))(0+)/g, '$2').replace('/', ' / ');
      rawData[3][i].location = rawData[2][course.lid];
      // eslint-disable-next-line
      rawData[3][i].name = rawData[3][i].fullName.match(/^([\sa-zA-Z0-9\(\)\/-]+)_.+?\s(.+)/)[1];
      rawData[3][i].dayName = parseInt(course.day) !== course.day ? course.day : weekdays[course.day]; // update transition detection
      delete rawData[3][i].nid;
      delete rawData[3][i].iid;
      delete rawData[3][i].lid;
    });
    return {modules, modulesDict, data: rawData[3] };
  }

  range(lower, upper) {
    // generates a range INCLUDING the upper bound
    return Array.from(new Array(upper - lower + 1), (x, i) => i + lower);
  }

  getCurrentEvents() {
    // gets the events for use by react big calendar
    // this is a list of { title: string, start: Date, end: Date, description: string }
    // this.state.data
    if (!this.state.data) return []
    const events = this.state.events;
    // don't ask. won't work every 7th year on average
    // also it assumes day 0 is monday in local time
    let daysToFirstMon = nextMonday(new Date(new Date().getFullYear(), 0)).getDay();
    for (let session of this.state.data) {
      let course = session.fullName.split('\xa0')[0]; // eg "ACST4032_S2"
      if (this.state.enrolled.indexOf(course) !== -1) {
        // session.weeks might look like "31‑36,39‑44"
        let weeks = session.weeks.split(',').flatMap(range => {
          const [lower, upper] = range.split('\u2011').map(x => parseInt(x))
          if (!upper) return [lower]
          return this.range(lower, upper)
        })
        for (let week of weeks) {
          events.push({
            title: course,
            description: session.info + ', ' + session.location,
            start: new Date(new Date().getFullYear(), 0, 7 * week + daysToFirstMon, session.start),
            end: new Date(new Date().getFullYear(), 0, 7 * week + daysToFirstMon, session.start+session.dur),
          })
        }
      }
    }
    this.setState({ events })
    this.updateLocalStorage();
  }

  deleteModule(module) {
    // Remove a course and all associated events/classes
    let events = [...this.state.events];

    // Get index of first event for this module
    let firstIndex = events.length;
    for (let i = 0; i < events.length; i++) {
      if (events[i].title.startsWith(module)) {
        firstIndex = i;
        break;
      }
    }

    // Delete all events for this module/course
    for (let lastIndex = firstIndex + 1; lastIndex <= events.length; lastIndex++) {
      if (lastIndex === events.length || !events[lastIndex].title.startsWith(module)) {
        events.splice(firstIndex, lastIndex - firstIndex);
        this.setState({ events });
        break;
      }
    }

    // Delete this course from the course list
    let index = this.state.enrolled.indexOf(module);
    if (index !== -1) {
      let enrolled = [...this.state.enrolled];
      enrolled.splice(index, 1);
      this.setState({ enrolled }, () => this.updateLocalStorage());
    }
  }

  addModule(module) {
    // Add a course
    this.setState({ enrolled: [...this.state.enrolled, module] }, () => {
      this.updateLocalStorage();
      this.addEvent(this.state.cacheStart, this.state.cacheEnd, module);
      this.getCurrentEvents();
    });
  }

  updateLocalStorage() {
    localStorage.setItem('enrolled', JSON.stringify(this.state.enrolled));
    localStorage.setItem('events', JSON.stringify(this.state.events));
  }

  rangeChanged(range) {
    // Calendar view date bounds changed, update cache
    const newEnd = add(range[range.length - 1], { weeks: 1 });

    if (isAfter(newEnd, this.state.cacheEnd)) {
      this.addEvents(this.state.cacheEnd, newEnd);
      this.setState({
        cacheEnd: newEnd
      });
    } else {
      const newStart = sub(range[0], { weeks: 1 });

      if (isBefore(newStart, this.state.cacheStart)) {
        this.addEvents(newStart, this.state.cacheStart);
        this.setState({
          cacheStart: newStart
        });
      }
    }
  }

  chooseEvent(event) {
    // Choose a time slot for a class
    // This filters out all other interchangeable events
    const id = event.event.description.split(' ')[0];
    let events = this.state.events.filter(target => target.title !== event.title || target.description === event.event.description || target.description.split(' ')[0] !== id)
    this.setState({ events }, () => this.updateLocalStorage());
  }

  deleteEvent(event) {
    // Unselect a time slot for a class
    let index = this.state.events.indexOf(event.event);
    if (index !== -1) {
      this.state.events.splice(index, 1)
    }
    this.updateLocalStorage();
  }

  getModuleName(module) {
    // getModuleName("CHEM3013_S2") gives the full module name
    if (this.state.modulesDict) {
      return this.state.modulesDict[module];
    }
  }

  Event({ _event }) {
    const event = _event.event;
    return (
      <div>
        {event.title}<br/>
        {event.description}
        <ButtonGroup>
          <Button size="sm" onClick={() => this.chooseEvent(_event)}>Choose</Button>
          <Button size="sm" variant="danger" onClick={() => this.deleteEvent(_event)}>Delete</Button>
        </ButtonGroup>
      </div>
    );
  }

  render() {
    const hasCourses = this.state.enrolled.length !== 0;
    const showICS = hasCourses && this.state.events.length > 0;
    return (
      <div className="App">
        <Container fluid>
          <Row><Col><h1 className='title'>Unofficial ANU Timetable</h1></Col></Row>

          {/* Current course list */}
          <Row style={{padding: "0 16px"}}>
            <Col md='auto' className='courses-chosen' style={{padding:0}}>Courses chosen: {hasCourses ? '' : 'None.'}</Col>
            <IconContext.Provider value={{ color: "red", size: "1.5em" }}>
              {this.state.enrolled.map(module =>
                <ClassTag module={module} deleteModule={() => this.deleteModule(module)}
                  title={this.getModuleName(module)} key={module} />
              )}
            </IconContext.Provider>
          </Row>

          <Row><InputGroup>
            {/* Course search */}
            <Col xs md="8" lg="7" xl="5" className={'search-container ' + (!this.state.searchFocused ? 'empty' : '')}>
              <ClickAwayListener onClickAway={() => this.setState({ searchFocused: false })}>
                <ReactSearchBox
                  autoFocus
                  placeholder="Enter a course code here (for example LAWS1201)"
                  data={this.state.modules}
                  value={this.state.searchVal}
                  onSelect={record => {
                    this.addModule(record.key);
                  }}
                  onFocus={() => this.setState({ searchFocused: true })}
                />
              </ClickAwayListener>
            </Col>

            {/* Calendar export */}
            <Col>
              <ButtonGroup>
                <DatePicker selected={this.state.icalEndDate}
                  onChange={icalEndDate => this.setState({ icalEndDate })}
                  className={'date-picker ' + (!showICS ? 'full' : '')} />
                {showICS && (
                <Button onClick={() => {this.downloadEvents()}}
                  className='ics-export'>
                  Export .ics
                </Button>
                )}
              </ButtonGroup>
            </Col>
          </InputGroup></Row>

          {/* Calendar view */}
          <Row><Col><Calendar popup
            localizer={localizer}
            events={this.state.events}
            style={{ height: "85vh" }}
            defaultView='work_week' views={['work_week', 'month', 'day']}
            min={this.state.dayStart} max={this.state.dayEnd}
            formats={{
              dayFormat: (date, culture) => localizer.format(date, 'EEEE', culture),
              eventTimeRangeFormat: () => ""
            }}
            // Display descriptive name as tooltip
            tooltipAccessor={event => event.description}

            // Delete on double click
            // onDoubleClickEvent={event => this.deleteEvent(event)}

            // Get events in new unloaded range - assumes pagination in only one direction
            onRangeChange={this.rangeChanged.bind(this)}

            components={{
              event: event => {
                const Event = this.Event.bind(this);
                return <Event _event={event} />
              }
            }}

            eventPropGetter={event => ({
              style: {
                backgroundColor: this.eventColor(event),
                border: '1px solid black'
              }
            })}
          /></Col></Row>

          {/* Footer */}
          <Row><Col><footer style={{textAlign: "center"}}>
            Made with <span role="img" aria-label="love">💖</span> by the&nbsp;
            <a href="https://cssa.club/">ANU CSSA</a>, report issues&nbsp;
            <a href="https://github.com/pl4nty/anutimetable/issues">here</a>
          </footer></Col></Row>
        </Container>
      </div>
    );
  }
}

export default hasInsights ? withAITracking(reactPlugin, App) : App;
