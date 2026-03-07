import {NavLink} from 'react-router-dom'
import {useAppContext} from '../context/AppContext'

const TABS = [
    {label: 'Home', path: '/'},
    {label: 'Portfolio', path: '/portfolio'},
    {label: 'Transactions', path: '/transactions'},
]

export default function Navbar() {
    const {timeFilters, activeFilter, setActiveFilter} = useAppContext()

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
            {/* Page tabs */}
            <div className="flex items-center gap-1">
                {TABS.map(({label, path}) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({isActive}) =>
                            `px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                                isActive
                                    ? 'border border-gray-300 text-gray-900 bg-white'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </div>

            {/* Time filters — only shown when a page registers them */}
            {timeFilters.length > 0 && (
                <div className="flex items-center gap-1">
                    {timeFilters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                                activeFilter === filter
                                    ? 'border border-gray-300 text-gray-900 bg-white'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
