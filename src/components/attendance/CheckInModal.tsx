"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  X, 
  MapPin, 
  Clock, 
  CheckCircle,
  User,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { attendanceQueries } from "@/queries/attendance";
import { toast } from "@/hooks/use-toast";
import { CheckInRequest } from "@/models/attendance";
import { EmployeeProfile } from "@/models/employee";

const checkInSchema = z.object({
  agendas: z.array(z.string().min(1, "Agenda cannot be empty")).min(1, "At least one agenda is required"),
  location: z.string().min(1, "Location is required"),
});

type CheckInFormData = z.infer<typeof checkInSchema>;

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: EmployeeProfile | null;
}

export function CheckInModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
}: CheckInModalProps) {
  const [agendas, setAgendas] = useState<string[]>([""]);

  const form = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      agendas: [""],
      location: "",
    },
  });

  const checkInMutation = useMutation({
    mutationFn: attendanceQueries.checkIn,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checked in successfully! Have a productive day!",
        duration: 5000,
      });
      form.reset();
      setAgendas([""]);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  // Auto-detect location when modal opens
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          form.setValue("location", `${latitude},${longitude}`);
        },
        () => {
          // Fallback if geolocation fails
          form.setValue("location", "Location not available");
        }
      );
    }
  }, [isOpen, form]);

  const addAgenda = () => {
    setAgendas([...agendas, ""]);
  };

  const removeAgenda = (index: number) => {
    if (agendas.length > 1) {
      const newAgendas = agendas.filter((_, i) => i !== index);
      setAgendas(newAgendas);
      form.setValue("agendas", newAgendas);
    }
  };

  const updateAgenda = (index: number, value: string) => {
    const newAgendas = [...agendas];
    newAgendas[index] = value;
    setAgendas(newAgendas);
    form.setValue("agendas", newAgendas);
  };

  const onSubmit = (data: CheckInFormData) => {
    if (!employee) return;
    
    const validAgendas = data.agendas.filter(agenda => agenda.trim() !== "");
    if (validAgendas.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one agenda",
        variant: "destructive",
      });
      return;
    }

    const checkInData: CheckInRequest = {
      employeeId: employee.employeeId,
      agendas: validAgendas,
      location: data.location.trim(),
    };

    checkInMutation.mutate(checkInData);
  };

  const handleClose = () => {
    form.reset();
    setAgendas([""]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-6 w-6 text-green-600" />
            Check In for Today
          </DialogTitle>
        </DialogHeader>

        {/* Employee Info */}
        {employee && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">{employee.name}</h4>
                    <p className="text-sm text-blue-700">{employee.employeeId}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-800">
                    {employee.role}
                  </Badge>
                  <p className="text-xs text-blue-600 mt-1">
                    {format(new Date(), "EEEE, MMM do")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Time Display */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Check-in Time</p>
                    <p className="text-lg font-semibold text-green-900">
                      {format(new Date(), "hh:mm a")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Current Location *
                  </FormLabel>
                    <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                      placeholder="Detecting your current location..."
                      {...field}
                      className="pl-11 h-12"
                      disabled
                      readOnly
                      />
                    </div>
                    </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-600">
                    Your location helps track attendance accurately
                  </p>
                </FormItem>
              )}
            />

            {/* Agendas */}
            <div>
              <FormLabel className="text-base font-medium mb-4 block">
                Today`s Agendas *
              </FormLabel>
              <p className="text-sm text-gray-600 mb-4">
                List the tasks or goals you plan to work on today
              </p>
              
              <div className="space-y-3">
                {agendas.map((agenda, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder={`Agenda ${index + 1} (e.g., Complete project proposal)`}
                          value={agenda}
                          onChange={(e) => updateAgenda(index, e.target.value)}
                          className="pl-10 h-11"
                        />
                      </div>
                    </div>
                    {agendas.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeAgenda(index)}
                        className="h-11 px-3"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={addAgenda}
                className="mt-3 w-full"
                disabled={agendas.length >= 10}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Agenda {agendas.length >= 10 && "(Max 10)"}
              </Button>
            </div>

            {/* Tips */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-2">Tips for Better Productivity</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Be specific with your agendas</li>
                      <li>• Set realistic and achievable goals</li>
                      <li>• Update your progress throughout the day</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={checkInMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={checkInMutation.isPending}
                className="bg-green-600 hover:bg-green-700 px-8"
                size="lg"
              >
                {checkInMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Checking In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Check In & Start Day
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}