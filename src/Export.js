import { useState } from 'react'
import { Dropdown, DropdownButton, InputGroup } from 'react-bootstrap'

const Export = ({ API }) => {
  const [webcal, setWebcal] = useState(`${API}/GetICS${window.location.search}`)

  return <DropdownButton
    as={InputGroup.Append}
    variant='outline-primary'
    title='Export'
    onClick={() => setWebcal(`${API}/GetICS${window.location.search}`)}
  >
    <Dropdown.Item eventKey="web" target={"_blank"} rel={"noreferrer"}
      href={webcal.replace(/(http|https)/,'webcal')}>WebCal (eg iOS)</Dropdown.Item>
    <Dropdown.Item eventKey="gcal" target={"_blank"} rel={"noreferrer"} 
      href={`https://www.google.com/calendar/render?cid=${webcal}`}>
      Google Calendar
    </Dropdown.Item>
    <Dropdown.Item eventKey="msol" target={"_blank"} rel={"noreferrer"}
      href={`https://outlook.live.com/calendar/addfromweb?name=ANU&url=${webcal}`}>
      Outlook.com
    </Dropdown.Item>
    <Dropdown.Item eventKey="aad" target={"_blank"} rel={"noreferrer"}
      href={`https://outlook.office.com/calendar/addfromweb?name=ANU&url=${webcal}`}>
      Office 365
    </Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item eventKey="ics" target={"_blank"} rel={"noreferrer"} href={webcal}>
      Download ICS file
    </Dropdown.Item>
  </DropdownButton>
}

export default Export