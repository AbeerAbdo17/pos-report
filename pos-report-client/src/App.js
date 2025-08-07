import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReportPage from './com/ReportPage';
import SalesReport from './com/SalesReport';
import AccountStatement from './com/AccountStatement';

function App() {
  return (
    <Router>
      {/* ✅ شريط علوي للتنقل */}
      <nav style={{
        backgroundColor: '#333',
        padding: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        direction: 'rtl'
      }}>
        <div>
          <Link to="/" style={linkStyle}>تقرير المخزن</Link>
          <Link to="/sales" style={linkStyle}>تقرير المبيعات</Link>
          <Link to="/account-statement" style={linkStyle}>تقرير كشف حساب</Link> 
        </div>
      </nav>

      {/* ✅ محتوى الصفحات */}
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<ReportPage />} />
          <Route path="/sales" element={<SalesReport />} />
          <Route path="/account-statement" element={<AccountStatement />} /> 
        </Routes>
      </div>
    </Router>
  );
}

// ✅ تنسيق الروابط
const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  marginRight: '15px',
  fontSize: '16px'
};

export default App;
