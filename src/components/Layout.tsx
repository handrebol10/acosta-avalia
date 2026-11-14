import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, LayoutGrid, Settings, Users } from 'lucide-react'
import { useStore } from '../lib/store'

const NAV = [
  { to: '/', label: 'Início', icon: LayoutGrid, end: true },
  { to: '/alunos', label: 'Alunos', icon: Users },
  { to: '/guia', label: 'Guia de protocolos', icon: BookOpen },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

export default function Layout() {
  const { ready } = useStore()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" />
          <div className="brand-name">
            ACOSTA<span>Avalia</span>
          </div>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <n.icon size={18} />
            <span className="label">{n.label}</span>
          </NavLink>
        ))}
        <div className="sidebar-foot">
          Seus dados ficam salvos só neste computador.
        </div>
      </aside>
      <main className="main">{ready ? <Outlet /> : null}</main>
    </div>
  )
}
