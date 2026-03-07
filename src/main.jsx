import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './index.css'
import App, {NotFoundPage, PrivacyPage} from './App.jsx'
import AdvisoryPage from './pages/AdvisoryPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AuthProvider from './context/AuthContext.jsx'
import Home from "./pages/Home.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Transactions from "./pages/Transactions.jsx";
import {AppProvider} from "./context/AppContext.jsx";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <AppProvider>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<LoginPage/>}/>
                        <Route path="/signup" element={<SignUpPage/>}/>

                        {/* Protected routes */}
                        <Route element={<ProtectedRoute/>}>
                            <Route path="/onboarding" element={<OnboardingPage/>}/>
                            <Route path="/" element={<App/>}>
                                <Route index element={<Dashboard/>}/>
                                <Route path="dashboard" element={<Dashboard/>}/>
                                <Route path="advisory" element={<AdvisoryPage/>}/>
                                <Route path="privacy" element={<PrivacyPage/>}/>
                                {/*<Route path="home" element={<Home/>}/>*/}
                                {/*<Route path="portfolio" element={<Portfolio/>}/>*/}
                                {/*<Route path="transactions" element={<Transactions/>}/>*/}
                                <Route path="" element={<NotFoundPage/>}/>
                            </Route>
                        </Route>
                    </Routes>
                </AppProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
)