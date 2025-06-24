import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Fleet from './pages/Fleet';
import Billing from './pages/Billing';
import NotFound from './pages/NotFound';
import Missions from './pages/Missions';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64">
            <div className="p-8">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/fleet" element={<Fleet />} />
                <Route path="/missions" element={<Missions />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
