import FullCalendar, { formatDate } from '@fullcalendar/react'
// Bootstrap 5: support is WIP at fullcalendar/fullcalendar#6625
import bootstrapPlugin from '@fullcalendar/bootstrap'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import iCalendarPlugin from '@fullcalendar/icalendar'
import luxonPlugin from '@fullcalendar/luxon'
import { forwardRef } from 'react'

export default forwardRef((props, ref) => <FullCalendar
  ref={ref}
  plugins={[bootstrapPlugin, dayGridPlugin, timeGridPlugin, listPlugin, iCalendarPlugin, luxonPlugin]}
  themeSystem='bootstrap'
  bootstrapFontAwesome={false}
  //   expandRows={true}
  height={'80vh'}

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
    timeGridDay: {
      titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
    },
    timeGridWeek:{
      weekends: false,
      dayHeaderFormat: { weekday: 'short' }
    },
    listTwoDay: {
      type: 'list',
      duration: { days: 2 },
      buttonText: 'Agenda',
      listDayFormat: { weekday: 'long', month: 'short', day: 'numeric' },
      displayEventTime: true
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
  slotDuration={'01:00:00'}
  scrollTimeReset={false}
  nowIndicator
  navLinks
  // businessHours={{
  //   daysOfWeek: [1, 2, 3, 4, 5],
  //   startTime: '07:00',
  //   endTime: '19:00'
  // }}
  displayEventTime={false}

  eventClick={info => {
    info.jsEvent.preventDefault();
    
    let slot = info.event.id.replace(/\/[0-9]+$/, '')
    ref.current.getApi().getEvents().forEach(event => {
      if (event.id.startsWith(slot) && event.id !== info.event.id) event.remove()
    })
  }}

  eventSourceFailure={err => console.error(err.message)}
/>)