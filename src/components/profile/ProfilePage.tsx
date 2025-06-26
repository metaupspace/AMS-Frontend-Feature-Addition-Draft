"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Key,
  Shield,
  Calendar,
  Building
} from "lucide-react";
import { employeeQueries } from "@/queries/employee";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { format } from "date-fns";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["employee-profile"],
    queryFn: employeeQueries.getProfile,
  });

  // const formatSalary = (salary: number) => {
  //   if (salary === 0) return "Not specified";
  //   return new Intl.NumberFormat('en-IN', {
  //     style: 'currency',
  //     currency: 'INR',
  //     maximumFractionDigits: 0,
  //   }).format(salary);
  // };

  const getRoleBadge = (role: string) => {
    const colors = {
      HR: "bg-purple-100 text-purple-800",
      EMPLOYEE: "bg-blue-100 text-blue-800",
    };
    
    return (
      <Badge 
        variant="outline" 
        className={colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"}
      >
        {role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load profile
          </h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and settings</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPasswordForm(true)}
            variant="outline"
            size="sm"
          >
            <Key className="h-4 w-4 mr-2" />
            Change Password
          </Button>
          
        
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Professional Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{profile.name}</h2>
                    <p className="text-gray-600">{profile.employeeId}</p>
                    <div className="mt-2">
                      {getRoleBadge(profile.role)}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium">{profile.contact}</p>
                    </div>
                  </div>
                  
                  {profile.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">{profile.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className="bg-green-100 text-green-800 mt-1">
                      {profile.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-semibold text-blue-900">{profile.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Employee ID</span>
                    <span className="font-mono text-sm">{profile.employeeId}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Account Created</span>
                    <span className="text-sm">{format(new Date(), "MMM yyyy")}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm">Recently</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Professional Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Position</p>
                    <p className="font-medium">
                      {profile.position || "Not specified"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium">{profile.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">
                      {profile.role === "HR" ? "Human Resources" :"General"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compensation
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Compensation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Annual Salary</p>
                    <p className="font-medium text-lg">
                      {formatSalary(profile.yearlySalary)}
                    </p>
                  </div>
                </div>
                
                {profile.yearlySalary > 0 && (
                  <>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Monthly Salary</p>
                        <p className="font-medium">
                          {formatSalary(profile.yearlySalary / 12)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your salary information is confidential and secure.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card> */}
          </div>
        </TabsContent>
      </Tabs>

     

      <ChangePasswordForm
        isOpen={showPasswordForm}
        onClose={() => setShowPasswordForm(false)}
        onSuccess={() => setShowPasswordForm(false)}
      />
    </div>
  );
}