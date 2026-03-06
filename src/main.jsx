import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './index.css'
import App, {AdvisoryPage, NotFoundPage, PrivacyPage} from './App.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Home from "./pages/Home.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Transactions from "./pages/Transactions.jsx";
import {AppProvider} from "./context/AppContext.jsx";


createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App/>}>
                        <Route index element={<Home/>}/>
                        <Route path="portfolio" element={<Portfolio/>}/>
                        <Route path="transactions" element={<Transactions/>}/>
                        <Route path="dashboard" element={<Dashboard/>}/>
                        <Route path="advisory" element={<AdvisoryPage/>}/>
                        <Route path="privacy" element={<PrivacyPage/>}/>
                        <Route path="*" element={<NotFoundPage/>}/>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AppProvider>
    </StrictMode>,
)
