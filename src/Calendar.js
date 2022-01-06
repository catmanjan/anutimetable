import FullCalendar, { formatDate, parseEventDef } from '@fullcalendar/react'
// Bootstrap 5: support is WIP at fullcalendar/fullcalendar#6625
import bootstrapPlugin from '@fullcalendar/bootstrap'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import iCalendarPlugin from '@fullcalendar/icalendar'
import { forwardRef, useEffect } from 'react'

const INITIAL_EVENTS = [
  {
    id: 2,
    title: 'Timed event',
    start: new Date().toISOString().replace(/T.*$/, '') + 'T12:00:00'
  }
]

export default forwardRef((props, ref) => {
  
  useEffect(() => {
    let api = ref.current.getApi()
    // api.scrollToTime(formatDate('2020-01-01T08:00+11:00',{
    //     hour: '2-digit',
    //     minute: '2-digit',
    //     second: '2-digit'
    // }))
  })
  
  return <FullCalendar
    ref={ref}
    plugins={[bootstrapPlugin, dayGridPlugin, timeGridPlugin, listPlugin, iCalendarPlugin]}
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
      
      let slot = info.event.id.replace(/ [0-9]+$/, '')
      const ev = ref.current.getApi().getEvents()
      console.log(ev)
      ev.forEach(event => {
        if (event.id.startsWith(slot) && event.id !== info.event.id) event.remove()
      })
      
      // if (info.event.url) {
      //   window.open(info.event.url);
      // }
    }}
    eventRemove={(event, related) => console.log(event, related)}
    
    initialEvents={INITIAL_EVENTS}
    eventSourceFailure={err => console.error(err.message)}
  />
})