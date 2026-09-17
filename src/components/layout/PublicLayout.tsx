import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function PublicLayout() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  )
}
