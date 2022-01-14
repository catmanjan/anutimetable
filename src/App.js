import { useRef, useState, useEffect } from 'react'
import { Container, Navbar } from 'react-bootstrap'

import Toolbar from './Toolbar'
import Calendar from './Calendar'
import { getInitialState, setQueryParam, getTimetableApi, stringToColor, parseEvents, selectOccurrence } from './utils'

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
  getTimetableApi(`${API}/sessions`, setSessions)

  // Timetable JSON as a JS object
  const [JSON, setJSON] = useState({})
  useEffect(() => getTimetableApi(`/timetable_${year}_${session}.json`, setJSON), [year, session])

  // Modules (courses) are in an object like { COMP1130: { title: 'COMP1130 Pro...', dates: 'Displaying Dates: ...', link: "" }, ... }
  const processModule = ({classes, id, title, ...module}) => ({ title: title.replace(/_[A-Z][1-9]/, ''), ...module })
  const [modules, setModules] = useState({})
  useEffect(() => setModules(Object.entries(JSON).reduce((acc, [key, module]) => ({...acc, [key.split('_')[0]]: processModule(module)}),{})),  [JSON])

  // Selected modules are stored as an *array* of module objects as above, with
  // an additional `id` field that has the key in `modules`
  const [selectedModules, setSelectedModules] = useState(m.map(([id]) => ({ id })))

  // Update query string parameters
  useEffect(() => {
    const api = calendar.current.getApi()
    const sources = api.getEventSources()

    // Remove no longer selected modules from the query string
    const selected = selectedModules.map(({ id }) => id)
    sources.forEach(s => {
      if (!selected.includes(s.id)) {
        const qs = new URLSearchParams(window.location.search)
        qs.delete(s.id) // if no value, just ensure param exists
        window.history.replaceState(null, '', '?'+qs.toString())
      }
      s.remove()
    })

    // List of events chosen from a list of alternatives globally
    // List of lists like ['COMP1130', 'ComA', 1]
    const specifiedOccurrences = m.flatMap(([module, occurrences]) => occurrences.split(',').flatMap(o => {
      // We're flatMapping so that we can return [] to do nothing and [result] to return a result
      if (!o || !selectedModules.map(({ id }) => id).includes(module)) return []
      const r = o.match(/([^0-9]*)([0-9]+)$/)
      return [[module, r[1], parseInt(r[2])]]
    }))

    // Add newly selected modules to the query string
    selectedModules.forEach(({ id }) => {
      setQueryParam(id)

      if (Object.keys(JSON).length === 0) return

      // What events are currently visible?
      // Basically the module's full list of classes, minus alternatives to chosen options (from the query string)
      const eventsForModule = JSON[`${id}_${session}`].classes
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

      api.addEventSource({
        id,
        color: stringToColor(id),
        events: parseEvents(eventsForModule, year, session, id)
      })
    })
  }, [JSON, year, session, selectedModules, calendar, timeZone, m, modules])

  // Updates selected occurrences (eg lab times) when a course is added/removed
  useEffect(() => {
    m.forEach(([module, occurrences]) => occurrences.split(',').forEach(o => {
      if (!o || !selectedModules.map(({ id }) => id).includes(module)) return
      const r = o.match(/([^0-9]*)([0-9]+)$/)
      // Example: selectOccurrence(calendar, 'COMP1130', 'ComA', 1)
      selectOccurrence(calendar, module, r[1], parseInt(r[2]))
    }))
  }, [m, selectedModules, calendar])

  const state = {
    timeZone, year, session, sessions, JSON, modules, selectedModules,
    setTimeZone, setYear, setSession, setSessions, setJSON, setModules, setSelectedModules,
  }

  // fluid="xxl" is only supported in Bootstrap 5
  return <Container fluid>
    <h2 className="mt-2">ANU Timetable</h2>

    <Toolbar API={API} ref={calendar} state={state} />

    <Calendar API={API} ref={calendar} state={state} />

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