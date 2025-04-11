import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";
import { FaSearch, FaUserCircle } from "react-icons/fa";

const Navbar = () => {
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const navigate = useNavigate();
  const location = useLocation();

  // Update state on route change or manual localStorage updates
  useEffect(() => {
    const updateUser = () => {
      setUserId(localStorage.getItem("userId"));
    };

    updateUser(); // Run on mount
    window.addEventListener("storage", updateUser); // For multi-tab sync
    return () => window.removeEventListener("storage", updateUser);
  }, []);

  // Update when route changes
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setUserId(null);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="logo">
          <span>SkillConnect</span>
        </Link>
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search for skills, projects, jobs..." />
        </div>
      </div>

      <div className="navbar-right">
        <Link to="/" className="nav-item">Home</Link>
        <Link to="/jobs" className="nav-item">Contribute</Link>
        <Link to="/projects" className="nav-item">Projects</Link>
        {userId && (
          <Link to={`/profile/${userId}`} className="nav-item">Profile</Link>
        )}
        {!userId && (
          <>
            <Link to="/login" className="nav-item">Login</Link>
            <Link to="/signup" className="nav-item">Sign-up</Link>
          </>
        )}
        {userId && (
          <div className="user-icon">
            <FaUserCircle size={28} />
            <div className="dropdown">
              <Link to={`/profile/${userId}`}>My Profile</Link>
              <Link to="/settings">Settings</Link>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
