import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className='home-container'>
      <h1>Welcome to ToDo Manager</h1>
      <p>
        Stay productive and organized! Our simple and intuitive ToDo app helps you track your tasks, manage your day, and get more done with ease. 
        Whether you're working, studying, or planning, we’ve got your back.
      </p>
      <div className="button-group">
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/signup")}>Sign Up</button>
      </div>
    </div>
  );
}
