import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import AdminPage from './AdminPage';
import UserPage from './UserPage'; // Assuming you have a UserPage component

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/" element={<UserPage />} />
            </Routes>
        </Router>
    );
}

export default App;
