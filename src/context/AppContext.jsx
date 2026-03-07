import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [timeFilters, setTimeFilters] = useState([])
  const [activeFilter, setActiveFilter] = useState('All Time')

  return (
    <AppContext.Provider value={{ timeFilters, setTimeFilters, activeFilter, setActiveFilter }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext)
}
