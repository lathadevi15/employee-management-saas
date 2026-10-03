import RegisterForm from "../components/RegisterForm";


export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold">
          Create your organization
        </h1>

        <p className="mb-6 text-gray-600">
          Register your organization and administrator account.
        </p>

        <RegisterForm />
      </div>
    </div>
  );
}