import React, { Component } from "react";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, endOfWeek, getDay, startOfDay, add, sub, isBefore, isAfter } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

import ReactSearchBox from "react-search-box";

import "./App.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

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
    enrolled: [], // fetch("/courses.json").then(res => res.json()),
    events: [{
        title: `MEDI8020A_S1 Lecture`,
        description: "Medicine 2",
        start: zonedTimeToUtc("2021-04-15 09:00:00", anuTimeZone),
        end: zonedTimeToUtc("2021-04-15 10:00:00", anuTimeZone)
    }]
  };

  addEvent(start, end, event) {
    fetch(`${process.env.REACT_APP_ENDPOINT
      }?ModuleName=${event
      }&StartTime=${format(start, "yyyy-MM-dd")
      }&EndTime=${format(end, "yyyy-MM-dd")}`, {
      headers: {
        'accept': 'application/json',
        'authorization': `Basic ${process.env.REACT_APP_AUTH_KEY}`,
        'x-ibm-client-id': process.env.REACT_APP_AUTH_ID,
        'x-api-key': process.env.REACT_APP_DEV_KEY || ''
      }
    })
      .then(res => res.json())
      .then(
        res => {
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

  componentDidMount(){
    console.log(this.state)
    this.addEvents(this.state.cacheStart, this.state.cacheEnd);
  }

  render() {
    return (
      <div className="App">
        <h1 style={{height: "2vh"}}>Unofficial ANU Timetable</h1>


        <ReactSearchBox
          placeholder="Search for a course here" //TODO localise
          data={this.state.modules}
          onSelect={record => {
            let temp = this.state.enrolled
            temp.push(record.key)
            this.setState({
              ...this.state,
              enrolled: temp
            })

            this.addEvent(this.state.cacheStart, this.state.cacheEnd, record.key)
          }}
          style={{height: "5vh"}}
        />
        
        

        <Calendar
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
          onDoubleClickEvent={event => {
            let index = this.state.events.indexOf(event);
            if (index !== -1) {
              this.state.events.splice(index, 1)
            }
          }}

          // Get events in new unloaded range - assumes pagination in only one direction
          onRangeChange={range => {
            console.log(range)
            const newEnd = add(range[range.length-1], {weeks: 1});
            console.log(newEnd)

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
            event: this.customEvent,
            work_week: {
              event: this.customEvent
            }
          }}
        />
        <p style={{height: "2vh"}}>Made with <span role="img" aria-label="love">💖</span> by <a href="https://github.com/pl4nty">Tom Plant</a>, report issues <a href="https://github.com/pl4nty/anutimetable/issues">here</a></p>
      </div>
    );
  }
}

export default App;
