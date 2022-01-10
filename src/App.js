import { useRef } from 'react'
import { Container, Navbar } from 'react-bootstrap'

import Toolbar from './Toolbar'
import Calendar from './Calendar'

import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ReactPlugin, withAITracking } from '@microsoft/applicationinsights-react-js'

const isDevelopment = process.env.NODE_ENV === 'development'
const API = `${isDevelopment ? 'http://localhost:7071' : window.location.origin}/api`

let App = () => {
  const calendar = useRef()
  
  // fluid="xxl" is only supported in Bootstrap 5
  return <Container fluid>
    <h2 className="mt-2">ANU Timetable</h2>

    <Toolbar API={API} ref={calendar} />

    <Calendar API={API} ref={calendar} />

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