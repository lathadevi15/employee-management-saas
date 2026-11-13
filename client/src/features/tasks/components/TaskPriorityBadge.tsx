interface TaskPriorityBadgeProps {
  priority: string;
}

const priorityStyles: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const TaskPriorityBadge = ({ priority }: TaskPriorityBadgeProps) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        priorityStyles[priority] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

export default TaskPriorityBadge;