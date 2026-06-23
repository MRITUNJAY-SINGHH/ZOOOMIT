import { Menu } from 'lucide-react'
import { showBackdrop, useLayoutContext } from '@/context/useLayoutContext'
import { Button } from 'react-bootstrap'
const MenuToggler = () => {
  const { updateSettings, sidenavSize } = useLayoutContext()
  const toggleSideNav = () => {
    const currentSize = sidenavSize
    if (currentSize === 'offcanvas') {
      showBackdrop()
    } else if (sidenavSize === 'compact') {
      updateSettings({
        sidenavSize: currentSize === 'compact' ? 'condensed' : 'compact',
      })
    } else {
      updateSettings({
        sidenavSize: currentSize === 'condensed' ? 'default' : 'condensed',
      })
    }
  }
  return (
    <>
      <Button variant="default" className="sidenav-toggle-button btn-icon" onClick={toggleSideNav}>
        <Menu size={20} strokeWidth={2} />
      </Button>
      <button onClick={showBackdrop} className="topnav-toggle-button px-2">
        <Menu size={20} strokeWidth={2} />
      </button>
    </>
  )
}
export default MenuToggler
