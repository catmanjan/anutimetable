import { useRef, useState, useEffect } from 'react'
import { Container, Navbar } from 'react-bootstrap'

import Toolbar from './Toolbar'
import Calendar from './Calendar'
import { getInitialState, setQueryParam, getApi, stringToColor, parseEvents, selectOccurrence } from './utils'

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
  getApi(`${API}/sessions`, setSessions)

  // Timetable JSON as a JS object
  const [JSON, setJSON] = useState({})
  useEffect(() => getApi(`/timetable_${year}_${session}.json`, setJSON), [year, session])

  // Modules are TODO
  const processModule = ({classes, id, title, ...module}) => ({ title: title.replace(/_[A-Z][1-9]/, ''), ...module })
  const [modules, setModules] = useState({})
  useEffect(() => setModules(Object.entries(JSON).reduce((acc, [key, module]) => ({...acc, [key.split('_')[0]]: processModule(module)}),{})),  [JSON])

    // inefficient - O(nm)? but simpler
  // checks every module rather than caching old list to calculate diff
  const [selectedModules, setSelectedModules] = useState(m.map(([id]) => ({ id })))
  useEffect(() => {
    const api = calendar.current.getApi()
    const sources = api.getEventSources()

    const selected = selectedModules.map(({ id }) => id)
    sources.forEach(s => {
      if (!selected.includes(s.id)) {
        const qs = new URLSearchParams(window.location.search)
        qs.delete(s.id) // if no value, just ensure param exists
        window.history.replaceState(null, '', '?'+qs.toString())
      }
      s.remove()
    })

    selectedModules.forEach(({ id }) => {
      setQueryParam(id)

      if (Object.keys(JSON).length !== 0) {
        api.addEventSource({
          id,
          color: stringToColor(id),
          events: parseEvents(JSON, year, session, id)
        })
      }
    })
  }, [JSON, year, session, selectedModules, calendar, timeZone])

  useEffect(() => {
    m.forEach(([module, occurrences]) => occurrences.split(',').forEach(o => {
      if (!o || !selectedModules.map(({ id }) => id).includes(module)) return
      const r = o.match(/([^0-9]*)([0-9]+)$/)
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