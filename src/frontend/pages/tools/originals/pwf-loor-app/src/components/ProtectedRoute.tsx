import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useLogIn } from "../context/LogInContext";

interface ProtectedRouteProps {
  element: React.ReactElement;
  allowedRoles?: ("admin" | "musician" | "customer")[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  element,
  allowedRoles,
}) => {
  const { state: logInState } = useLogIn();
  const location = useLocation();

  const currentPath = location.pathname || "";
  const userType = logInState.uid;

  // Check if the user is logged in
  if (!logInState.isLoggedIn) {
    return <Navigate to="/LogIn" state={{ from: currentPath }} />;
  }

  // Check if user type is allowed
  if (
    allowedRoles &&
    !allowedRoles.includes(userType as "admin" | "musician" | "customer")
  ) {
    return <Navigate to="/LogIn" />;
  }

  switch (userType) {
    case "admin":
      if (currentPath === "/") {
        return <Navigate to="/AdminDashboard" />;
      }
      break;
    case "musician":
      if (currentPath === "/") {
        return <Navigate to="/SetList" />;
      }
      break;
    case "customer":
      if (currentPath === "/") {
        return <Navigate to="/RequestSong" />;
      }
      break;
    default:
      return element;
  }

  return element;
};

export default ProtectedRoute;
