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
import DepartmentManagementPage from "../features/departments/DepartmentManagementPage";
import DepartmentEmployeesPage from "../features/departments/DepartmentEmployeesPage";
import ProjectListPage from "../features/projects/pages/ProjectListPage";
import CreateProjectPage from "../features/projects/pages/CreateProjectPage";

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
      path: "/employees/create",
      element: <CreateEmployeePage />,
    },
    { path: "/employees", element: <EmployeeListPage /> },
    {
  path: "/departments",
  element: <DepartmentManagementPage />,
},

{
  path: "/departments/:id/employees",
  element: <DepartmentEmployeesPage />,
},

{
  path: "/projects",
  element: <ProjectListPage  />,
},


{
  path: "/projects/create",
  element: <CreateProjectPage   />,
},
    
  ],
},

]);