import { Settings } from 'lucide-react'
import { Link } from 'react-router'

const QuickSettings = () => {
  return (
    <div className="topbar-item d-none d-sm-flex">
      <Link to="/settings" className="topbar-link">
        <Settings size={20} strokeWidth={2} className="topbar-link-icon" />
      </Link>
    </div>
  )
}
export default QuickSettings
