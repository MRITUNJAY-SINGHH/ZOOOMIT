import User1 from '@/assets/images/users/user-1.jpg'
import { User, Settings, Bell, KeyRound, LogOut, ChevronDown } from 'lucide-react'
import { useAuthContext } from '@/context/useAuthContext'
import { Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { Link } from 'react-router'

const UserDropdown = () => {
  const { user } = useAuthContext();
  
  return (
    <div id="simple-user-dropdown" className="topbar-item nav-user">
      <Dropdown>
        <DropdownToggle className="topbar-link drop-arrow-none" type="button">
          <img src={User1} width={32} className="rounded-circle me-lg-2 d-flex" alt="user-image" />
          <div className="d-lg-flex flex-column align-items-start d-none me-1">
            <h5 className="my-0 fs-16 fw-semibold">{user?.name || 'User'}</h5>
            <small className="text-muted fs-14">{user?.role || 'Admin'}</small>
          </div>
          <ChevronDown size={16} strokeWidth={2} className="d-none d-lg-block ms-1 text-muted" />
        </DropdownToggle>
        
        <DropdownMenu className="dropdown-menu-end">
          <DropdownItem as={Link} to="/profile" className="d-flex align-items-center py-2">
            <User size={18} strokeWidth={2} className="me-2 text-muted" />
            <span className="fs-16">My Profile</span>
          </DropdownItem>

          <DropdownItem as={Link} to="/settings" className="d-flex align-items-center py-2">
            <Settings size={18} strokeWidth={2} className="me-2 text-muted" />
            <span className="fs-16">Account Settings</span>
          </DropdownItem>

          <DropdownItem as={Link} to="/notifications" className="d-flex align-items-center py-2">
            <Bell size={18} strokeWidth={2} className="me-2 text-muted" />
            <span className="fs-16">Notifications</span>
          </DropdownItem>

          <DropdownItem as={Link} to="/change-password" className="d-flex align-items-center py-2">
            <KeyRound size={18} strokeWidth={2} className="me-2 text-muted" />
            <span className="fs-16">Change Password</span>
          </DropdownItem>

          <DropdownDivider />

          <DropdownItem as={Link} to="/auth/logout" className="d-flex align-items-center py-2 text-danger fw-semibold">
            <LogOut size={18} strokeWidth={2} className="me-2" />
            <span className="fs-16">Log Out</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
export default UserDropdown
