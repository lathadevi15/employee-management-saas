
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getProjectById,
  getAvailableProjectMembers,
    addProjectMembers,
  getProjectMembers,removeProjectMember,

  type Project,
  type ProjectMember,
} from "../services/project-api";

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<ProjectMember[]>([]);
const [membersLoading, setMembersLoading] = useState(true);
const [membersError, setMembersError] = useState("");

const [showAddMembers, setShowAddMembers] = useState(false);

const [availableMembers, setAvailableMembers] = useState<
  {
    id: number;
    name: string;
    email: string;
    employee_code: string | null;
    job_title: string | null;
  }[]
>([]);

const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
const [addingMembers, setAddingMembers] = useState(false);
const [addMembersError, setAddMembersError] = useState("");
const [addMembersSuccess, setAddMembersSuccess] = useState("");
const [removingUserId, setRemovingUserId] = useState<number | null>(null);
const [removeError, setRemoveError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
        setError("Invalid project ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getProjectById(Number(id));

        if (!cancelled) {
          setProject(data);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load project details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
      try {
  const teamMembers = await getProjectMembers(Number(id));

  if (!cancelled) {
    setMembers(teamMembers);
    setMembersError("");
  }
} catch {
  if (!cancelled) {
    setMembersError("Unable to load project team members.");
  }
} finally {
  if (!cancelled) {
    setMembersLoading(false);
  }
}
    }

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading project details...</div>;
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          {error || "Project not found."}
        </p>
        <Link
          to="/projects"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";

    const dateOnly = date.slice(0, 10);
    const [year, month, day] = dateOnly.split("-");

    return `${day}-${month}-${year}`;
  };

  async function openAddMembersDialog() {
  setShowAddMembers(true);
  setSelectedUserIds([]);
  setAddMembersError("");
  setAddMembersSuccess("");

  try {
    const available = await getAvailableProjectMembers(Number(id));
    setAvailableMembers(available);
  } catch {
    setAddMembersError("Unable to load available employees.");
  }
}

function toggleMember(userId: number, checked: boolean) {
  setSelectedUserIds((current) =>
    checked
      ? [...current, userId]
      : current.filter((id) => id !== userId)
  );
}

async function handleAddMembers() {
  if (!id || selectedUserIds.length === 0) {
    setAddMembersError("Select at least one employee.");
    return;
  }

  try {
    setAddingMembers(true);
    setAddMembersError("");
    setAddMembersSuccess("");

    await addProjectMembers(Number(id), selectedUserIds);

    const updatedMembers = await getProjectMembers(Number(id));
    setMembers(updatedMembers);

    const available = await getAvailableProjectMembers(Number(id));
    setAvailableMembers(available);

    setSelectedUserIds([]);
    setAddMembersSuccess("Team members added successfully.");
  } catch {
    setAddMembersError("Unable to add team members. Please try again.");
  } finally {
    setAddingMembers(false);
  }
}
async function handleRemoveMember(userId: number, memberName: string) {
  const confirmed = window.confirm(
    `Remove ${memberName} from this project? Their employee account will not be deleted.`
  );

  if (!confirmed || !id) return;

  try {
    setRemovingUserId(userId);
    setRemoveError("");

    await removeProjectMember(Number(id), userId);

    const updatedMembers = await getProjectMembers(Number(id));
    setMembers(updatedMembers);
  } catch {
    setRemoveError("Unable to remove this member. Please try again.");
  } finally {
    setRemovingUserId(null);
  }
}
  return (
    <div className="space-y-6 p-6">
      <Link
        to="/projects"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to Projects
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {project.client_name || "No client specified"}
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm capitalize text-blue-800">
            {project.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Project Manager</p>
            <p className="mt-1 font-medium">Manager ID: {project.manager_id}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Priority</p>
            <p className="mt-1 font-medium capitalize">
              {project.priority}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Budget</p>
            <p className="mt-1 font-medium">
              {project.budget == null
                ? "Not set"
                : `₹${Number(project.budget).toLocaleString("en-IN")}`}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="mt-1 font-medium">
              {formatDate(project.start_date)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Deadline</p>
            <p className="mt-1 font-medium">
              {formatDate(project.deadline)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="mt-1 font-medium">
              User ID: {project.created_by}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <h2 className="font-semibold text-gray-900">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-gray-600">
            {project.description || "No description provided."}
          </p>
        </div>
      </div>
      
<section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    {removeError && (
  <p role="alert" className="mt-3 text-sm text-red-600">
    {removeError}
  </p>
)}
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Team Members
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        People assigned to this project
      </p>
    </div>

    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
      {members.length} {members.length === 1 ? "member" : "members"}
    </span>
    <button
  type="button"
  onClick={openAddMembersDialog}
  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
>
  + Add Members
</button>
  </div>

  {membersLoading ? (
    <p className="mt-5 text-sm text-gray-500">
      Loading team members...
    </p>
  ) : membersError ? (
    <p className="mt-5 text-sm text-red-600">
      {membersError}
    </p>
  ) : members.length === 0 ? (
    <p className="mt-5 text-sm text-gray-500">
      No team members assigned yet.
    </p>
  ) : (
    <div className="mt-5 divide-y divide-gray-100">
      {members.map((member) => (
        <div
          key={member.user_id}
          className="flex flex-wrap items-center justify-between gap-3 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {member.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="font-medium text-gray-900">
                {member.name}
              </p>
              <p className="text-sm text-gray-500">
                {member.email}
              </p>
              {member.employee_code && (
                <p className="text-xs text-gray-500">
                  Employee ID: {member.employee_code}
                </p>
              )}
              {member.job_title && (
                <p className="text-xs text-gray-500">
                  {member.job_title}
                </p>
              )}
            </div>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
            {member.role.replaceAll("_", " ")}
          </span>
          {member.user_id !== project.manager_id && (
  <button
    type="button"
    onClick={() => handleRemoveMember(member.user_id, member.name)}
    disabled={removingUserId === member.user_id}
    className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
  >
    {removingUserId === member.user_id ? "Removing..." : "Remove"}
  </button>
)}
        </div>
      ))}
    </div>
  )}
</section>


{showAddMembers && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-members-title"
      className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="add-members-title"
          className="text-lg font-semibold text-gray-900"
        >
          Add Team Members
        </h2>

        <button
          type="button"
          onClick={() => setShowAddMembers(false)}
          className="text-gray-500 hover:text-gray-800"
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>

      <p className="mt-1 text-sm text-gray-500">
        Select active employees to assign to this project.
      </p>

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {availableMembers.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">
            No available employees found.
          </p>
        ) : (
          availableMembers.map((member) => (
            <label
              key={member.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedUserIds.includes(member.id)}
                onChange={(event) =>
                  toggleMember(member.id, event.target.checked)
                }
                className="mt-1"
              />

              <span>
                <span className="block font-medium text-gray-900">
                  {member.name}
                </span>
                <span className="block text-sm text-gray-500">
                  {member.email}
                </span>
                {member.job_title && (
                  <span className="block text-xs text-gray-500">
                    {member.job_title}
                  </span>
                )}
              </span>
            </label>
          ))
        )}
      </div>

      {addMembersError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {addMembersError}
        </p>
      )}

      {addMembersSuccess && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {addMembersSuccess}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowAddMembers(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleAddMembers}
          disabled={addingMembers || selectedUserIds.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addingMembers ? "Adding..." : "Add Selected"}
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}
