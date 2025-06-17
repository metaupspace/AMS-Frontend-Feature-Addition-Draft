"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar, CheckCircle } from "lucide-react";
import { hrQueries } from "@/queries/hr";
import { toast } from "@/hooks/use-toast";
import { MonthlyReportRequest } from "@/models/hr";

const monthlyReportSchema = z.object({
  year: z.number().min(2020, "Year must be 2020 or later").max(2030, "Year must be 2030 or earlier"),
  month: z.number().min(1, "Month must be between 1-12").max(12, "Month must be between 1-12"),
});

type MonthlyReportFormData = z.infer<typeof monthlyReportSchema>;

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MonthlyReportModal({
  isOpen,
  onClose,
}: MonthlyReportModalProps) {
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportDetails, setReportDetails] = useState<string>("");

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const form = useForm<MonthlyReportFormData>({
    resolver: zodResolver(monthlyReportSchema),
    defaultValues: {
      year: currentYear,
      month: currentMonth,
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: hrQueries.generateMonthlyReport,
    onSuccess: (data) => {
      setReportGenerated(true);
      setReportDetails(data.message);
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate monthly report",
        variant: "destructive",
      });
      console.error("Generate report error:", error);
    },
  });

  const onSubmit = (data: MonthlyReportFormData) => {
    const requestData: MonthlyReportRequest = {
      year: data.year,
      month: data.month,
    };
    generateReportMutation.mutate(requestData);
  };

  const handleClose = () => {
    form.reset();
    setReportGenerated(false);
    setReportDetails("");
    onClose();
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5" />
            Generate Monthly Report
          </DialogTitle>
        </DialogHeader>

        {!reportGenerated ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Monthly Timesheet Report</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Generate and email monthly attendance reports for all employees to HR.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  {/* Year Selection */}
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Month Selection */}
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={generateReportMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={generateReportMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {generateReportMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Generate & Email Report
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          /* Success State */
          <div className="space-y-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-2">Report Generated Successfully!</h4>
                    <p className="text-sm text-green-700">
                      {reportDetails}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}