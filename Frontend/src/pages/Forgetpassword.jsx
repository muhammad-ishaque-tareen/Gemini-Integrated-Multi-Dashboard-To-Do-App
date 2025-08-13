import React, { useState } from 'react';
import './Forgetpassword.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


export default function Forgetpassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmailChange = (e) => {
      const value=e.target.value;
      setEmail(value);
      if(!value.includes('@'))
      {
        setErrorMsg("Please Enter A Valid Email");
      }
      else{
        setErrorMsg('');
      }
     };

  const handleForgetPassword =async (e) => {
    e.preventDefault();
    try
    {
      const response= await axios.put('http://localhost:3000/forgetpassword',
        {
          email,
          newPassword,
          rePassword
        }
       );
       if(response.status===200)
       {
          alert(`Password Updated Successfully`);
          setEmail('');
          setErrorMsg('');
          setNewPassword('');
          setRePassword('');
          
          setTimeout(()=>
          {
            navigate('/login');

          },2000);
       }
    }
    catch(err)
    {
      if (response.err && response.err.status == 401)
      {
        setErrorMsg("New Password and Re-New password does not match");
      }
      else
      {
        setErrorMsg("Server Error, Please Try Again Later");
      }

    }
    
  };

  return (
    <div className="login-container">
      <form className="login-form-container" onSubmit={handleForgetPassword}>
        <h2>Reset Your Password</h2>

        <input
          type="email"
          value={email}
          placeholder="Enter your registered email"
          onChange={handleEmailChange}
          required
        />

        <input
          type="password"
          value={newPassword}
          placeholder="Enter new password"
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <input
          type="password"
          value={rePassword}
          placeholder="Re-enter new password"
          onChange={(e) => setRePassword(e.target.value)}
          required
        />
        <div className="button-row">
          <button type="button" onClick={() => navigate("/login")}>
            Back
          </button>
          <button type="submit" onChange={handleForgetPassword}>Change</button>
        </div>
         {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      </form>
    </div>
  );
}
