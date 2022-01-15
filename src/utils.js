
import { DateTime } from 'luxon'

// Generates an HSL colour with enough contrast to display white text
// https://stackoverflow.com/a/21682946
// The colour text contrast has been tested here: https://codepen.io/OliverBalfour/pen/YzrRoXJ
export const stringToColor = str => {
  // Like Java's String#hashCode. Generates a signed hash number
  function getHashCode(str) {
    var hash = 0;
    if (str.length === 0) return hash;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
  function intToHSL(int) {
    var shortened = int % 360;
    return "hsl(" + shortened + ",100%,30%)";
  }
  return intToHSL(getHashCode(str))
}

// hardcode to semester 1 or 2 as users usually want them
// allows app to function even if /sessions endpoint is down
export const getInitialState = () => {
  const qs = new URLSearchParams(window.location.search)
  let year = qs.get('y')
  let session = qs.get('s')

  let now = new Date()
  if (!session) {
    let month = now.getMonth()

    // If semester 2 complete (after Sept), default to next year
    if (!year && month > 9) {
      year = now.getFullYear()+1
      session = 'S1'
    } else {
      session = month < 5 ? 'S1' : 'S2'
    }
  }

  qs.delete('y')
  qs.delete('s')

  return [year || now.getFullYear(), session, Array.from(qs.entries()) || []]
}

export const setQueryParam = (param, value) => {
  const qs = new URLSearchParams(window.location.search)
  qs.set(param, value ?? qs.get(param) ?? '') // if no value, just ensure param exists
  window.history.replaceState(null, '', '?'+qs.toString())
}

export const getStartOfSession = () => {
  const [year, session] = getInitialState()
  return {
    '2022S1': new Date('2022-02-19Z21:00:00'), // 8AM 21 Feb in GMT
  }?.[year + session]
}

export const fetchJsObject = (path, callback) => {
  try {
    fetch(path).then(res => {
      if (!res.ok) return
      else res.json().then(json => callback(json))
    })
  } catch (err) {
    console.error(err)
  }
}

// Creates a list of event objects the calendar can consume
// One for each lecture/lab time/etc. for a given course and session
// These events have a recurrence rule (rrule) so one event object in the returned
// list may represent several events recurring at the same time each week
export const parseEvents = (classes, year, session, id /* course code */) => {
  const activitiesWithMultipleOccurrences = classes.map(c => c.activity).filter((e, i, a) => a.indexOf(e) !== i && a.lastIndexOf(e) === i)
return classes.map(c => {
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
    tzid: 'Australia/Canberra'
  }
  
  return {
    // extendedProps
    ...c,
    occurrence,
    hasMultipleOccurrences: activitiesWithMultipleOccurrences.indexOf(c.activity) !== -1,

    // custom ID allows removal of events that aren't in memory (ie only available by getEventById())
    id: [c.module, c.activity, occurrence].join('_'),
    title,
    groupId: c.activity, // identifies selection groups eg TutA
    location,
    duration: c.duration,
    rrule
  }
})
}
