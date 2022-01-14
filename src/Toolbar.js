import { useState, useEffect, forwardRef } from 'react'

import { InputGroup, Dropdown, DropdownButton } from 'react-bootstrap'
import { Token, Typeahead } from 'react-bootstrap-typeahead'
import TimezoneSelect from 'react-timezone-select'

import Export from './Export'
import { getInitialState, setQueryParam, getApi, stringToColor, selectOccurrence, parseEvents } from './utils'

export default forwardRef(({ API, timeZone, setTimeZone }, calendar) => {
  let [y, s, m] = getInitialState()

  const [year, setYear] = useState(y)
  useEffect(() => setQueryParam('y', year), [year])

  const [session, setSession] = useState(s)
  useEffect(() => setQueryParam('s', session), [session])

  // TODO call setSelectedModules and selectOccurrence
  
  const [sessions, setSessions] = useState([])
  useEffect(() => getApi(`${API}/sessions`, setSessions), [API])
  
  const [JSON, setJSON] = useState({})
  useEffect(() => getApi(`/timetable_${year}_${session}.json`, setJSON), [year, session])

  const dropClasses = ({classes, id, title, ...module}) => ({ title: title.replace(/_[A-Z][1-9]/, ''), ...module })
  const [modules, setModules] = useState({})
  useEffect(() => setModules(Object.entries(JSON).reduce((acc, [key, module]) => ({...acc, [key.split('_')[0]]: dropClasses(module)}),{})),  [JSON])
    
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

  const selectYear = e => {
    setYear(e)
    // Assume ascending session order
    setSession(sessions[e]?.[sessions[e].length-1] || '')
  }

  return <>
  <InputGroup className="mb-2">
    <DropdownButton
      as={InputGroup.Prepend}
      variant="outline-primary"
      title={year}
    >
      {/* reverse() - years (numerical keys) are in ascending order per ES2015 spec */}
      {Object.keys(sessions).reverse().map(e => <Dropdown.Item key={e} onClick={() => selectYear(e)}>{e}</Dropdown.Item>)}
    </DropdownButton>

    <DropdownButton
      as={InputGroup.Prepend}
      variant="outline-primary"
      title={session}
    >
      {sessions[year]?.map(e => <Dropdown.Item key={e} onClick={() => setSession(e)}>{e}</Dropdown.Item>)}
    </DropdownButton>

    <Typeahead
      id="course-search-box"

      clearButton
      emptyLabel="No matching courses found"
      isLoading={Object.keys(modules).length === 0}
      multiple
      highlightOnlyResult

      labelKey='title'
      placeholder="Enter a course code here (for example LAWS1201)"
      // Overwrite bad id property (eg LAWS1201_S1 -> LAWS1201)
      options={Object.entries(modules).map(([id, val]) => ({...val, id}))}
      onChange={setSelectedModules}
      selected={selectedModules}
      // modified from default: https://github.com/ericgio/react-bootstrap-typeahead/blob/8dcac67b57e9ee121f5a44f30c59346a32b66d48/src/components/Typeahead.tsx#L143-L156
      renderToken={(option, props, idx) => <Token
        disabled={props.disabled}
        key={idx}
        onRemove={props.onRemove}
        option={option}
        tabIndex={props.tabIndex}
        href={`http://programsandcourses.anu.edu.au/${year}/course/${option.id}`}
      >
        <a
          href={`http://programsandcourses.anu.edu.au/${year}/course/${option.id}`}
          target={"_blank"}
          rel={"noreferrer"}  
        >{option.id}</a> {/** use id (eg COMP1130) instead of label to save space */}
      </Token>}
    />
    
    {/* somehow there's no NPM module for this. maybe I should write one? */}
    {selectedModules.length !== 0 && <Export API={API} />}
  </InputGroup>
  <TimezoneSelect
    className='timezone-select mb-2'
    value={timeZone}
    onChange={tz => setTimeZone(tz.value)}
  />
  </>
})
