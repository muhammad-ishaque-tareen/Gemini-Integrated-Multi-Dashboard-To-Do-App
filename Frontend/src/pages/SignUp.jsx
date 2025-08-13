import React, { useState } from 'react';
import axios from 'axios';
import './signup.css'; // Import your new CSS
import { useNavigate } from 'react-router-dom';

export default function SignUp() {
  const navigate = useNavigate();
  const [firstname, setFirstname] = useState('');
  const [secondname, setSecondname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errormessage, setErrormessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEmail = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (!value.includes('@')) {
      setErrormessage('Please enter a valid email');
    } else {
      setErrormessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.includes('@')) {
      setErrormessage('Please enter a valid email');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/signup', {
        firstname,
        secondname,
        username,
        email,
        password
      });

      if (response.status === 201 || response.status === 200)  {
        setSuccessMessage('Signup successful!');
        setFirstname('');
        setSecondname('');
        setUsername('');
        setEmail('');
        setPassword('');
        setTimeout(()=>
        {
           navigate('/login');

        }, 3000);
      }
    } catch (error) {
      setErrormessage('Signup failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className='signup-container'>
      <form className='signup-form-container' onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <input
          type='text'
          value={firstname}
          placeholder='Enter Your First Name'
          onChange={(e) => setFirstname(e.target.value)}
          required
        />
        <input
          type='text'
          value={secondname}
          placeholder='Enter Your Second Name'
          onChange={(e) => setSecondname(e.target.value)}
          required
        />
        <input
          type='text'
          value={username}
          placeholder='Enter Username (no spaces)'
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type='email'
          value={email}
          placeholder='Enter a valid Email'
          onChange={handleEmail}
          required
        />
        <input
          type='password'
          value={password}
          placeholder='Enter Password'
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type='submit'>Register</button>

        {errormessage && <p>{errormessage}</p>}
        {successMessage && <p style={{ color: 'lightgreen' }}>{successMessage}</p>}
      </form>
    </div>
  );
}
