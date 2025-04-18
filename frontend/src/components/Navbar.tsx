import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, themes, ThemeName } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';

const Navbar = () => {
  const { user, setUser } = useAuth();
  const { currentTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="container">
        <Link className="navbar-brand" to="/">Resume Tracker</Link>
        <div className="nav-links">
          {user && (
            <>
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
              <Link className="nav-link" to="/upload">Upload Resume</Link>
            </>
          )}
          <div className="nav-auth">
            <div className="theme-selector" ref={themeMenuRef}>
              <button 
                className="theme-toggle-btn"
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                aria-label="Select theme"
              >
                {currentTheme.icon}
              </button>
              {isThemeMenuOpen && (
                <div className="theme-menu">
                  {Object.values(themes).map((theme) => (
                    <button
                      key={theme.name}
                      className={`theme-option ${theme.name === currentTheme.name ? 'active' : ''}`}
                      onClick={() => {
                        setTheme(theme.name as ThemeName);
                        setIsThemeMenuOpen(false);
                      }}
                    >
                      <span className="theme-icon">{theme.icon}</span>
                      <span className="theme-label">{theme.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {user ? (
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            ) : (
              <>
                <Link className="nav-link" to="/login">Login</Link>
                <Link className="nav-link" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 