import { Suspense, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, LayoutGrid, Settings, Users } from 'lucide-react'
import { useStore } from '../lib/store'

const NAV = [
  { to: '/', label: 'Início', short: 'Início', icon: LayoutGrid, match: (p: string) => p === '/' },
  { to: '/alunos', label: 'Alunos', short: 'Alunos', icon: Users, match: (p: string) => /^\/(alunos|avaliacao|relatorio)/.test(p) },
  { to: '/guia', label: 'Guia de protocolos', short: 'Guia', icon: BookOpen, match: (p: string) => p.startsWith('/guia') },
  { to: '/ajustes', label: 'Ajustes', short: 'Ajustes', icon: Settings, match: (p: string) => p.startsWith('/ajustes') },
]

export default function Layout() {
  const { ready } = useStore()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const first = useRef(true)

  // Ao trocar de tela: volta ao topo e leva o foco ao conteúdo (leitores de tela)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (first.current) {
      first.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  const logo = `${import.meta.env.BASE_URL}logo.svg`

  return (
    <div className="shell">
      <a className="skip-link" href="#conteudo" onClick={(e) => {
        e.preventDefault()
        mainRef.current?.focus()
      }}>
        Pular para o conteúdo
      </a>
      <nav className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <img src={logo} alt="" width={38} height={29} />
          <div className="brand-name">
            ACOSTA<span>Avalia</span>
          </div>
        </div>
        {NAV.map((n) => {
          const active = n.match(pathname)
          return (
            <NavLink
              key={n.to}
              to={n.to}
              // função em vez de string: desliga o "active" automático do roteador ("/" casaria com tudo)
              className={() => `nav-link ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <n.icon size={20} aria-hidden="true" />
              <span className="label-long">{n.label}</span>
              <span className="label-short">{n.short}</span>
            </NavLink>
          )
        })}
        <div className="sidebar-foot">Seus dados ficam salvos só neste computador.</div>
      </nav>
      <main id="conteudo" className="main" ref={mainRef} tabIndex={-1}>
        <div className="mobile-top">
          <img src={logo} alt="" width={32} height={24} />
          <div className="brand-name" style={{ display: 'block' }}>
            ACOSTA<span>Avalia</span>
          </div>
        </div>
        <Suspense fallback={<div className="page" aria-busy="true" />}>{ready ? <Outlet /> : null}</Suspense>
      </main>
    </div>
  )
}
