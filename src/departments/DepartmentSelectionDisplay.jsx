import React from 'react'
import { hasDepartmentSelection } from './hierarchy'

export const DepartmentSelectionDisplay = ({ selection }) => {
  if (!hasDepartmentSelection(selection)) {
    return null
  }

  return (
    <div className="department-selection-display">
      <div className="department-header">
        <div className="department-title">
          <strong>Selected Department</strong>
        </div>
        {selection.departmentType && (
          <span className="department-type-badge">{selection.departmentType}</span>
        )}
      </div>
      <div className="department-path">
        {selection.mainDepartment && (
          <span className="department-level main">{selection.mainDepartment}</span>
        )}
        {selection.subDepartment && (
          <>
            <span className="department-arrow">→</span>
            <span className="department-level sub">{selection.subDepartment}</span>
          </>
        )}
        {selection.subSubDepartment && (
          <>
            <span className="department-arrow">→</span>
            <span className="department-level subsub">{selection.subSubDepartment}</span>
          </>
        )}
      </div>
    </div>
  )
}
