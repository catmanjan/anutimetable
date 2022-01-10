import { useState, useEffect, forwardRef } from 'react'

import { InputGroup, Dropdown, DropdownButton } from 'react-bootstrap'
import { Token, Typeahead } from 'react-bootstrap-typeahead'

import Export from './Export'
import { parseEvents, selectOccurrence } from './Calendar'

// https://stackoverflow.com/a/3426956/
const stringToColor = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#00000".substring(0, 7 - c.length) + c;
}

// hardcode to semester 1 or 2 as users usually want them
// allows app to function even if /sessions endpoint is down
const getInitialState = () => {
  const qs = new URLSearchParams(window.location.search)
  let year = qs.get('y')
  let session = qs.get('s')

  let now = new Date()
  if (!session) {
    let month = now.getMonth()

    // If semester 2 complete (after Sept), default to next year
    if (!year && month > 9) {
      year = now.getFullYear()+1
      session = 'S1'
    } else {
      session = month < 5 ? 'S1' : 'S2'
    }
  }

  qs.delete('y')
  qs.delete('s')

  return [year || now.getFullYear(), session, Array.from(qs.entries()) || []]
}

const setQueryParam = (param, value) => {
  const qs = new URLSearchParams(window.location.search)
  qs.set(param, value || qs.get(param) || '') // if no value, just ensure param exists
  window.history.replaceState(null, '', '?'+qs.toString())
}

const getApi = (path, callback) => {
  try {
    fetch(path).then(res => {
      if (!res.ok) return
      else res.json().then(json => callback(json))
    })
  } catch (err) {
    console.error(err)
  }
}

export default forwardRef(({ API }, calendar) => {
  let [y, s, m] = getInitialState()

  const [year, setYear] = useState(y)
  useEffect(() => setQueryParam('y', year), [year])

  const [session, setSession] = useState(s)
  useEffect(() => setQueryParam('s', session), [session])

  // TODO call setSelectedModules and selectOccurrence
  
  const [sessions, setSessions] = useState([])
  useEffect(() => getApi(`${API}/sessions`, setSessions), [API])
  
  const [modules, setModules] = useState({})
  useEffect(() => getApi(`${API}/modules?year=${year}&session=${session}`, setModules),  [API, year, session])

  const [JSON, setJSON] = useState({})
  useEffect(() => getApi(`/timetable_${year}_${session}.json`, setJSON), [year, session])
    
  // inefficient - O(nm)? but simpler
  // checks every module rather than caching old list to calculate diff
  const [selectedModules, setSelectedModules] = useState(m.map(([id]) => ({ id })))
  useEffect(() => {
    const api = calendar.current.getApi()
    const sources = api.getEventSources()

    const selected = selectedModules.map(({ id }) => id)
    sources.forEach(s => {
      if (!selected.includes(s.id)) {
        s.remove()
        const qs = new URLSearchParams(window.location.search)
        qs.delete(s.id) // if no value, just ensure param exists
        window.history.replaceState(null, '', '?'+qs.toString())
      }
    })

    
    const sourceIds = sources.map(s => s.id)
    selectedModules.forEach(({ id }) => {
      setQueryParam(id)

      if (Object.keys(JSON).length !== 0 && !sourceIds.includes(id)) {
        api.addEventSource({
          id,
          color: stringToColor(id),
          events: parseEvents(JSON, year, session, id)
        })
      }
    })
  }, [JSON, year, session, selectedModules, calendar])

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

  return <InputGroup className="mb-2">
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
})