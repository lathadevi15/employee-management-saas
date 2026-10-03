import LoginForm from "../components/LoginForm";
import { useAuth } from "../AuthContext";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();

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

        <p className="mt-4">
          Authentication status:{" "}
          {isAuthenticated ? "Logged in ✅" : "Logged out ❌"}
        </p>
      </div>
    </div>
  );
}