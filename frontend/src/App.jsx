import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/user"
          element={
              <UserDashboard />
          }
        />
        <Route
          path="/admin"
          element={
              <AdminDashboard />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
