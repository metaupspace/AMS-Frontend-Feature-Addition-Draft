"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  CheckCircle,
  Circle,
  ExternalLink,
  MessageSquare,
  Timer,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { attendanceQueries } from "@/queries/attendance";
import { toast } from "@/hooks/use-toast";
import { CheckOutRequest, AttendanceRecord } from "@/models/attendance";

const checkOutSchema = z.object({
  remark: z.string().optional(),
  referenceLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CheckOutFormData = z.infer<typeof checkOutSchema>;

interface CheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentSession: AttendanceRecord | null;
}

export function CheckOutModal({
  isOpen,
  onClose,
  onSuccess,
  currentSession,
}: CheckOutModalProps) {
  const [agendaCompletions, setAgendaCompletions] = useState<{[key: string]: boolean}>({});

  const form = useForm<CheckOutFormData>({
    resolver: zodResolver(checkOutSchema),
    defaultValues: {
      remark: "",
      referenceLink: "",
    },
  });

  // Get agendas for current session
  const {
    data: sessionAgendas = [],
    isLoading: agendasLoading,
  } = useQuery({
    queryKey: ["session-agendas", currentSession?.id],
    queryFn: () => currentSession ? attendanceQueries.getAttendanceAgendas(currentSession.id) : [],
    enabled: !!currentSession?.id && isOpen,
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceQueries.checkOut,
    onSuccess: (data) => {
      const totalHours = Math.floor(data.totalMinutesWorked / 60);
      const totalMinutes = data.totalMinutesWorked % 60;
      
      toast({
        title: "Successfully Checked Out!",
        description: `Great work today! Total time: ${totalHours}h ${totalMinutes}m`,
        duration: 5000,
      });
      form.reset();
      setAgendaCompletions({});
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check out",
        variant: "destructive",
      });
    },
  });

  // Initialize agenda completions when session agendas load
  useEffect(() => {
    if (sessionAgendas.length > 0) {
      const initialCompletions = sessionAgendas.reduce((acc, agenda) => {
        acc[agenda.id] = agenda.complete;
        return acc;
      }, {} as {[key: string]: boolean});
      setAgendaCompletions(initialCompletions);
    }
  }, [sessionAgendas]);

  const toggleAgendaCompletion = (agendaId: string) => {
    setAgendaCompletions(prev => ({
      ...prev,
      [agendaId]: !prev[agendaId],
    }));
  };

  const calculateWorkingTime = (checkInTime: string) => {
    const startTime = new Date(checkInTime);
    const currentTime = new Date();
    const diffMs = currentTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, total: `${hours}h ${minutes}m` };
  };

  const getCompletionStats = () => {
    const completed = Object.values(agendaCompletions).filter(Boolean).length;
    const total = sessionAgendas.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const onSubmit = (data: CheckOutFormData) => {
    if (!currentSession) return;

    const completions = sessionAgendas.map(agenda => ({
      agendaId: agenda.id,
      complete: agendaCompletions[agenda.id] || false,
    }));

    const checkOutData: CheckOutRequest = {
      employeeId: currentSession.employeeId,
      agendaCompletions: completions,
      remark: data.remark?.trim() || "",
      referenceLink: data.referenceLink?.trim() || "",
    };

    checkOutMutation.mutate(checkOutData);
  };

  const handleClose = () => {
    form.reset();
    setAgendaCompletions({});
    onClose();
  };

  if (!currentSession) return null;

  const workingTime = calculateWorkingTime(currentSession.checkInTime);
  const completionStats = getCompletionStats();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LogOut className="h-6 w-6 text-red-600" />
            Check Out
          </DialogTitle>
        </DialogHeader>

        {/* Working Time Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-blue-700">Check-in Time</p>
                <p className="text-lg font-semibold text-blue-900">
                  {format(new Date(currentSession.checkInTime), "hh:mm a")}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-blue-700">Current Time</p>
                <p className="text-lg font-semibold text-blue-900">
                  {format(new Date(), "hh:mm a")}
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-blue-700">Total Time</p>
                <p className="text-xl font-bold text-blue-900">
                  {workingTime.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agenda Completion */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Today`s Agenda Progress</h4>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {completionStats.completed}/{completionStats.total} Completed ({completionStats.percentage}%)
              </Badge>
            </div>
            
            {agendasLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {sessionAgendas.map((agenda) => (
                  <div
                    key={agenda.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleAgendaCompletion(agenda.id)}
                  >
                    {agendaCompletions[agenda.id] ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`flex-1 ${
                      agendaCompletions[agenda.id] 
                        ? "line-through text-gray-500" 
                        : "text-gray-900"
                    }`}>
                      {agenda.title}
                    </span>
                    {agendaCompletions[agenda.id] && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-600 mt-3">
              Click on agendas to mark them as complete or incomplete
            </p>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Remark */}
            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    End-of-Day Remarks (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts about today's work, achievements, or any notes for tomorrow..."
                      {...field}
                      className="min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-600">
                    Optional: Add any comments about your work today
                  </p>
                </FormItem>
              )}
            />

            {/* Reference Link */}
            <FormField
              control={form.control}
              name="referenceLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Reference Link (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/project-link"
                      {...field}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-600">
                    Optional: Link to any relevant work, documentation, or project
                  </p>
                </FormItem>
              )}
            />

            {/* Summary Card */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Timer className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Day Summary</h4>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Working Time: <span className="font-semibold">{workingTime.total}</span></p>
                    <p className="text-green-700">Agendas Completed: <span className="font-semibold">{completionStats.completed}/{completionStats.total}</span></p>
                  </div>
                  <div>
                    <p className="text-green-700">Completion Rate: <span className="font-semibold">{completionStats.percentage}%</span></p>
                    <p className="text-green-700">Date: <span className="font-semibold">{format(new Date(), "MMM dd, yyyy")}</span></p>
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
                disabled={checkOutMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={checkOutMutation.isPending}
                className="bg-red-600 hover:bg-red-700 px-8"
                size="lg"
              >
                {checkOutMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Checking Out...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    Check Out & End Day
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