import { useState, useRef } from 'react'

import { Container, Navbar, Button, ButtonGroup, ButtonToolbar, InputGroup, Form } from 'react-bootstrap'
import { RiDeleteBinLine } from 'react-icons/ri'

import Toolbar from './Toolbar'
import Calendar from './Calendar'

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
  
  // Bootstrap 5: fluid="xxl" is supported
  return <Container fluid>
    <h2 className="mt-2">ANU Timetable</h2>

    <Toolbar API={API} ref={calendar} />

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