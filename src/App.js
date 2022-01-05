import { useState, useRef } from 'react'

import { Container, Navbar, Button, ButtonGroup, ButtonToolbar, InputGroup, Form } from 'react-bootstrap'
import { RiDeleteBinLine } from 'react-icons/ri'

import Search from './Search'
import { Typeahead } from 'react-bootstrap-typeahead'
import Calendar from './Calendar'

import stringToColor from 'string-to-color'

import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ReactPlugin, withAITracking } from '@microsoft/applicationinsights-react-js'

const API = `${process.env.REACT_APP_FUNCTION_API || ''}/api`

const modules = {
  COMP1100: {
    title: 'COMP1100 Programming as Problem Solving',
  },
  COMP1130: {
    title: 'COMP1130 Programming as Problem Solving (Advanced)',
  }
}

let App = () => {
  const calendar = useRef()
  const [selectedModules, setSelectedModules] = useState([])
  const [availableModules, setAvailableModules] = useState(Object.entries(modules).map(([id, val]) => ({id, ...val})))

  const updateModules = modules => {
    const [ year, semester ] = [ '2022', 'S1' ]

    const cached = selectedModules.length
    const next = modules.length
    
    if (next > cached) {
      const { id } = modules.pop()
      modules.push(id)
      
      calendar.current.getApi().addEventSource({
        // url: `${API}/events/${id}`,
        id,
        format: 'ics',
        url: `${API}/GetICS?${id}_${semester}`,
        color: stringToColor(id),
        extraParams: {
          year,
          semester
        }
      })
    } else if (next < cached) {
      const id = selectedModules.find(module => !modules.includes(module))

      calendar.current.getApi().getEventSourceById(id).remove()
    }
    
    setSelectedModules(modules)
  }

  // Bootstrap 5: fluid="xxl" is supported
  return <Container fluid>
    <h2>Unofficial ANU Timetable</h2>

    {/* <ButtonToolbar className="mb-1">
      <label className="align-self-center m-1 p-1">Selected courses:{!selectedModules && 'None.'}</label>
      {selectedModules.map(module =>
      <ButtonGroup size="sm" className="m-1">
        <Button>{module}</Button>
        <Button variant="danger" className="p-1 align-items-center" onClick={() => {
          let s = Array.from(selectedModules)
          s.splice(s.indexOf(module), 1)
          setSelectedModules(s)
        }}><RiDeleteBinLine size={20}/></Button>
      </ButtonGroup>
    )}</ButtonToolbar> */}

    {/* <Search API={API} selectModule={selectModule} /> */}

    <Form.Group>
      <InputGroup>
        <InputGroup.Prepend>
          <InputGroup.Text>
            Selected courses:
          </InputGroup.Text>
        </InputGroup.Prepend>
        <Typeahead
          id="course-search-box"

          // clearButton
          emptyLabel="No matching courses found"
          // flip={false}
          // highlightOnlyResult
          isLoading={false}
          multiple

          // onInputChange={}
          labelKey={'title'}
          placeholder="Enter a course code here (for example LAWS1201)"
          options={availableModules}
          onChange={updateModules}
          selected={selectedModules}
        />
      </InputGroup>
    </Form.Group>

    <Calendar API={API} ref={calendar} />

    <Navbar>
      <Navbar.Text>
          Made with <span role="img" aria-label="love">💖</span> by the&nbsp;
          <a href="https://cssa.club/">ANU CSSA</a>, report issues&nbsp;
          <a href="https://github.com/pl4nty/anutimetable/issues">here</a>
      </Navbar.Text>
    </Navbar>
  </Container>
}

const hasInsights = process.env.NODE_ENV !== 'development'
if (hasInsights) {
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