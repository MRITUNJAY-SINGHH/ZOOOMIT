import { routes } from '@/routes'
import { useRoutes } from 'react-router'
import { Toaster } from 'react-hot-toast'

const App = () => {
  const element = useRoutes(routes)
  return (
    <>
      {element}
      <Toaster position="top-right" />
    </>
  )
}
export default App
