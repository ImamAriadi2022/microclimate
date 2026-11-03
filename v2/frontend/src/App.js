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
        <Route path="/kalimantan/*" element={<Kalimantan />} />
        <Route path="/petengoran/*" element={<Petengoran />} />
        <Route path="/:username/dashboard/*" element={<UserConfig />} />
        <Route path="/:username/:slug" element={<CustomDashboard />} />
        <Route path="/:username/:template/:slug" element={<CustomDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
