import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { isAuthenticated, getUser, getDefaultRoute } from "./utils/auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import VerificationDetails from "./pages/VerificationDetails";

function HomeRedirect() {
  if (!isAuthenticated()) return <Login />;
  return <Navigate to={getDefaultRoute(getUser()?.role)} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/candidate" element={
          <ProtectedRoute roles={["candidate"]}><CandidateDashboard /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute roles={["candidate"]}><History /></ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute roles={["candidate", "admin"]}><Upload /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute roles={["admin"]}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute roles={["admin", "recruiter"]}><Analytics /></ProtectedRoute>
        } />
        <Route path="/recruiter" element={
          <ProtectedRoute roles={["recruiter"]}><RecruiterDashboard /></ProtectedRoute>
        } />
        <Route path="/verification/:id" element={
          <ProtectedRoute><VerificationDetails /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
