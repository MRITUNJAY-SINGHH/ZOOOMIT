import { useAuthContext } from '@/context/useAuthContext';
import Icon from '@/components/wrappers/Icon'
import { menuItems } from '@/layouts/components/data'
import { scrollToElement } from '@/utils/layout'
import clsx from 'clsx'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Collapse } from 'react-bootstrap'
import { Link, useLocation } from 'react-router'
import api from '@/utils/api'
const MenuItemWithChildren = ({ item, openMenuKey, setOpenMenuKey, level = 0 }) => {
  const pathname = useLocation().pathname
  const isTopLevel = level === 0
  const [localOpen, setLocalOpen] = useState(false)
  const [didAutoOpen, setDidAutoOpen] = useState(false)
  const isChildActive = useCallback((children = []) => children.some((child) => (child.url && pathname.startsWith(child.url)) || (child.children && isChildActive(child.children))), [pathname])
  const isActive = (item.url && pathname.startsWith(item.url)) || isChildActive(item.children)
  const isOpen = isTopLevel ? openMenuKey === item.slug : localOpen
  useEffect(() => {
    if (isActive && !didAutoOpen) {
      if (isTopLevel) {
        setOpenMenuKey(item.slug)
      } else {
        setLocalOpen(true)
      }
      setDidAutoOpen(true)
    }
  }, [isActive, didAutoOpen, isTopLevel, item.slug, setOpenMenuKey])
  const toggleOpen = (e) => {
    if (item.children?.length) e.preventDefault()
    if (isTopLevel) {
      setOpenMenuKey(isOpen ? null : item.slug)
    } else {
      setLocalOpen((prev) => !prev)
    }
  }
  return (
    <li
      className={clsx('side-nav-item', {
        active: isActive,
      })}
    >
      <Link to={item.url ?? '#'} onClick={toggleOpen} className={clsx('side-nav-link', isActive && 'active')} aria-expanded={isOpen}>
        {item.icon && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}

        <span className="menu-text">{item.label}</span>
        {item.badge ? <span className={clsx('badge', item.badge.className)}>{item.badge.text}</span> : <span className="menu-arrow" />}
      </Link>

      <Collapse in={isOpen}>
        <div>
          <ul className="sub-menu">
            {(item.children || []).map((child) => (child.children ? <MenuItemWithChildren key={child.slug} item={child} openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey} level={level + 1} /> : <MenuItem key={child.slug} item={child} level={level + 1} />))}
          </ul>
        </div>
      </Collapse>
    </li>
  )
}
const MenuItem = ({ item, level = 0 }) => {
  const pathname = useLocation().pathname
  const isTopLevel = level === 0
  const isActive = item.url && pathname.startsWith(item.url)
  return (
    <li className={clsx('side-nav-item', isActive && 'active')}>
      <Link to={item.url ?? '/'} className={clsx('side-nav-link', isActive && 'active', item.isDisabled && 'disabled', item.isSpecial && 'special-menu')}>
        {item.icon && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}
        <span className="menu-text">{item.label}</span>
        {item.badge && <span className={clsx('badge', item.badge.className)}>{item.badge.text}</span>}
      </Link>
    </li>
  )
}
const AppMenu = () => {
  const [openMenuKey, setOpenMenuKey] = useState(null)
  const { hasPermission, user } = useAuthContext();
  
  const scrollToActiveLink = () => {
    const activeItem = document.querySelector('.side-nav-link.active')
    if (activeItem) {
      const simpleBarContent = document.querySelector('#sidenav .simplebar-content-wrapper')
      if (simpleBarContent) {
        const offset = activeItem.offsetTop - window.innerHeight * 0.4
        scrollToElement(simpleBarContent, offset, 500)
      }
    }
  }
  useEffect(() => {
    setTimeout(scrollToActiveLink, 150)
  }, [])

  const [assignedCount, setAssignedCount] = useState(0);
  const location = useLocation();
  
  useEffect(() => {
    if (user?.role === 'DeliveryBoy') {
      const fetchCounts = async () => {
        try {
          const res = await api.get('/orders/delivery/my-orders');
          const count = res.data.filter(o => o.status === 'Assigned').length;
          
          if (location.pathname === '/delivery/orders') {
            localStorage.setItem('seenAssignedCount', count.toString());
            setAssignedCount(0);
          } else {
            const seenCount = parseInt(localStorage.getItem('seenAssignedCount') || '0', 10);
            if (count > seenCount) {
              setAssignedCount(count - seenCount);
            } else if (count < seenCount) {
              localStorage.setItem('seenAssignedCount', count.toString());
              setAssignedCount(0);
            } else {
              setAssignedCount(0);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchCounts();
      const interval = setInterval(fetchCounts, 60000);
      return () => clearInterval(interval);
    }
  }, [user, location.pathname]);

  const filteredMenuItems = menuItems.filter(item => {
    // If it has a specific roles array, check if user role matches
    if (item.roles && user && !item.roles.includes(user.role)) return false;
    
    // If it should be hidden for specific roles
    if (item.hideForRoles && user && item.hideForRoles.includes(user.role)) return false;

    // If there is a permission requirement, check it
    if (item.permission) {
      return hasPermission(item.permission);
    }

    return true;
  }).map(item => {
    // Inject dynamic badge for delivery orders
    if (item.slug === 'delivery-orders' && assignedCount > 0) {
      return { ...item, badge: { text: assignedCount, className: 'bg-danger text-white' } };
    }
    return item;
  });

  return (
    <ul className="side-nav">
      {filteredMenuItems.map((item, idx) => {
        if (item.isTitle) {
          return <li key={idx} className="side-nav-title">{item.label}</li>;
        }
        return (
          <Fragment key={item.slug || idx}>
            {item.children ? (
              <MenuItemWithChildren item={item} openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey} />
            ) : (
              <MenuItem item={item} />
            )}
          </Fragment>
        );
      })}
    </ul>
  )
}
export default AppMenu
