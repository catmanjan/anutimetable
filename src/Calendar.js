import { forwardRef } from 'react'

import FullCalendar, { formatDate } from '@fullcalendar/react'
// Bootstrap 5 support is WIP: fullcalendar/fullcalendar#6625
import bootstrapPlugin from '@fullcalendar/bootstrap'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import rrulePlugin from '@fullcalendar/rrule'
import luxonPlugin from '@fullcalendar/luxon'

import { DateTime } from 'luxon'

export const parseEvents = (source, year, session, id, timeZone) => source[`${id}_${session}`].classes.reduce((arr, c) => {
  const location = c.location
  const occurrence = parseInt(c.occurrence)

  const title = [
    c.module,
    c.activity,
    ...(c.activity.startsWith('Lec') ? [] : [occurrence])
  ].join(' ')

  const inclusiveRange = ([start, end]) => Array.from({ length: end-start+1 }, (_, i) => start+i)
  // '1\u20113,5\u20117' (1-3,6-8) => [1,2,3,6,7,8]
  const weeks = c.weeks.split(',').flatMap(w => inclusiveRange(w.split('\u2011').map(x => parseInt(x))))

  const [start, end] = [
    [weeks[0], c.start],
    [weeks[weeks.length-1], c.finish]
  ].map(([week, time]) => DateTime
    .fromFormat(time, 'HH:mm', { zone: 'UTC' })
    .set({ weekYear: year, weekNumber: week, weekday: c.day+1 }) // ANU 0-offset => Luxon 1-offset
  )
  
  // handles timezone across days/weeks, not verified across years
  const rrule = {
    freq: 'weekly',
    dtstart: start.toJSDate(),
    until: end.toJSDate(),
    byweekday: start.weekday-1, // Luxon 1-offset => rrule 0-offset
    byweekno: weeks, // rrule allows RFC violation (compliant byweekno requires freq=YEARLY) 
    tzid: timeZone || 'Australia/Canberra'
  }
  
  arr.push({
    // extendedProps
    ...c,
    occurrence,

    // custom ID allows removal of events that aren't in memory (ie only available by getEventById())
    id: [c.module, c.activity, occurrence].join('_'),
    title,
    groupId: c.activity, // identifies selection groups eg TutA
    location,
    duration: c.duration,
    rrule
  })
  return arr
}, [])

export const selectOccurrence = (ref, module, groupId, occurrence) => {
  const api = ref.current.getApi()

  let event
  let flag = false
  for (let i=occurrence-1; (event=api.getEventById([module,groupId,i].join('_'))); i--) {
    event.remove()
    flag = true
  }

  for (let i=occurrence+1; (event=api.getEventById([module,groupId,i].join('_'))); i++) {
    event.remove()
    flag = true
  }

  // if it's selectable, add to the query string
  if (flag) {
    let qs = new URLSearchParams(window.location.search)
    const current = qs.get(module)

    const val = groupId+occurrence
    if (!current || !current.includes(val)) {
      qs.set(module, current ? `${current},${val}` : val)
      window.history.replaceState(null, '', '?'+qs.toString())
    }
  }
}

const formatEventContent = ({ event }) => {
  // causes a nested <a> in the event
  // fix PR is unmerged since Apr 2021: fullcalendar/fullcalendar#5710
  const { location, locationID, lat, lon } = event.extendedProps
  const url = lat ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}` : locationID
  const locationLine = url
    ? <a href={url} target="_blank" rel="noreferrer">{location}</a>
    : location;
  return <>
    {event.title}<br />
    {locationLine}
  </>
}

const handleEventClick = (ref, info) => {
  // allow links inside event content
  if (info.jsEvent.target.childElementCount !== 0) {
    info.jsEvent?.preventDefault()
    selectOccurrence(ref, info.event.source.id, info.event.groupId, info.event.extendedProps.occurrence)
  }
}

const getStartOfSession = () => {
  const qs = new URLSearchParams(window.location.search)
  const year = qs.get('y'), session = qs.get('s')
  const map = {
    '2022S1': new Date('2022-02-20Z21:00:00'), // 8AM 22 Feb in GMT
  }
  if (map.hasOwnProperty([year + session]))
    return map[year + session]
}

const weekNumberCalculation = date => {
  const startDate = getStartOfSession()
  const start = startDate ? DateTime.fromJSDate(startDate).weekNumber : 0
  const end = DateTime.fromJSDate(date).weekNumber
  return end - start + 1 // 0 weeks after start is week 1
}

export default forwardRef((props, ref) => {
  const customEvents = {
    eventContent: formatEventContent,
    eventClick: info => handleEventClick(ref, info)
  }

  // Set the initial date to max(start of sem, today)
  const startOfSemester = getStartOfSession()
  const initialDate =
    startOfSemester && startOfSemester.getTime() > new Date().getTime()
      ? startOfSemester
      : new Date();

  return <FullCalendar
    ref={ref}
    plugins={[bootstrapPlugin, dayGridPlugin, timeGridPlugin, listPlugin, rrulePlugin, luxonPlugin]}
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
        ...customEvents
      },
      timeGridWeek:{
        weekends: true,
        dayHeaderFormat: { weekday: 'short' },
        ...customEvents
      },
      listTwoDay: {
        type: 'list',
        duration: { days: 2 },
        buttonText: 'Agenda',
        listDayFormat: { weekday: 'long', month: 'short', day: 'numeric' },
        displayEventTime: true,
        weekends: true,
        eventContent: formatEventContent
      },
      dayGridMonth: {
        weekNumberFormat: { week: 'short' }
      }
    }}
    initialView={window.navigator.userAgent.includes('Mobi') ? 'listTwoDay' : 'timeGridWeek'}
    initialDate={initialDate}

    // timeGrid options
    allDaySlot={false}
    // Earliest business hour is 8am AEDT
    scrollTime={formatDate('2020-01-01T08:00+11:00',{
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}
    scrollTimeReset={false}
    slotDuration={'01:00:00'}
    nowIndicator
    navLinks
    // businessHours={{
    //   daysOfWeek: [1, 2, 3, 4, 5],
    //   startTime: '07:00',
    //   endTime: '19:00'
    // }}
    displayEventTime={false}
    defaultAllDay={false} // allDay=false required for non-string rrule inputs (eg Dates) https://github.com/fullcalendar/fullcalendar/issues/6689

    // Week 1 = start of semester
    weekNumbers
    weekNumberCalculation={weekNumberCalculation}
    weekText='Week'

    fixedWeekCount={false}

    eventSourceFailure={err => console.error(err.message)}
  />
})
