import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import MembershipPage from './pages/MembershipPage'
import MemoPage from './pages/MemoPage'

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/memo/:id" element={<MemoPage />} />
      </Route>
    </Routes>
  )
}

export default App
