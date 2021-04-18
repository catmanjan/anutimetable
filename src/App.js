import React, { Component } from "react";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, endOfWeek, getDay, startOfDay, add, sub, isBefore, isAfter } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

import ReactSearchBox from "react-search-box";

import { IconContext } from 'react-icons';
import { RiDeleteBinLine } from 'react-icons/ri';

import "./App.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { Button, ButtonGroup, InputGroup, Col, Row, Container } from "react-bootstrap";

import { createEvents } from 'ics';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const appInsights = new ApplicationInsights({ config: {
  instrumentationKey: process.env.REACT_APP_INSIGHTS_KEY
} });

const locales = {
    'en-US': require('date-fns/locale/en-US'),
}
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const anuTimeZone = "Australia/Canberra";
const anuInitialTime = utcToZonedTime(new Date(), anuTimeZone);

class App extends Component {
  state = {
    dayStart: add(startOfDay(anuInitialTime), {hours: 9}),
    dayEnd: add(startOfDay(anuInitialTime), {hours: 17, minutes: 30}),
    cacheStart: sub(startOfWeek(anuInitialTime), {weeks: 1}),
    cacheEnd: add(endOfWeek(anuInitialTime), {weeks: 1}),
    modules: [
      {
        key: "MEDI8020A_S1",
        value: "MEDI8020A_S1 - Medicine 2"
      }
    ],
    enrolled: JSON.parse(localStorage.getItem('enrolled')) || [],
    events: [
      {
        title: `MEDI8020A_S1 Workshop`,
        description: "Medicine 2",
        start: zonedTimeToUtc("2021-04-20 09:00:00", anuTimeZone),
        end: zonedTimeToUtc("2021-04-20 10:00:00", anuTimeZone)
      },
      {
        title: `MEDI8020A_S1 Workshop`,
        description: "Medicine 2",
        start: zonedTimeToUtc("2021-04-21 09:00:00", anuTimeZone),
        end: zonedTimeToUtc("2021-04-21 10:00:00", anuTimeZone)
      },
      {
        title: `MEDI8020A_S1 Lecture`,
        description: "Medicine 2",
        start: zonedTimeToUtc("2021-04-22 09:00:00", anuTimeZone),
        end: zonedTimeToUtc("2021-04-22 10:00:00", anuTimeZone)
      }
    ],
    icalEndDate: add(endOfWeek(anuInitialTime), {weeks: 1})
  };

