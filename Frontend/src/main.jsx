import React from 'react';
import { createRoot } from 'react-dom/client';
  
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './app/store';
import './index.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import ContactUs from './pages/ContactUs';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SearchResults from './pages/SearchResults';
import TermsAndConditions from './pages/TermsAndConditions';
import Forgetpassword from './pages/Forgetpassword';
import SignUp from './pages/SignUp';
import ParentDashboard from './pages/ParentDashboard';
import Calculator from './components/Calculator';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard/:dashboardId" element={<Dashboard />} />
            <Route path="/search/:term" element={<SearchResults />} />
            <Route path="/terms-condition" element={<TermsAndConditions />} />
            <Route path="/forgetpassword" element={<Forgetpassword />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/parentdashboard" element={<ParentDashboard />}/> 
            <Route path='/calculator' element={<Calculator />}/>

          </Routes>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
