import React, { Component } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import ReactSearchBox from 'react-search-box';

import "./App.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

class App extends Component {
  state = {
    cacheStart: moment().endOf('week'),
    cacheEnd: moment().startOf('week'),
    modules: [
      {
        key: "MEDI8020A_S1",
        value: "MEDI8020A_S1 - Medicine 2"
      }
    ], // fetch("/courses.json").then(res => res.json()),
    events: []
  };

  updateEvents(start, end) {
    for (let module of this.state.modules) {
      fetch(`${process.env.REACT_APP_ENDPOINT
        }?ModuleName=${module.key
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
            // Map and concat in one iteration for speed
            let acc = this.state.events;
            for (let session of res.TeachingSessions) {
              // TODO add faculty or randomised (hash) colours
              acc.push({
                title: `${session.modulename} ${session.activitytype}`,
                tooltipAccessor: event => "blah", //session.moduledescription
                start: moment(session.teachingsessionstartdatetime).toDate(),
                end: moment(session.teachingsessionenddatetime).toDate()
              })
            }

            this.setState({
              events: acc
            }
          )},
          err => console.error(err)
        )
    }
  }

  componentDidMount(){
    this.updateEvents(this.state.cacheStart, this.state.cacheEnd);
  }

  render() {
    return (
      <div className="App">
        <h1 style={{height: "3vh"}}>Unofficial ANU Timetable</h1>
        <ReactSearchBox
          placeholder="Search for a course here" //TODO localise
          data={this.state.modules}
          callback={record => console.log(record)}
          style={{height: "5vh"}}
        />
        <button type="button">Click</button>

        <Calendar
          localizer={localizer}
          popup={true}
          events={this.state.events}
          style={{ height: "85vh" }}
          defaultView='work_week'
          views={['work_week']}
          min={moment().startOf("day").add(9, "hours").toDate()}
          max={moment().startOf("day").add(17, "hours").add(30, "minutes").toDate()}
          formats={{
            dayFormat: (date, culture) => localizer.format(date, 'dddd', culture),
            eventTimeRangeFormat: () => ""
          }}

          // Delete on double click
          onDoubleClickEvent={event => {
            let index = this.state.events.indexOf(event);
            if (index !== -1) {
              this.state.events.splice(index, 1)
            }
          }}

          // Get events in new unloaded range
          onRangeChange={range => {
            let start = moment.min([this.state.cacheStart, moment(range[0]).subtract(1, 'week')]);
            let end = moment.max([this.state.cacheEnd, moment(range[range.length-1]).add(1, 'week')]);

            if (end !== this.state.cacheEnd || start !== this.state.cacheStart) {
              this.setState({
                ...this.state,
                cacheStart: start,
                cacheEnd: end
              })
  
              this.updateEvents(start, end);
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
