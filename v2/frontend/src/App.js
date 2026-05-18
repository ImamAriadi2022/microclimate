import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import CustomDashboard from './pages/CustomDashboard';
import Dashboard from './pages/dashboard';
import Home from './pages/Home';
import Kalimantan from './pages/kalimantan';
import Petengoran from './pages/petengoran';
import UserConfig from './pages/UserConfig';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/:username/dashboard/*" element={<UserConfig />} />
        <Route path="/custom/:template/:slug" element={<CustomDashboard />} />
        <Route path="/kalimantan/*" element={<Kalimantan />} />
        <Route path="/petengoran/*" element={<Petengoran />} />
      </Routes>
    </Router>
  );
};

export default App;