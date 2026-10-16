import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";
import EmployeeListPage from "../features/employees/pages/EmployeeListPage";
import EditEmployeePage from "../features/employees/pages/EditEmployeePage";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import CreateEmployeePage from "../features/employees/pages/CreateEmployeePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  {
    path: "/register",
    element: <RegisterPage />,
  },

  {
    path: "/login",
    element: <LoginPage />,
  },
  {
  path: "/employees/:id/edit",
  element: <EditEmployeePage />,
},

  
{
  element: <ProtectedRoute />,
  children: [
    {
      path: "/dashboard",
      element: <DashboardPage />,
    },
    {
      path: "/employees/new",
      element: <CreateEmployeePage />,
    },
    { path: "/employees", element: <EmployeeListPage /> },
  ],
},

]);