import { Sun, Moon, Monitor } from 'lucide-react'
import { useLayoutContext } from '@/context/useLayoutContext'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'

const themeDropdownOptions = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
  },
]

const ThemeMode = () => {
  const { theme, updateSettings } = useLayoutContext()
  
  return (
    <div id="theme-dropdown" className="topbar-item d-none d-sm-flex">
      <Dropdown align="end">
        <DropdownToggle as="button" className="topbar-link drop-arrow-none">
          <span className="topbar-link-icon">
            {theme === 'light' ? <Sun size={20} strokeWidth={2} /> : theme === 'dark' ? <Moon size={20} strokeWidth={2} /> : <Monitor size={20} strokeWidth={2} />}
          </span>
        </DropdownToggle>

        <DropdownMenu>
          {themeDropdownOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <DropdownItem as="label" key={option.value} className={`cursor-pointer ${theme === option.value ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="data-bs-theme"
                  value={option.value}
                  className="form-check-input d-none"
                  checked={theme === option.value}
                  onChange={() =>
                    updateSettings({
                      theme: option.value,
                    })
                  }
                />
                <IconComponent size={20} strokeWidth={2} className="align-middle me-2" />
                <span className="align-middle fs-16">{option.label}</span>
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      </Dropdown>
    </div>
  )
}
export default ThemeMode
