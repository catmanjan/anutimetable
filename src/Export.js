import { useState } from 'react'
import { Dropdown, DropdownButton, InputGroup } from 'react-bootstrap'
import { SiApple, SiGooglecalendar, SiMicrosoftoutlook, SiMicrosoftexchange } from 'react-icons/si'
import { RiCalendar2Fill } from 'react-icons/ri'

const Export = ({ API, year, session }) => {
  const [path, setPath] = useState('')
  const encoded = encodeURIComponent('http://'+path)
  const name = `ANU Timetable ${session} ${year}`

  return <DropdownButton
    as={InputGroup.Append}
    variant='outline-primary'
    title='Export'
    onClick={() => setPath(`${API}/GetICS${window.location.search}`)}
  >
    <Dropdown.Item eventKey="web" target={"_blank"} rel={"noreferrer"}
      href={`webcal://${path}`}>
      <SiApple /> WebCal (eg iOS)
    </Dropdown.Item>
    <Dropdown.Item eventKey="gcal" target={"_blank"} rel={"noreferrer"} 
      href={`https://www.google.com/calendar/render?cid=${encoded}`}>
      <SiGooglecalendar /> Google Calendar
    </Dropdown.Item>
    <Dropdown.Item eventKey="msol" target={"_blank"} rel={"noreferrer"}
      // undocumented OWA MSOL/AAD deeplinks. removing the 0 is supposed to work and could be necessary for some accounts
      // but in our case it drops all but the first qs param during parsing (maybe need double-encode?) and adds a 10s+ delay
      // source code - /owa/node_modules/calendar-bootstrap-config/src/routing/browseDiscoverCalendarsRouteHandler.ts
      href={`https://outlook.live.com/calendar/0/addfromweb?name=${name}&url=${encoded}`}>
      <SiMicrosoftoutlook /> Outlook.com
    </Dropdown.Item>
    <Dropdown.Item eventKey="aad" target={"_blank"} rel={"noreferrer"}
      href={`https://outlook.office.com/calendar/0/addfromweb?name=${name}&url=${encoded}`}>
      <SiMicrosoftexchange /> Office 365
    </Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item eventKey="ics" download={`${name} as of ${new Date().toLocaleDateString().replace(/(\/|\\)/g,'.')}.ics`} href={`${window.location.protocol}//${path}`}>
      <RiCalendar2Fill /> Download ICS file
    </Dropdown.Item>
  </DropdownButton>
}

export default Export