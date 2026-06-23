import { Icon as IconifyIcon } from '@iconify/react'
const Icon = ({ icon, ...props }) => {
  const iconName = icon.startsWith('lucide:') ? icon : `lucide:${icon}`;
  return <IconifyIcon icon={iconName} {...props} />
}
export default Icon
