"use client";

import { cn } from "@/utils/regex";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import hero_image from "../../../../public/Meta-Up-Space1.jpg";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/sonner";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, Clock } from "lucide-react";
import { loginSchema, LoginFormData } from "@/schemas/auth";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, isLoading, isInitialized } = useAuth();
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    // Don't submit if auth context isn't initialized yet
    if (!isInitialized) {
      console.log('Auth context not initialized yet, please wait...');
      return;
    }
    
    setLoginError("");
    
    try {
      const success = await login(data.email, data.password);
      
      if (success) {
        toast.success("Login successful! Redirecting...");
        // Use setTimeout to ensure the state update is processed
        setTimeout(() => {
          router.push("/profile");
        }, 100);
      } else {
        const errorMessage = "Invalid credentials. Please check your email and password.";
        setLoginError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error("Error in login submission:", err);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err?.response?.status === 401) {
        errorMessage = "Invalid credentials. Please check your email and password.";
      } else if (err?.response?.status === 403) {
        errorMessage = "Access forbidden. Please contact your administrator.";
      } else if (err?.response?.status) {
        errorMessage = `Login failed. Server error (${err.response.status}).`;
      }
      
      setLoginError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Show loading state while auth context initializes
  if (!isInitialized) {
    return (
      <div className={cn("flex flex-col gap-6 min-h-screen items-center justify-center", className)} {...props}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-0 shadow-xl">
        <CardContent className="grid grid-cols-1 md:grid-cols-2 p-0">
          {/* Left Panel - Image Section */}
          <div className="relative hidden md:block ">
            <div className="absolute inset-0">
              <Image
                src={hero_image}
                alt="MetaUpSpace Logo"
                fill
                className="object-contain  "
                priority
                sizes="(max-width: 768px) 0px, 50vw"
              />
            </div>
          
          </div>

          {/* Right Panel - Form Section */}
          <div className="flex flex-col justify-center p-8 md:p-12 gap-4">
            {/* Mobile Header */}
            <div className="md:hidden text-center mb-6">
              <div className="w-16 h-16 bg-[#EDF8FD] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-[#1E6AB7]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AttendanceHub</h1>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500">Sign in to access your attendance dashboard</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {loginError}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
                noValidate
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          className="border-gray-300 focus:border-[#1E6AB7] focus:ring-[#1E6AB7] rounded-lg h-11"
                          placeholder="Enter your work email" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            {...field} 
                            className="border-gray-300 focus:border-[#1E6AB7] focus:ring-[#1E6AB7] rounded-lg h-11 pr-10"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400 hover:text-[#1E6AB7]" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400 hover:text-[#1E6AB7]" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <Button 
                  disabled={isLoading || !isInitialized} 
                  type="submit" 
                  className="mt-4 bg-[#1E6AB7] hover:bg-[#1E6AB7]/90 text-white py-3 rounded-lg transition-colors h-11 font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}