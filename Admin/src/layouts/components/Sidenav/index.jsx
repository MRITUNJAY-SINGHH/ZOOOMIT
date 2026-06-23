import AppLogo from '@/components/AppLogo'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import AppMenu from './components/AppMenu'
import OffcanvasToggle from './components/OffcanvasToggle'
import OnHoverToggle from './components/OnHoverToggle'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLayoutContext } from '@/context/useLayoutContext'

const Sidenav = () => {
  const { updateSettings, sidenavSize } = useLayoutContext()

  const isCondensed = sidenavSize === 'condensed'

  const toggleSidebar = () => {
    updateSettings({
      sidenavSize: isCondensed ? 'default' : 'condensed'
    })
  }

  return (
    <div className="sidenav-menu d-flex flex-column" id="sidenav">
      <AppLogo />

      <OnHoverToggle />

      <OffcanvasToggle />

      <div className="flex-grow-1 overflow-hidden">
        <SimpleBar className="scrollbar h-100" style={{ paddingTop: '15px', paddingBottom: '20px' }}>
          <div id="sidenav-menu">
            <AppMenu />
          </div>
        </SimpleBar>
      </div>


    </div>
  )
}
export default Sidenav
