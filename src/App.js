import React, { Component } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, startOfDay, add } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import ReactSearchBox from "react-search-box";
import { IconContext } from "react-icons";
import { RiDeleteBinLine } from "react-icons/ri";
import "./App.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button, ButtonGroup, InputGroup, Col, Row, Container } from "react-bootstrap";
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
    sourceData: JSON.parse(localStorage.getItem('sourceData')) || [],
    modules: JSON.parse(localStorage.getItem('modules')) || [],
    enrolled: JSON.parse(localStorage.getItem('enrolled')) || [],
    events: (JSON.parse(localStorage.getItem('events')) || []).map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end)
    }))
  };

  downloadEvents() {
    let unique = this.state.events.filter((ids => ({ name }) => !ids.has(name) && ids.add(name))(new Set())); // https://stackoverflow.com/a/61016477
    unique = unique.reduce((prev, curr) => {
        const key = `${curr.module}_${curr.session}`
        prev[key] = (prev[key] || []).concat([`${curr.activity} ${curr.occurrence}`])
        return prev
    }, {})
    const qs = Object.keys(unique).map(key => `${key}=${unique[key].join(',')}`).join('&')

    // Create download link
    const element = document.createElement("a");
    element.href = `${process.env.REACT_APP_FUNCTION_API || ''}/api/GetICS?${qs}`;
    const d = new Date();
    // download only works for same-origin URLs, so this doesn't work in debug
    // Function is on a different port to the app
    element.download = `ANU Timetable ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}.ics`;

    // Download file
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
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

    return '#' + "00000".substring(0, 6 - c.length) + c;
  }

  componentDidMount(){
    if (hasInsights) {
      appInsights.loadAppInsights();
      appInsights.trackPageView();
    }

    /*
    timetable.json
    {
      COMP1140_S2: {
        some: data,
        classes: [{
          some: data,
          weeks: "31\u201136,39\u201144"
        }]
      }
    }
    */
    fetch('timetable.json')
      .then(res => res.json())
      .then(res => {
        this.setState({ 
          sourceData: res, 
          modules: Object.values(res).map(module => ({
            key: module.id,
            value: module.id.split('_')[0] + ' ' + module.title.split('\u00a0')[1]
          }))
        })
      })
  }

  updateEvents(sourceData, moduleIds) {
    const events = this.state.events;

    for (let moduleId of moduleIds) {
      const module = sourceData[moduleId];
      if (module) {
        for (let session of module.classes) {
          // repeated weeks are stored as "31\u201136,39\u201144"
          for (let period of session.weeks.split(',')) {
            const weeks = period.split('\u2011');
            // Weeks are 1-indexed, so convert to 0-indexed
            for (let week = weeks[0]-1; week <= weeks[weeks.length-1]-1; week++) {
              const d = new Date();
              // If December, assume events are next year
              const currentYear = d.getMonth() !== 11 ? d.getFullYear() : d.getFullYear() + 1;

              // Days from start of year until first Monday - aka Week 0
              // modulo 7 in case start of year is a Monday
              const daysUntilFirstMonday = nextMonday(new Date(currentYear, 0)).getDay() % 7;
              const day = daysUntilFirstMonday + 7*week + parseInt(session.day) - 4

              events.push({
                ...session,
                title: session.module,
                description: `${session.activity} ${parseInt(session.occurrence)}, ${session.location}`,
                start: new Date(currentYear, 0, day, ...session.start.split(':')),
                end: new Date(currentYear, 0, day, ...session.finish.split(':'))
              })
            }
          }
        }
      }
    }

    this.setState({ events }, () => this.updateLocalStorage());
  }

  deleteModule(module) {
    // Remove a course and all associated events/classes
    let events = [...this.state.events];

    // Get index of first event for this module
    let firstIndex = events.length;
    for (let i = 0; i < events.length; i++) {
      if (module.startsWith(events[i].title)) {
        firstIndex = i;
        break;
      }
    }

    // Delete all events for this module/course
    for (let lastIndex = firstIndex + 1; lastIndex <= events.length; lastIndex++) {
      if (lastIndex === events.length || !module.startsWith(events[lastIndex].title)) {
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

  // Add a course
  addModule(module) {
    if (!this.state.enrolled.includes(module)) {
      const enrolled = [...this.state.enrolled, module];
      this.setState({ enrolled }, this.updateEvents(this.state.sourceData, [module]))
    }
  }

  updateLocalStorage() {
    localStorage.setItem('modules', JSON.stringify(this.state.modules));
    localStorage.setItem('enrolled', JSON.stringify(this.state.enrolled));
    localStorage.setItem('events', JSON.stringify(this.state.events));
  }

  chooseEvent(event) {
    // Choose a time slot for a class
    // This filters out all other interchangeable events
    const id = event.event.description.split(' ')[0];
    let events = this.state.events.filter(target => 
      target.title !== event.title ||
      target.description === event.event.description ||
      target.description.split(' ')[0] !== id
    )
    this.setState({ events }, () => this.updateLocalStorage());
  }

  deleteEvent(event) {
    // Unselect a time slot for a class
    let index = this.state.events.indexOf(event.event);
    if (index !== -1) {
      let start = index;
      for (; this.state.events[start]?.name === event.event.name; start--) {}
      let end = index;
      for (; this.state.events[end]?.name === event.event.name; end++) {}
      this.state.events.splice(start+1, end-start-1);
    }
    this.updateLocalStorage()
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
       <Container fluid>
        <Row>{event.title}</Row>
        <Row>{event.description}</Row>
        <Row><ButtonGroup>
          <Button 
            size="sm" 
            onClick={() => this.chooseEvent(_event)}
          >Choose</Button>
          <Button size="sm" variant="danger" onClick={() => this.deleteEvent(_event)}>Delete</Button>
        </ButtonGroup></Row>
       </Container>
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
                <div><ReactSearchBox
                  autoFocus
                  clearOnSelect
                  placeholder="Enter a course code here (for example LAWS1201)"
                  data={this.state.modules}
                  onSelect={record => this.addModule(record.item.key)}
                  onFocus={() => this.setState({ searchFocused: true })}
                /></div>
              </ClickAwayListener>
            </Col>

            {/* Calendar export */}
            <Col>
              {showICS && (
                <Button onClick={() => {this.downloadEvents()}}
                className='ics-export'>
                Export .ics
                </Button>
              )}
            </Col>
          </InputGroup></Row>

          {/* Calendar view */}
          <Row><Col><Calendar popup
            localizer={localizer}
            events={this.state.events}
            style={{ height: "81vh" }}
            defaultView={window.navigator.userAgent.includes('Mobi') ? 'agenda' : 'work_week'}
            views={['day', 'work_week', 'month', 'agenda']}
            min={add(startOfDay(anuInitialTime), {hours: 8})} max={add(startOfDay(anuInitialTime), {hours: 21})}
            formats={{
              dayFormat: (date, culture) => localizer.format(date, 'EEEE', culture), // days in week/month
              dayHeaderFormat: (date, culture) => localizer.format(date, 'EEEE MMMM dd', culture), // Day view
              agendaDateFormat: (date, culture) => localizer.format(date, 'EEE', culture), // Agenda view
              eventTimeRangeFormat: () => ""
            }}
            // Display descriptive name as tooltip
            tooltipAccessor={event => event.description}

            // Delete on double click
            // onDoubleClickEvent={event => this.deleteEvent(event)}

            components={{
              event: event => {
                const Event = this.Event.bind(this);
                return <Event _event={event} />
              }
            }}

            eventPropGetter={event => ({
              style: {
                backgroundColor: this.intToRGB(this.hashCode(event.title)),
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
