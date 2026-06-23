import { Search } from 'lucide-react'
import { FormControl } from 'react-bootstrap'

const SearchBoxRoundedRight = () => {
  return (
    <div id="search-box-rounded-right" className="app-search d-none d-xl-flex" style={{ width: '60vw', maxWidth: '800px' }}>
      <FormControl type="search" className="rounded-pill topbar-search fs-16" name="search" placeholder="Search products, orders, customers..." />
      <Search size={20} strokeWidth={2} className="app-search-icon text-muted" />
    </div>
  )
}
export default SearchBoxRoundedRight
