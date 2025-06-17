import { z } from "zod";
// Updated Employee Schema to match API requirements
export const EmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  password: z.string().optional()
    .refine(
      (val) => val === undefined || val === "" || val.length >= 6, 
      { message: "Password must be at least 6 characters" }
    ),
  role: z.string().min(1, "Role is required"),
});