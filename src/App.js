import React, { Component } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import ReactSearchBox from 'react-search-box';

import "./App.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

class App extends Component {
  state = {
    courses: ["Medicine 2"],
    data: [
      {
        key: 'john',
        value: 'John Doe',
      },
      {
        key: 'jane',
        value: 'Jane Doe',
      },
      {
        key: 'mary',
        value: 'Mary Phillips',
      },
      {
        key: 'robert',
        value: 'Robert',
      },
      {
        key: 'karius',
        value: 'Karius',
      }
    ], // fetch("/courses.json").then(res => res.json()),
    events: [
      {
        title: "Medicine 2",
        start: new Date("2020-09-04 09:00:00"),
        end: new Date("2020-09-04 10:00:00")
      }
    ]
  };

  render() {
    return (
      <div className="App">
        <h1 style={{height: "3vh"}}>Unofficial ANU Timetable</h1>
        <ReactSearchBox
          placeholder="Placeholder"
          value="Doe"
          data={this.state.data}
          callback={record => console.log(record)}
          style={{height: "5vh"}}
        />
        <button type="button">Click</button>
        <Calendar
          localizer={localizer}
          formats={{
            dayFormat: (date, culture) => localizer.format(date, 'dddd', culture),
            eventTimeRangeFormat: () => ""
          }}
          events={this.state.events}
          defaultDate={new Date()}
          defaultView='work_week'
          views={['work_week']}
          min={moment().startOf("day").add(9, "hours").toDate()}
          max={moment().startOf("day").add(17, "hours").add(30, "minutes").toDate()}
          style={{ height: "85vh" }}
          onSelectEvent={event => {
            let index = this.state.events.indexOf(event);
            if (index !== -1) {
              this.state.events.splice(index, 1)
            }
          }}
          onRangeChange={range => {
            for (let course of this.state.courses) {
              let start = range[0];
              let end = range[range.length-1];

              fetch(`${process.env.REACT_APP_ENDPOINT}?ModuleDescription=${course
                }&StartTime=${moment(start).format("YYYY-MM-DD")
                }&EndTime=${moment(end).format("YYYY-MM-DD")}`, {
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
                    console.log(res);
                    console.log(this.state.events);
                    let acc = [];
                    for (let e of res.TeachingSessions) {
                      // TODO add faculty or randomised (hash) colours
                      acc.push({
                        title: `${e.moduledescription} ${e.activitytype}`,
                        start: new Date(e.teachingsessionstartdatetime),
                        end: new Date(e.teachingsessionenddatetime)
                      })
                    }
                    this.setState({
                      events: acc,
                      //eventsLoaded: true
                    }
                  )},
                  err => console.error(err)
                )
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
