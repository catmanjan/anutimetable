import { useState } from 'react'
import { Dropdown, DropdownButton, InputGroup } from 'react-bootstrap'
import { SiApple, SiGooglecalendar, SiMicrosoftoutlook, SiMicrosoftexchange } from 'react-icons/si'
import { RiCalendar2Fill } from 'react-icons/ri'

const Export = ({ API }) => {
  const [webcal, setWebcal] = useState(`${API}/GetICS${window.location.search}`)

  return <DropdownButton
    as={InputGroup.Append}
    variant='outline-primary'
    title='Export'
    onClick={() => setWebcal(`${API}/GetICS${window.location.search}`)}
  >
    <Dropdown.Item eventKey="web" target={"_blank"} rel={"noreferrer"}
      href={webcal.replace(/(http|https)/,'webcal')}>
      <SiApple /> WebCal (eg iOS)
    </Dropdown.Item>
    <Dropdown.Item eventKey="gcal" target={"_blank"} rel={"noreferrer"} 
      href={`https://www.google.com/calendar/render?cid=${encodeURIComponent(webcal.replace('https', 'http'))}`}>
      <SiGooglecalendar /> Google Calendar
    </Dropdown.Item>
    <Dropdown.Item eventKey="msol" target={"_blank"} rel={"noreferrer"}
      href={`https://outlook.live.com/calendar/addfromweb?name=ANU&url=${webcal}`}>
      <SiMicrosoftoutlook /> Outlook.com
    </Dropdown.Item>
    <Dropdown.Item eventKey="aad" target={"_blank"} rel={"noreferrer"}
      href={`https://outlook.office.com/calendar/addfromweb?name=ANU&url=${webcal}`}>
      <SiMicrosoftexchange /> Office 365
    </Dropdown.Item>
    <Dropdown.Divider />
    <Dropdown.Item eventKey="ics" download={`ANU Timetable ${new Date().toLocaleDateString().replace(/(\/|\\)/g,'.')}.ics`} href={webcal}>
      <RiCalendar2Fill /> Download ICS file
    </Dropdown.Item>
  </DropdownButton>
}

export default Export