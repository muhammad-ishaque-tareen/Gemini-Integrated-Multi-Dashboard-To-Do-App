import React from 'react'
import './NavBar.css'
import {Link} from 'react-router-dom';
import '../App.css'; 

export default function Navbar() {
  return (
    <nav className='navbar'>
    <h3>Mr. IT ToDo APP</h3>
    <ul>
        <li>
            <Link to="/">Home</Link>
        </li>
         <li>
            <Link to="/About">About Us</Link>
        </li>
         <li>
            <Link to="/Contact">Contact Us</Link>
        </li>
         <li>
            <Link to="/terms-condition">Terms & Condtions</Link>
        </li>
    </ul>
    </nav>
    
  );
}
