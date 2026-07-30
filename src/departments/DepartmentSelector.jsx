import React, { useEffect, useRef, useState } from 'react'
import {
  searchDepartmentHierarchy,
  toDepartmentSelection
} from './hierarchy'
import { DepartmentSelectionDisplay } from './DepartmentSelectionDisplay'
import './departments.css'

export const DepartmentSelector = ({ departments, value, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const searchInputRef = useRef(null)

  const handleSearchChange = (e) => {
    const query = e.target.value
    const results = searchDepartmentHierarchy(departments, query)

    setSearchQuery(query)
    setSearchResults(results)
    setShowSearchResults(Boolean(query.trim()))
  }

  const selectDepartment = (result) => {
    onChange(toDepartmentSelection(result))
    setSearchQuery('')
    setShowSearchResults(false)
    setSearchResults([])
  }

  const handleSearchBlur = () => {
    setTimeout(() => setShowSearchResults(false), 150)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <>
      <div className="form-group" ref={searchInputRef} style={{ position: 'relative' }}>
        <label htmlFor="departmentSearch">Search Departments</label>
        <input
          type="text"
          id="departmentSearch"
          placeholder="Search departments..."
          className="search-input"
          value={searchQuery}
          onChange={handleSearchChange}
          onBlur={handleSearchBlur}
          onFocus={() => searchQuery && setShowSearchResults(true)}
        />

        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div
                key={`${result.path}-${index}`}
                className="search-result-item"
                onClick={() => selectDepartment(result)}
              >
                <div className="search-result-path">{result.path}</div>
                <div className="search-result-detail">
                  {result.type} → {result.main} → {result.sub} {result.subSub ? `→ ${result.subSub}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {showSearchResults && searchResults.length === 0 && searchQuery && (
          <div className="search-results">
            <div className="search-result-item no-results">
              No departments found for "{searchQuery}"
            </div>
          </div>
        )}
      </div>

      <DepartmentSelectionDisplay selection={value} />
    </>
  )
}
