import { useEffect, useState } from "react";
import { getTasks } from "../services/task-api";
import TaskStatusBadge from "../components/TaskStatusBadge";
import TaskPriorityBadge from "../components/TaskPriorityBadge";
import { useNavigate } from "react-router-dom";

interface Task {
  id: number;
  title: string;
  description: string | null;
  project_id: number | null;
  project_name: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  assigned_to: number | null;
  assignee_name: string | null;
  created_by: number;
  creator_name: string;
}

const TaskListPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [priorityFilter, setPriorityFilter] = useState("all");
const [taskTypeFilter, setTaskTypeFilter] = useState("all");

const navigate = useNavigate();
const filteredTasks = tasks.filter((task) => {
  const matchesSearch = task.title
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "all" || task.status === statusFilter;

  const matchesPriority =
    priorityFilter === "all" || task.priority === priorityFilter;

  const matchesTaskType =
    taskTypeFilter === "all" ||
    (taskTypeFilter === "project" && task.project_id !== null) ||
    (taskTypeFilter === "independent" && task.project_id === null);

  return (
    matchesSearch &&
    matchesStatus &&
    matchesPriority &&
    matchesTaskType
  );
});

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await getTasks();
        setTasks(response);
      } catch {
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) return <p>Loading tasks...</p>;

  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <button
  onClick={() => navigate("/tasks/create")}
  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
>
  + Create Task
</button>
      </div>
      
<div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
  <input
    type="text"
    placeholder="Search tasks..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border rounded-lg px-3 py-2"
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border rounded-lg px-3 py-2"
  >
    <option value="all">All Statuses</option>
    <option value="to_do">To Do</option>
    <option value="in_progress">In Progress</option>
    <option value="in_review">In Review</option>
    <option value="blocked">Blocked</option>
    <option value="completed">Completed</option>
  </select>

  <select
    value={priorityFilter}
    onChange={(e) => setPriorityFilter(e.target.value)}
    className="border rounded-lg px-3 py-2"
  >
    <option value="all">All Priorities</option>
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
    <option value="critical">Critical</option>
  </select>

  <select
    value={taskTypeFilter}
    onChange={(e) => setTaskTypeFilter(e.target.value)}
    className="border rounded-lg px-3 py-2"
  >
    <option value="all">All Task Types</option>
    <option value="project">Project Tasks</option>
    <option value="independent">Independent Tasks</option>
  </select>
</div>
      {filteredTasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
           <div
  key={task.id}
  onClick={() => navigate(`/tasks/${task.id}`)}
  className="border rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-blue-400 transition"
>
              <h2 className="font-semibold">{task.title}</h2>

              <p className="text-sm text-gray-500">
                {task.project_name ?? "Independent Task"}
              </p>

           <div className="mt-3">
  <TaskStatusBadge status={task.status} />
</div>
            <div className="mt-2">
  <TaskPriorityBadge priority={task.priority} />
</div>

              <p>
                Assigned to: {task.assignee_name ?? "Unassigned"}
              </p>
              <p className="text-sm text-blue-600 mt-3">
  View Details →
</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskListPage;