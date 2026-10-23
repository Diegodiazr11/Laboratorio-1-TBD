import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import SearchPage from '../pages/SearchPage.jsx';
import MyReservations from '../pages/MyReservations.jsx';
import AccommodationDetail from '../pages/AccommodationDetail.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import HostProperties from '../pages/HostProperties.jsx';
import Footer from '../components/Footer.jsx';


export default function AppRouter() {
  return (
      <div style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<SearchPage />} />
          <Route path="/alojamiento/:id" element={<AccommodationDetail />} />

          <Route element={<ProtectedRoute allowedRoles={['HUESPED']} />}>
            <Route path="/mis-reservas" element={<MyReservations />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ANFITRION']} />}>
            <Route path="/anfitrion/propiedades" element={<HostProperties />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMINISTRADOR']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
  );
}