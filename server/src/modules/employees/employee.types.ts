export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  employeeCode: string;
  jobTitle: string | null;
  department: string | null;
  joiningDate: string | null;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "manager" | "employee";
  employeeCode: string;
  jobTitle?: string;
  department?: string;
  joiningDate?: string;
}