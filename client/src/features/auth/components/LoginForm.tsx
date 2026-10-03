import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveAccessToken } from "../auth-storage";
import { useAuth } from "../AuthContext";

import {
  loginSchema,
  type LoginFormValues,
} from "../schemas";

import { loginUser } from "../api";

export default function LoginForm() {
    const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await loginUser(data);

login(response.data.token);

console.log("Login successful:", response);
saveAccessToken(response.data.token);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Email</label>

        <input
          type="email"
          {...register("email")}
          className="border p-2"
        />

        {errors.email && (
          <p>{errors.email.message}</p>
        )}
      </div>

      <div>
        <label>Password</label>

        <input
          type="password"
          {...register("password")}
          className="border p-2"
        />

        {errors.password && (
          <p>{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="border px-4 py-2"
      >
        Login
      </button>
    </form>
  );
}