  addEvent(start, end, event) {
    fetch(`${process.env.REACT_APP_ENDPOINT
      }?ModuleName=${event
      }&StartTime=${format(start, "yyyy-MM-dd")
      }&EndTime=${format(end, "yyyy-MM-dd")}`, {
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${process.env.REACT_APP_AUTH_KEY}`,
        'x-ibm-client-id': process.env.REACT_APP_AUTH_ID
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Timetable API request failed')
        } else {
          res.json()
        }})
      .then(
        res => {
          console.log(res)
          // Map and concat in one iteration for speed
          let acc = this.state.events;
          for (let session of res.TeachingSessions) {
            // TODO add faculty or randomised (hash) colours
            acc.push({
              title: `${session.modulename} ${session.activitytype}`,
              description: session.moduledescription,
              start: utcToZonedTime(new Date(session.teachingsessionstartdatetime), anuTimeZone),
              end: utcToZonedTime(new Date(session.teachingsessionenddatetime), anuTimeZone)
            })
          }

          this.setState({
            events: acc
          }
        )},
        err => console.error(err)
      )
  }

  addEvents(start, end) {
    for (let module of this.state.enrolled) {
      this.addEvent(start, end, module)
    }
  }

  downloadEvents() {
    if (this.state.icalEndDate) {
      this.addEvents(this.state.cacheEnd, this.state.icalEndDate)
    }

    const element = document.createElement("a");
    const file = new Blob([createEvents(this.state.events)], {type: 'text/calendar'});
    element.href = URL.createObjectURL(file);
    const d = new Date();
    element.download = `ANU Timetable ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}.ics`;
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

      return "00000".substring(0, 6 - c.length) + c;
  }

  componentDidMount(){
    appInsights.loadAppInsights();
    appInsights.trackPageView();

    this.addEvents(this.state.cacheStart, this.state.cacheEnd);
  }

  render() {
    return (
      <div className="App">
        <Container fluid>
          <Row><Col><h1>Unofficial ANU Timetable</h1></Col></Row>

          <Row>
            <Col md='auto'><i>Courses chosen: {this.state.enrolled.length === 0 ? 'None.' : ''}</i></Col>
            <IconContext.Provider value={{ color: "red", size: "1.5em" }}>
              {this.state.enrolled.map(module => <Col md='auto' key={module}><i>{module}</i> <RiDeleteBinLine onClick={()=>{
                let temp = this.state.events;

                let firstIndex = null
                temp.some((event, i) => {
                  return event.title.startsWith(module) ? ((firstIndex = i), true) : false;
                });
                
                if (firstIndex !== null) {
                  for (let lastIndex=firstIndex+1; lastIndex<=temp.length; lastIndex++) {
                    if (lastIndex === temp.length || !temp[lastIndex].title.startsWith(module)) {
                      temp.splice(firstIndex, lastIndex-firstIndex)
                      this.setState({
                        ...this.state,
                        enrolled: temp
                      })
                      break
                    }
                  }
                }

                let index = this.state.enrolled.indexOf(module);
                if (index !== -1) {
                  let temp = this.state.enrolled
                  temp.splice(index, 1)
                  this.setState({
                    ...this.state,
                    enrolled: temp
                  })
                }

                localStorage.setItem('enrolled', JSON.stringify(this.state.enrolled))
              }}/></Col>)}
            </IconContext.Provider>
          </Row>
          
          <Row><InputGroup>
            <Col xs md="8" lg="7" xl="5"><ReactSearchBox
              autoFocus
              placeholder="Enter a course code here (for example LAWS1201)" //TODO localise
              data={this.state.modules}
              value={this.state.searchVal}
              onSelect={record => {
                let temp = this.state.enrolled
                temp.push(record.key)

                this.setState({
                  ...this.state,
                  enrolled: temp
                })
                localStorage.setItem('enrolled', JSON.stringify(temp))

                this.addEvent(this.state.cacheStart, this.state.cacheEnd, record.key)
              }}
              // style={{height: "5vh"}} TODO UI to select desired export range 
            /></Col>
            <Col>{this.state.enrolled.length !== 0 ? <ButtonGroup>
              <DatePicker selected={this.state.icalEndDate} onChange={icalEndDate => this.setState({...this.state, icalEndDate})} />
              <Button onClick={() => {this.downloadEvents()}}>Export .ics</Button>
            </ButtonGroup>: ''}</Col>
          </InputGroup></Row>

          <Row><Col><Calendar
            localizer={localizer}
            popup={true}
            events={this.state.events}
            style={{ height: "85vh" }}
            defaultView='work_week'
            views={['work_week']}
            min={this.state.dayStart}
            max={this.state.dayEnd}
            formats={{
              dayFormat: (date, culture) => localizer.format(date, 'EEEE', culture),
              eventTimeRangeFormat: () => ""
            }}

            // Display descriptive name as tooltip
            tooltipAccessor={event => event.description}

            // Delete on double click
            // onDoubleClickEvent={event => {
            //   let index = this.state.events.indexOf(event);
            //   if (index !== -1) {
            //     this.state.events.splice(index, 1)
            //   }
            // }}

            // Get events in new unloaded range - assumes pagination in only one direction
            onRangeChange={range => {
              const newEnd = add(range[range.length-1], {weeks: 1});

              if (isAfter(newEnd, this.state.cacheEnd)) {
                this.addEvents(this.state.cacheEnd, newEnd)
                this.setState({
                  ...this.state,
                  cacheEnd: newEnd
                })
              } else {
                const newStart = sub(range[0], {weeks: 1});

                if (isBefore(newStart, this.state.cacheStart)) {
                  this.addEvents(newStart, this.state.cacheStart)
                  this.setState({
                    ...this.state,
                    cacheStart: newStart
                  })
                } 
              }
            }}

            components={{
              // TODO prettier faculty-based colours (_drama_)? Also hash could cause black on black and other problems
              event: event => <div>
                {event.title}<br></br><br></br><ButtonGroup>
                  {!event.title.endsWith('Lecture') ? <Button size="sm" onClick={() => {
                    let temp = this.state.events.filter(target => target.title !== event.title)
                    temp.push(event.event)

                    this.setState({
                      ...this.state,
                      events: temp
                    })
                  }}>Choose</Button> : ''}
                  <Button size="sm" variant="danger" onClick={() => {
                    let index = this.state.events.indexOf(event.event);
                    if (index !== -1) {
                      this.state.events.splice(index, 1)
                    }
                  }}>Delete</Button>
                </ButtonGroup>
              </div>
            }}

            eventPropGetter={event => ({
              style: {
                backgroundColor: `#${this.intToRGB(this.hashCode(event.title))}`,
                border: '1px solid black'
              }
            })}
          /></Col></Row>
          
          <Row><Col><footer style={{textAlign: "center"}}>
            Made with <span role="img" aria-label="love">💖</span> by <a href="https://github.com/pl4nty">
              Tom Plant
            </a>, report issues <a href="https://github.com/pl4nty/anutimetable/issues">here</a>
          </footer></Col></Row>
        </Container>
      </div>
    );
  }
}

export default App;
