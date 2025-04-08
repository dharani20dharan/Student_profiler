import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/users');
                if (!response.ok) throw new Error('Failed to fetch users');
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`); // Navigate to the user's profile
    };

    return (
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-content">
                    <h1>Connect, Collaborate, and Grow</h1>
                    <p>Your university’s professional networking and project hub.</p>
                    <Link to="/jobs" className="cta-button">Explore Opportunities</Link>
                </div>
            </section>
            
            <section className="features-section">
                <div className="feature-card">
                    <h2>Find Projects</h2>
                    <p>Browse and apply for student-led projects that match your skills.</p>
                </div>
                <div className="feature-card">
                    <h2>Showcase Your Work</h2>
                    <p>Upload projects, certifications, and build a validated profile.</p>
                </div>
                <div className="feature-card">
                    <h2>Stay Updated</h2>
                    <p>Get announcements and updates on important events.</p>
                </div>
            </section>
            
            <section className="users-section">
                <h2>Our Users</h2>
                {loading ? <p>Loading users...</p> : error ? <p className="error">{error}</p> : (
                    <ul className="users-list">
                        {users.map(user => (
                            <li key={user.id} className="user-card" onClick={() => handleUserClick(user.id)}>
                                <h3>{user.name}</h3>
                                <p>{user.email}</p>
                                <p><strong>Department:</strong> {user.department}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default Home;
