import { Navigate } from 'react-router-dom';

// Function to get user role from localStorage
const getUserRole = () => {
  try {
    // Directly retrieve the role
    const role = localStorage.getItem('role');
    return role || null;
  } catch (error) {
    console.error("Failed to get user role:", error);
    return null;
  }
};

function ProtectedRoute({ allowedRoles, redirectTo, children }) {
  const userRole = getUserRole();

  // Check if the user role is valid and allowed
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;
