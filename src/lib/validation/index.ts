import * as z from "zod";

export const SignupValidation = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  username: z
    .string()
    .min(2, { message: "UserName must be at least 2 characters" }),
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

export const SigninValidation = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});
// Profile Validation
export const ProfileValidation = z.object({
  file: z.custom<File[]>(),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  username: z
    .string()
    .min(2, { message: "UserName must be at least 2 characters" })
    .max(100, { message: "UserName must be less than 100 characters" }),
  email: z.string().email(),
  bio: z.string(),
});

// POST VALIDATION
export const PostValidation = z.object({
  caption: z
    .string()
    .min(5, { message: "Caption must be at least 5 characters" })
    .max(2200, { message: "Caption must be less than 2200 characters" }),
  file: z.custom<File[]>(),
  location: z
    .string()
    .min(3, { message: "Location must be at least 3 characters" })
    .max(1000, { message: "Location must be less than 1000 characters" }),
  tags: z.string(),
});
