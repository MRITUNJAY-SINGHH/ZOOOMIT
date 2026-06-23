import { Sliders } from 'lucide-react'
import { useLayoutContext } from '@/context/useLayoutContext'

const CustomizerToggler = () => {
  const { toggleCustomizer } = useLayoutContext()
  return (
    <div className="topbar-item d-none d-sm-flex btn-theme-setting">
      <button className="topbar-link" type="button" onClick={toggleCustomizer}>
        <span className="topbar-link-icon">
          <Sliders size={20} strokeWidth={2} />
        </span>
      </button>
    </div>
  )
}
export default CustomizerToggler
