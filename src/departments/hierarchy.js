export const getDepartmentDisplayName = (selection) => {
  if (selection.subSubDepartment) {
    return selection.subSubDepartment
  }

  if (selection.subDepartment) {
    return selection.subDepartment
  }

  return selection.mainDepartment || ''
}

export const hasDepartmentSelection = (selection) => Boolean(
  selection.departmentType ||
  selection.mainDepartment ||
  selection.subDepartment ||
  selection.subSubDepartment
)

export const toDepartmentSelection = (result) => ({
  departmentType: result.type,
  mainDepartment: result.main,
  subDepartment: result.sub,
  subSubDepartment: result.subSub || ''
})

export const searchDepartmentHierarchy = (departments, query, limit = 10) => {
  const queryLower = query.trim().toLowerCase()

  if (!queryLower) {
    return []
  }

  const results = []

  Object.entries(departments).forEach(([typeKey, typeData]) => {
    Object.entries(typeData.departments).forEach(([mainKey, mainData]) => {
      Object.entries(mainData).forEach(([subKey, subData]) => {
        if (subKey.toLowerCase().includes(queryLower)) {
          results.push({
            type: typeKey,
            typeName: typeData.name,
            main: mainKey,
            sub: subKey,
            path: `${typeData.name} > ${mainKey} > ${subKey}`
          })
        }

        if (typeof subData === 'object' && !Array.isArray(subData)) {
          Object.keys(subData).forEach((subSubKey) => {
            if (subSubKey.toLowerCase().includes(queryLower)) {
              results.push({
                type: typeKey,
                typeName: typeData.name,
                main: mainKey,
                sub: subKey,
                subSub: subSubKey,
                path: `${typeData.name} > ${mainKey} > ${subKey} > ${subSubKey}`
              })
            }
          })
        }
      })
    })
  })

  return results.slice(0, limit)
}
