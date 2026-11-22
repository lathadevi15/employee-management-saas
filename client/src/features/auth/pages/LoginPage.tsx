import LoginForm from "../components/LoginForm";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold">
          Welcome Back
        </h1>

        <p className="mb-6 text-gray-600">
          Login to your organization account.
        </p>

        <LoginForm />

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-700">
            Authentication status:{" "}
            <span className="font-medium">
              {isAuthenticated ? "Logged in ✅" : "Logged out ❌"}
            </span>
          </p>

          <button
            type="button"
            onClick={logout}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
