import { lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'

// Telas mais pesadas carregam sob demanda
const StudentDetail = lazy(() => import('./pages/StudentDetail'))
const AssessmentEditor = lazy(() => import('./pages/AssessmentEditor'))
const Report = lazy(() => import('./pages/Report'))
const Guide = lazy(() => import('./pages/Guide'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="alunos" element={<Students />} />
            <Route path="alunos/:id" element={<StudentDetail />} />
            <Route path="avaliacao/:id" element={<AssessmentEditor />} />
            <Route path="relatorio/:id" element={<Report />} />
            <Route path="guia" element={<Guide />} />
            <Route path="ajustes" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
