import { useRef, useState, useEffect } from 'react'
import {Button, Card, Container, Navbar, OverlayTrigger, Tooltip} from 'react-bootstrap'

import Toolbar from './Toolbar'
import Calendar from './Calendar'
import { getInitialState, setQueryParam, fetchJsObject, stringToColor, parseEvents } from './utils'

import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ReactPlugin, withAITracking } from '@microsoft/applicationinsights-react-js'

const isDevelopment = process.env.NODE_ENV === 'development'
const API = `${isDevelopment ? 'localhost:7071' : window.location.host}/api`

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
  useEffect(() => fetchJsObject(`${window.location.protocol}//${API}/sessions`, setSessions), [])

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

  // Starting day of the week
  const [startingDay, setStartingDay] = useState(0);
  const handleStartDayChange = (e) => {
    setStartingDay(+e.target.value);
    localStorage.setItem('startingDay', e.target.value);
  };

  useEffect(()=>{
    const cachedStartingDay = localStorage.getItem('startingDay');
    if(cachedStartingDay && parseInt(cachedStartingDay) >= 0 && parseInt(cachedStartingDay) <= 6){
      setStartingDay(parseInt(cachedStartingDay));
    }
  },[]);

  const state = {
    timeZone, year, session, sessions, timetableData, modules, selectedModules, startingDay,
    setTimeZone, setYear, setSession, setSessions, setTimetableData, setModules, setSelectedModules,
    selectOccurrence, resetOccurrence,
  }

  // Settings FAB
  const [settingsOpen, setSettingsOpen] = useState(false)
  const toggleSettings = () => setSettingsOpen(!settingsOpen)

  // Start day of week dialog
  const [startDayDialogOpen, setStartDayDialogOpen] = useState(false)
  const toggleStartDayDialog = () => setStartDayDialogOpen(!startDayDialogOpen);
  const closeStartDayDialog = () => {
    setStartDayDialogOpen(false);
    setSettingsOpen(false);
  }

  useEffect(()=>{
    document.body.style.overflow = startDayDialogOpen ? 'hidden' : 'visible';
  }, [startDayDialogOpen]);


  // fluid="xxl" is only supported in Bootstrap 5
  return <Container fluid>
    <h2 className="mt-2">ANU Timetable</h2>

    <Toolbar API={API} ref={calendar} state={state} />

    <Calendar ref={calendar} state={state} />

    <Navbar>
      <Navbar.Text>
          Made with <span role="img" aria-label="love">💖</span> by the&nbsp;
        <a href="https://cssa.club/">ANU CSSA</a>&nbsp;
        (and a <a href="/contributors.html">lot of people</a>), report issues&nbsp;
          <a href="https://github.com/anucssa/anutimetable/issues">here</a>
      </Navbar.Text>
    </Navbar>

    <div className={`fab ${settingsOpen ? 'fab--open' : ''}`} >
      <Button
        className={'fab-button'}
        variant="secondary"
        onClick={toggleSettings}
      >
        <svg className={settingsOpen ? 'hidden' : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="none" d="M0 0h24v24H0z"/><path d="M5.334 4.545a9.99 9.99 0 0 1 3.542-2.048A3.993 3.993 0 0 0 12 3.999a3.993 3.993 0 0 0 3.124-1.502 9.99 9.99 0 0 1 3.542 2.048 3.993 3.993 0 0 0 .262 3.454 3.993 3.993 0 0 0 2.863 1.955 10.043 10.043 0 0 1 0 4.09c-1.16.178-2.23.86-2.863 1.955a3.993 3.993 0 0 0-.262 3.455 9.99 9.99 0 0 1-3.542 2.047A3.993 3.993 0 0 0 12 20a3.993 3.993 0 0 0-3.124 1.502 9.99 9.99 0 0 1-3.542-2.047 3.993 3.993 0 0 0-.262-3.455 3.993 3.993 0 0 0-2.863-1.954 10.043 10.043 0 0 1 0-4.091 3.993 3.993 0 0 0 2.863-1.955 3.993 3.993 0 0 0 .262-3.454zM13.5 14.597a3 3 0 1 0-3-5.196 3 3 0 0 0 3 5.196z" fill="rgba(255,255,255,1)"/></svg>
        <svg className={settingsOpen ? '' : 'hidden'} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" fill="rgba(255,255,255,1)"/></svg>
      </Button>
      <div className={'fab-actions'}>
        <OverlayTrigger
          key={'start-day'}
          placement="left"
          overlay={
            <Tooltip id="tooltip-start-day">
              Starting day of week
            </Tooltip>
          }
        >
          <Button
            className={'fab-action'}
            variant={"primary"}
            onClick={toggleStartDayDialog}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path
                d="M17 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4V1h2v2h6V1h2v2zM4 9v10h16V9H4zm2 2h2v2H6v-2zm5 0h2v2h-2v-2zm5 0h2v2h-2v-2z"
                fill="rgba(255,255,255,1)"/>
            </svg>
          </Button>
        </OverlayTrigger>
      </div>
    </div>

    <div className={`${startDayDialogOpen ? '' : 'hidden'} dialog-container`}>
      <div className="dialog">
        <Card>
          <Card.Header>Calendar Start of Week</Card.Header>
          <Card.Body>
            <p>
              The weekly calendar starts on&nbsp;
              <select
                value={startingDay}
                className={'daySelect'}
                onChange={handleStartDayChange}
              >
                <option value={"0"}>Sunday</option>
                <option value={"1"}>Monday</option>
                <option value={"2"}>Tuesday</option>
                <option value={"3"}>Wednesday</option>
                <option value={"4"}>Thursday</option>
                <option value={"5"}>Friday</option>
                <option value={"6"}>Saturday</option>
              </select>
            </p>
            <Button
              variant="outline-primary"
              onClick={closeStartDayDialog}
              style={{width: "100%"}}
            >
              Close
            </Button>
          </Card.Body>
        </Card>
      </div>
    </div>
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
