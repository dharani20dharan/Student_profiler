import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";
import { FaSearch, FaUserCircle } from "react-icons/fa";

const Navbar = () => {
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
        <Link to="/jobs" className="nav-item">Seek</Link>
        <Link to="/projects" className="nav-item">Projects</Link>
        <Link to="/profile/:userId" className="nav-item">Profile</Link>
        <Link to="/login" className="nav-item">Login</Link>
        <Link to="/signup" className="nav-item">Sign-up</Link>
        <div className="user-icon">
          <FaUserCircle size={28} />
          <div className="dropdown">
            <Link to="/profile">My Profile</Link>
            <Link to="/settings">Settings</Link>
            <Link to="/logout">Logout</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
