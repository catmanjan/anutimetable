import FullCalendar, { formatDate } from '@fullcalendar/react'
// Bootstrap 5: support is WIP at fullcalendar/fullcalendar#6625
import bootstrapPlugin from '@fullcalendar/bootstrap'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import iCalendarPlugin from '@fullcalendar/icalendar'
import { forwardRef } from 'react'

const INITIAL_EVENTS = [
    {
      id: 2,
      title: 'Timed event',
      start: new Date().toISOString().replace(/T.*$/, '') + 'T12:00:00'
    }
]

export default forwardRef((props, ref) => <FullCalendar
  ref={ref}
  plugins={[bootstrapPlugin, dayGridPlugin, timeGridPlugin, listPlugin, iCalendarPlugin]}
  themeSystem='bootstrap'
  bootstrapFontAwesome={false}
  expandRows={true}
  height={'33em'}

  headerToolbar={{
    start: 'prev,next',
    center: 'title',
    end: 'timeGridDay,timeGridWeek,dayGridMonth,listTwoDay'
  }}
  buttonText={{
    today: 'Today',
    prev: 'Back',
    next: 'Next',
    day: 'Day',
    week: 'Week',
    month: 'Month'
  }}

  views={{
    timeGridWeek:{
      weekends: true // default, could hide
    },
    listTwoDay: {
      type: 'list',
      duration: { days: 2 },
      buttonText: 'Agenda'
    }
  }}
  initialView={window.navigator.userAgent.includes('Mobi') ? 'listTwoDay' : 'timeGridWeek'}
  
  // timeGrid options
  allDaySlot={false}
  // Earliest business hour is 8am AEDT
  scrollTime={formatDate('2020-01-01T08:00+11:00',{
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}
  scrollTimeReset={false}
  // businessHours={{
  //   daysOfWeek: [1, 2, 3, 4, 5],
  //   startTime: '07:00',
  //   endTime: '19:00'
  // }}

  initialEvents={INITIAL_EVENTS}
  eventSourceFailure={err => console.error(err.message)}
/>)