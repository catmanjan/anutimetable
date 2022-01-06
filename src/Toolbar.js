import { useState, useEffect, forwardRef } from 'react'

import { Button, Dropdown, DropdownButton, FormControl, InputGroup } from 'react-bootstrap'
import { Token, Typeahead } from 'react-bootstrap-typeahead'

import stringToColor from 'string-to-color'

// hardcode to semester 1 or 2 as majority only want them
// allows app to function even if /sessions endpoint is down
const getInitialSession = () => {
  // If semester 2 complete, default to next year
  let now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth()
  return [month < 10 ? year : year+1, month < 5 ? 'S1' : 'S2']
}

export default forwardRef(({ API }, calendar) => {
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
    
  const [selectedModules, setSelectedModules] = useState([])
  const selectModules = list => {
    const [ year, semester ] = [ '2022', 'S1' ]

    const cached = selectedModules.length
    const next = list.length
    
    if (next > cached) {
      const { id } = list[list.length - 1]
      
      calendar.current.getApi().addEventSource({
        // url: `${API}/events/${id}`,
        id,
        format: 'ics',
        url: `${API}/GetICS?${id}_${semester}`,
        extraParams: {
          year,
          semester
        },
        color: stringToColor(id),
        // TODO get API to return id
        eventDataTransform: ({ url, ...event }) => ({ id: event.title, ...event })
      })
    } else if (next < cached) {
      const { id } = selectedModules.find(m => !list.includes(m))

      calendar.current.getApi().getEventSourceById(id).remove()
    }
    
    setSelectedModules(list)
  }

  return <InputGroup className="mb-2">
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

    <Typeahead
      id="course-search-box"

      clearButton
      emptyLabel="No matching courses found"
      isLoading={false}
      multiple

      // onInputChange={}
      labelKey={'title'}
      placeholder="Enter a course code here (for example LAWS1201)"
      // Overwrite bad id property (eg LAWS1201_S1 -> LAWS1201)
      options={Object.entries(modules).map(([id, val]) => ({...val, id}))}
      onChange={selectModules}
      selected={selectedModules}
      renderToken={(option, { onRemove }, idx) => <Token
        key={option.id}
        onRemove={onRemove}
        option={option}
        href={`http://programsandcourses.anu.edu.au/${year}/course/${option.id}`}
      ><a
        href={`http://programsandcourses.anu.edu.au/${year}/course/${option.id}`}
        target={"_blank"}
        rel={"noreferrer"}
      >{option.id}</a></Token>}
    />
    
    {selectedModules.length !== 0 && <InputGroup.Append>
      <Button href={`${API}/GetICS?${selectedModules.map(m => m.id).join('&')}`}>
        Export .ics
      </Button>
    </InputGroup.Append>}
  </InputGroup>
})