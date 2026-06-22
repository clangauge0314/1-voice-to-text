import { NavLink } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="bg-white dark:bg-black border-b border-black/20 dark:border-white/20 transition-colors">
      <div className="max-w-8xl mx-auto px-4 h-10 flex items-center">
        <NavLink to="/" className="text-base font-bold text-black dark:text-white">
          Voice to Text
        </NavLink>
      </div>
    </nav>
  )
}

export default Navbar
