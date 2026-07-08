import User1 from '@/assets/images/users/user-1.jpg'
import { User, Settings, Bell, KeyRound, LogOut, ChevronDown } from 'lucide-react'
import { useAuthContext } from '@/context/useAuthContext'
import React, { useState } from 'react';
import { Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle, Modal, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router'

const UserDropdown = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/auth/sign-in');
  };
  
  return (
    <div id="simple-user-dropdown" className="topbar-item nav-user">
      <Dropdown>
        <DropdownToggle className="topbar-link drop-arrow-none d-flex align-items-center" type="button">
          <div className="d-lg-flex flex-column align-items-start d-none me-1">
            <h5 className="my-0 fs-16 fw-semibold">{user?.name || 'User'}</h5>
            <small className="text-muted fs-14">{user?.role || 'Admin'}</small>
          </div>
          <ChevronDown size={16} strokeWidth={2} className="ms-1 text-muted" />
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

          <DropdownItem onClick={handleLogoutClick} className="d-flex align-items-center py-2 text-danger fw-semibold" style={{ cursor: 'pointer' }}>
            <LogOut size={18} strokeWidth={2} className="me-2" />
            <span className="fs-16">Log Out</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-18 fw-bold">Sign Out</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 pb-4">
          <div className="d-flex flex-column align-items-center text-center">
            <div className="bg-danger-subtle text-danger rounded-circle p-3 mb-3">
              <LogOut size={32} strokeWidth={2} />
            </div>
            <h5 className="mb-2">Are you sure you want to sign out?</h5>
            <p className="text-muted mb-0">You will need to sign in again to access the dashboard.</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 justify-content-center gap-2 pb-4">
          <Button variant="light" className="px-4" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="px-4" onClick={confirmLogout}>
            Yes, Sign Out
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
export default UserDropdown
