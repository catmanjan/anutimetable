import { useRef, useState, useEffect } from 'react'
import { Container, Navbar } from 'react-bootstrap'

import Toolbar from './Toolbar'
import Calendar from './Calendar'
import { getInitialState, setQueryParam, fetchJsObject, stringToColor, parseEvents } from './utils'

import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ReactPlugin, withAITracking } from '@microsoft/applicationinsights-react-js'

const isDevelopment = process.env.NODE_ENV === 'development'
const API = `${isDevelopment ? 'http://localhost:7071' : window.location.origin}/api`

let App = () => {
  const calendar = useRef()

  // Timezone string, like "Australia/Sydney"
  const [timeZone, setTimeZone] = useState(localStorage.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  useEffect(() => localStorage.timeZone = timeZone, [timeZone])

  const [y, s, m] = getInitialState()

  const [year, setYear] = useState(y)
  useEffect(() => setQueryParam('y', year), [year])

  // Current session (eg "S1" is semester 1)
  const [session, setSession] = useState(s)
  useEffect(() => setQueryParam('s', session), [session])

  // List of all supported sessions
  const [sessions, setSessions] = useState([])
  useEffect(() => fetchJsObject(`${API}/sessions`, setSessions), [])

  // Timetable data as a JS object
  const [timetableData, setTimetableData] = useState({})
  useEffect(() => fetchJsObject(`/timetable_${year}_${session}.json`, setTimetableData), [year, session])

  // Modules (courses) are in an object like { COMP1130: { title: 'COMP1130 Pro...', dates: 'Displaying Dates: ...', link: "" }, ... }
  const processModule = ({classes, id, title, ...module}) => ({ title: title.replace(/_[A-Z][1-9]/, ''), ...module })
  const [modules, setModules] = useState({})
  useEffect(() => setModules(Object.entries(timetableData).reduce((acc, [key, module]) => ({...acc, [key.split('_')[0]]: processModule(module)}),{})),  [timetableData])

  // Selected modules are stored as an *array* of module objects as above, with
  // an additional `id` field that has the key in `modules`
  const [selectedModules, setSelectedModules] = useState(m.map(([id]) => ({ id })))

  // List of events chosen from a list of alternatives globally
  // List of lists like ['COMP1130', 'ComA', 1] (called module, groupId, occurrence)
  const getSpecOccurrences = () => m.flatMap(([module, occurrences]) => occurrences.split(',').flatMap(o => {
    // We're flatMapping so that we can return [] to do nothing and [result] to return a result
    if (!o || !selectedModules.map(({ id }) => id).includes(module)) return []
    const r = o.match(/([^0-9]*)([0-9]+)$/)
    return [[module, r[1], parseInt(r[2])]]
  }))
  const [specifiedOccurrences, setSpecifiedOccurrences] = useState(getSpecOccurrences())
  const updateSpecifiedOccurrences = () => setSpecifiedOccurrences(getSpecOccurrences())

  // Update query string parameters and calendar events whenever anything changes
  useEffect(() => {
    const api = calendar.current.getApi()
    const sources = api.getEventSources()

    // Remove no longer selected modules from the query string
    // Remove all calendar events (we re-add them after)
    const selected = selectedModules.map(({ id }) => id)
    sources.forEach(s => {
      if (!selected.includes(s.id)) {
        const qs = new URLSearchParams(window.location.search)
        qs.delete(s.id) // if no value, just ensure param exists
        window.history.replaceState(null, '', '?'+qs.toString())
      }
      s.remove()
    })

    // Update the query string and the events the calendar receives
    selectedModules.forEach(({ id }) => {
      // Update query string
      setQueryParam(id, specifiedOccurrences.filter(([m]) => m === id).map(([m,groupId,occurrence]) => groupId+occurrence).join(','))

      if (Object.keys(timetableData).length === 0) return

      // What events are currently visible?
      // Basically the module's full list of classes, minus alternatives to chosen options (from the query string)
      const eventsForModule = [...timetableData[`${id}_${session}`].classes]
      for (const [module, groupId, occurrence] of specifiedOccurrences) {
        if (module !== id) continue
        // Delete alternatives to an explicitly chosen event
        for (let i = eventsForModule.length - 1; i >= 0; i--) {
          const event = eventsForModule[i]
          if (event.activity === groupId && parseInt(event.occurrence) !== occurrence) {
            eventsForModule.splice(i, 1)
          }
        }
      }

      // Add currently visible events to the calendar
      api.addEventSource({
        id,
        color: stringToColor(id),
        events: parseEvents(eventsForModule, year, session, id)
      })
    })
  }, [timetableData, year, session, selectedModules, calendar, timeZone, m, modules, specifiedOccurrences])

  // Remove specified events for modules that have been removed
  useEffect(() => {
    updateSpecifiedOccurrences()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModules])

  // We select occurrences by adding them to specifiedOccurrences, which
  // edits the query string in an effect
  const selectOccurrence = (module, groupId, occurrence) => {
    // Eg adding ['COMP1130', 'ComA', 1]
    setSpecifiedOccurrences([...specifiedOccurrences, [module, groupId, occurrence]])
  }
  const resetOccurrence = (module, groupId, occurrence) => {
    setSpecifiedOccurrences(specifiedOccurrences.filter(
      ([m, g, o]) => !(m === module && g === groupId && o === occurrence)
    ))
  }

  const state = {
    timeZone, year, session, sessions, timetableData, modules, selectedModules,
    setTimeZone, setYear, setSession, setSessions, setTimetableData, setModules, setSelectedModules,
    selectOccurrence, resetOccurrence,
  }

  // fluid="xxl" is only supported in Bootstrap 5
  return <Container fluid>
    <h2 className="mt-2">ANU Timetable</h2>

    <Toolbar API={API} ref={calendar} state={state} />

    <Calendar ref={calendar} state={state} />

    <Navbar>
      <Navbar.Text>
          Made with <span role="img" aria-label="love">💖</span> by the&nbsp;
          <a href="https://cssa.club/">ANU CSSA</a>, report issues&nbsp;
          <a href="https://github.com/anucssa/anutimetable/issues">here</a>
      </Navbar.Text>
    </Navbar>
  </Container>
}

// Analytics
if (!isDevelopment) {
  const reactPlugin = new ReactPlugin();
  const appInsights = new ApplicationInsights({
    config: {
      connectionString: process.env.REACT_APP_INSIGHTS_STRING,
      disableFetchTracking: false,
      enableCorsCorrelation: true,
      extensions: [reactPlugin]
    }
  })
  appInsights.loadAppInsights()

  App = withAITracking(reactPlugin, App)
}

export default App