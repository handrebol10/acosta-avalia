import { HashRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import AssessmentEditor from './pages/AssessmentEditor'
import Report from './pages/Report'
import Guide from './pages/Guide'
import SettingsPage from './pages/SettingsPage'

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
