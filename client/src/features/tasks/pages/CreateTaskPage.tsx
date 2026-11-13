
import { useEffect, useState } from "react";
import { getProjects, type Project } from "@/features/projects/services/project-api";
import {
  getEmployees,
  type Employee,
} from "@/features/employees/services/employee-api";
import {
  getProjectMembers,
  type ProjectMember,
} from "@/features/projects/services/project-api";
import { useNavigate } from "react-router-dom";
import {
  createTask,
  type CreateTaskInput,
} from "@/features/tasks/services/task-api";


const CreateTaskPage = () => {
  const [taskType, setTaskType] = useState<"project" | "independent">(
    "project"
  );

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    priority: "medium",
    assignedTo: "",
    startDate: "",
    dueDate: "",
  });
const [projects, setProjects] = useState<Project[]>([]);
const [projectsLoading, setProjectsLoading] = useState(true);
const [projectError, setProjectError] = useState("");
const [employees, setEmployees] = useState<Employee[]>([]);
const [employeesLoading, setEmployeesLoading] = useState(false);
const [employeeError, setEmployeeError] = useState("");
const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
const [membersLoading, setMembersLoading] = useState(false);
const [membersError, setMembersError] = useState("");
const navigate = useNavigate();
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitError, setSubmitError] = useState("");

useEffect(() => {
  const fetchProjectMembers = async () => {
    if (taskType !== "project" || !formData.projectId) {
      setProjectMembers([]);
      return;
    }

    try {
      setMembersLoading(true);
      setMembersError("");

      const data = await getProjectMembers(Number(formData.projectId));

      setProjectMembers(data);
    } catch (error) {
      console.error("Failed to fetch project members:", error);
      setMembersError("Unable to load project members");
      setProjectMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  fetchProjectMembers();
}, [taskType, formData.projectId]);

const eligibleEmployees =
  taskType === "project"
    ? employees.filter((employee) =>
        projectMembers.some(
          (member) =>
            member.user_id === employee.id &&
            member.role === "employee"
        )
      )
    : employees;

useEffect(() => {
  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      setEmployeeError("");

      const data = await getEmployees();

      const activeEmployees = data.filter(
        (employee) =>
          employee.status === "active" &&
          employee.role === "employee"
      );

      setEmployees(activeEmployees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployeeError("Unable to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  };

  fetchEmployees();
}, []);

useEffect(() => {
  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjectError("Unable to load projects");
    } finally {
      setProjectsLoading(false);
    }
  };

  fetchProjects();
}, []);
const handleSubmit = async () => {
  setSubmitError("");

  // Basic frontend validation
  if (!formData.title.trim()) {
    setSubmitError("Please enter a task title.");
    return;
  }

  if (taskType === "project" && !formData.projectId) {
    setSubmitError("Please select a project.");
    return;
  }

  if (
    formData.startDate &&
    formData.dueDate &&
    formData.dueDate < formData.startDate
  ) {
    setSubmitError("Due date cannot be earlier than start date.");
    return;
  }

  const taskInput: CreateTaskInput = {
    title: formData.title.trim(),
    description: formData.description.trim() || undefined,
    projectId:
      taskType === "project" ? Number(formData.projectId) : null,
    priority: formData.priority as CreateTaskInput["priority"],
    assignedTo: formData.assignedTo
      ? Number(formData.assignedTo)
      : null,
    startDate: formData.startDate || null,
    dueDate: formData.dueDate || null,
  };

  try {
    setIsSubmitting(true);

    await createTask(taskInput);

    // Return to the task list after successful creation
    navigate("/tasks");
  } catch (error: any) {
    console.error("Create task failed:", error);

    setSubmitError(
      error.response?.data?.message ||
        "Failed to create task. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Create New Task
      </h1>

      <div className="space-y-5">

        {/* Task Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Task Title
          </label>

          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter task title"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>

          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the task..."
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Task Type */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Task Type
          </label>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="project"
                checked={taskType === "project"}
                onChange={() => setTaskType("project")}
              />
              Project Task
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="independent"
                checked={taskType === "independent"}
                onChange={() => setTaskType("independent")}
              />
              Independent Task
            </label>
          </div>
        </div>

        {/* Project Selection */}
        {taskType === "project" && (
  <div>
    <label className="block text-sm font-medium mb-2">
      Select Project
    </label>

    {projectsLoading ? (
      <p className="text-sm text-gray-500">Loading projects...</p>
    ) : projectError ? (
      <p className="text-sm text-red-500">{projectError}</p>
    ) : (
      <select
        value={formData.projectId}
      onChange={(e) =>
  setFormData({
    ...formData,
    projectId: e.target.value,
    assignedTo: "",
  })
}
        className="w-full border rounded-lg px-3 py-2"
      >
        <option value="">Select a project</option>

        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      
    )}
    
  </div>
  
)}
<div>
  <label className="mb-1 block text-sm font-medium">
    Assign Employee
  </label>

  {taskType === "project" && !formData.projectId ? (
    <p className="text-sm text-gray-500">
      Please select a project first.
    </p>
  ) : employeesLoading ||
    (taskType === "project" && membersLoading) ? (
    <p className="text-sm text-gray-500">
      Loading employees...
    </p>
  ) : employeeError ? (
    <p className="text-sm text-red-500">{employeeError}</p>
  ) : membersError ? (
    <p className="text-sm text-red-500">{membersError}</p>
  ) : (
    <select
      value={formData.assignedTo}
  onChange={(e) =>
  setFormData({
    ...formData,
    assignedTo: e.target.value,
  })
}
      className="w-full rounded-md border border-gray-300 px-3 py-2"
    >
      <option value="">Unassigned</option>

      {eligibleEmployees.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.name} ({employee.employeeCode})
        </option>
      ))}
    </select>
  )}

  {!employeesLoading &&
    !membersLoading &&
    !employeeError &&
    !membersError &&
    formData.projectId &&
    eligibleEmployees.length === 0 && (
      <p className="mt-1 text-sm text-gray-500">
        No eligible employees available.
      </p>
    )}
</div>

        {/* Priority and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="block text-sm font-medium mb-2">
              Priority
            </label>

            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Start Date
            </label>

            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Due Date
            </label>

            <input
              type="date"
              value={formData.dueDate}
              min={formData.startDate || undefined}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

        </div>

       {/* Submit Button */}
<div className="pt-3">

  {submitError && (
    <p className="text-sm text-red-600 mb-3">
      {submitError}
    </p>
  )}

  <button
    type="button"
    onClick={handleSubmit}
    disabled={isSubmitting}
    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
  >
    {isSubmitting ? "Creating Task..." : "Create Task"}
  </button>

</div>

      </div>
    </div>
  );
};

export default CreateTaskPage;
