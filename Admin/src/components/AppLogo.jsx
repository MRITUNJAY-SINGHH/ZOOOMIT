import logoBlack from '@/assets/images/logo-black.svg'
import logoSm from '@/assets/images/logo-sm.svg'
import logo from '@/assets/images/logo.svg'
import { Link } from 'react-router'
const AppLogo = () => {
  return (
    <Link to="/" className="logo">
      <span className="logo logo-light">
        <span className="logo-lg">
          <img src={logo} alt="logo" />
        </span>
        <span className="logo-sm">
          <img src={logoSm} alt="small logo" />
        </span>
      </span>
      <span className="logo logo-dark">
        <span className="logo-lg">
          <img src={logoBlack} alt="dark logo" />
        </span>
        <span className="logo-sm">
          <img src={logoSm} alt="small logo" />
        </span>
      </span>
    </Link>
  )
}
export default AppLogo
