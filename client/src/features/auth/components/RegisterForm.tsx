import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser } from "../api";
import { useNavigate } from "react-router-dom";

import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas";

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });
  const navigate = useNavigate();

 const onSubmit = async (data: RegisterFormValues) => {
  try {
    const response = await registerUser(data);

    console.log("Registration successful:", response);

    navigate("/login");
  } catch (error) {
    console.error("Registration failed:", error);
  }
};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Organization Name</label>
        <input
          {...register("organizationName")}
          className="border p-2"
        />
        {errors.organizationName && (
          <p>{errors.organizationName.message}</p>
        )}
      </div>

      <div>
        <label>Name</label>
        <input
          {...register("name")}
          className="border p-2"
        />
        {errors.name && <p>{errors.name.message}</p>}
      </div>

      <div>
        <label>Email</label>
        <input
          {...register("email")}
          className="border p-2"
        />
        {errors.email && <p>{errors.email.message}</p>}
      </div>

      <div>
        <label>Phone</label>
        <input
          {...register("phone")}
          className="border p-2"
        />
        {errors.phone && <p>{errors.phone.message}</p>}
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          {...register("password")}
          className="border p-2"
        />
        {errors.password && <p>{errors.password.message}</p>}
      </div>

      <div>
        <label>Confirm Password</label>
        <input
          type="password"
          {...register("confirmPassword")}
          className="border p-2"
        />
        {errors.confirmPassword && (
          <p>{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" className="border px-4 py-2">
        Create Account
      </button>
    </form>
  );
}