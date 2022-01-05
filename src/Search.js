import { useState, useEffect } from 'react'

import { Button, Dropdown, DropdownButton, FormControl, InputGroup } from 'react-bootstrap'
import ReactSearchBox from 'react-search-box'
import { Typeahead } from 'react-bootstrap-typeahead'

// hardcode to semester 1 or 2 as majority only want them
// allows app to function even if /sessions endpoint is down
const getInitialSession = () => {
  // If semester 2 complete, default to next year
  let now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth()
  return [month < 10 ? year : year+1, month < 5 ? 'S1' : 'S2']
}

const Search = ({ API, selectModule }) => {
  let [y, s] = getInitialSession()
  const [year, setYear] = useState(y)
  const [session, setSession] = useState(s)

  const [sessions, setSessions] = useState({})
  useEffect(() => (async () => {
    try {
      let res = await fetch(`${API}/sessions`)
      if (!res.ok) return
      let json = await res.json()
      setSessions(json)
    } catch (err) {
      console.error(err)
    }
  })(), [API])
  
  const [modules, setModules] = useState({})
  useEffect(() => (async () => {
    try {
      let res = await fetch(`${API}/modules?year=${year}&session=${session}`)
      if (!res.ok) return
      let json = await res.json()
      setModules(json)
    } catch (err) {
      console.error(err)
    }
  })(), [API, session, year])

  return <><InputGroup className="mb-2">
    <DropdownButton
      as={InputGroup.Prepend}
      variant="outline-secondary"
      title={year}
    >
      {/* reverse() - years (numerical keys) are in ascending order per ES2015 spec */}
      {Object.keys(sessions).reverse().map(e => <Dropdown.Item key={e} onClick={() => setYear(e)}>{e}</Dropdown.Item>)}
    </DropdownButton>

    <DropdownButton
      as={InputGroup.Prepend}
      variant="outline-secondary"
      title={session}
    >
      {sessions[year]?.map(e => <Dropdown.Item key={e} onClick={() => setSession(e)}>{e}</Dropdown.Item>)}
    </DropdownButton>

    {/* TODO replace search with Bootstrap-compatible component */}
    <FormControl
      as={ReactSearchBox}
      style={{'border-radius': 0}}
      autoFocus
      clearOnSelect
      placeholder="Enter a course code here (for example LAWS1201)"
      data={Object.keys(modules).map(e => ({key: e, value: modules[e].title}))}
      // constrain view to only one session
      // otherwise API would need /events/2022/S1/COMP1110 instead of query params, to avoid FullCalendar conflicts
      onSelect={record => selectModule(year, session, record.item.key)}
    />
    <InputGroup.Append>
      <Button onClick={() => {this.downloadEvents()}}>Export .ics</Button>
    </InputGroup.Append>

    
  </InputGroup>
  </>
}

export default Search