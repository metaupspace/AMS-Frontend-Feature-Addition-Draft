"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {formatTime} from "@/utils/formatTime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  Clock,
  MapPin,
  Search,
  RefreshCw,
  Download,
  Filter,
  Timer,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format} from "date-fns";
import { AttendanceRecord } from "@/models/attendance";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AttendanceTable({ records, isLoading, onRefresh }: AttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "active" | "incomplete">("all");
  const [sortBy, setSortBy] = useState<"date" | "duration" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort records
  const filteredRecords = records
    .filter((record) => {
      const matchesSearch = 
        record.checkInLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        format(new Date(record.checkInTime), "MMM dd, yyyy").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && record.activeSession) ||
        (statusFilter === "completed" && record.checkOutTime && !record.activeSession) ||
        (statusFilter === "incomplete" && !record.checkOutTime && !record.activeSession);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
          break;
        case "duration":
          const aDuration = a.minutesWorked || 0;
          const bDuration = b.minutesWorked || 0;
          comparison = aDuration - bDuration;
          break;
        case "status":
          const aStatus = a.activeSession ? "active" : (a.checkOutTime ? "completed" : "incomplete");
          const bStatus = b.activeSession ? "active" : (b.checkOutTime ? "completed" : "incomplete");
          comparison = aStatus.localeCompare(bStatus);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.activeSession) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <Timer className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (record.checkOutTime) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <XCircle className="h-3 w-3 mr-1" />
        Incomplete
      </Badge>
    );
  };

  const calculateStats = () => {
    const totalDays = records.length;
    const completedDays = records.filter(r => r.checkOutTime && !r.activeSession).length;
    const totalHours = records.reduce((sum, r) => sum + (r.minutesWorked || 0), 0) / 60;
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0;
    
    return { totalDays, completedDays, totalHours, avgHours };
  };

  const stats = calculateStats();
  const currentMonth = format(new Date(), "MMMM yyyy");

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Check In", "Check Out", "Duration", "Location", "Status"];
    const csvData = filteredRecords.map(record => [
      format(new Date(record.checkInTime), "yyyy-MM-dd"),
      formatTime(record.checkInTime),
      record.checkOutTime ? formatTime(record.checkOutTime) : "N/A",
      formatDuration(record.minutesWorked),
      record.checkInLocation,
      record.activeSession ? "Active" : (record.checkOutTime ? "Completed" : "Incomplete")
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${format(new Date(), "yyyy-MM")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedDays}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Daily</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgHours.toFixed(1)}h</p>
              </div>
              <Timer className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Records - {currentMonth}
            </CardTitle>
            
            <div className="flex gap-2">
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                disabled={filteredRecords.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by date or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("date")}
                      className="h-8 px-2 font-medium"
                    >
                      Date
                      {sortBy === "date" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("duration")}
                      className="h-8 px-2 font-medium"
                    >
                      Duration
                      {sortBy === "duration" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort("status")}
                      className="h-8 px-2 font-medium"
                    >
                      Status
                      {sortBy === "status" && (
                        <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow 
                    key={record.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(record.checkInTime), "MMM dd, yyyy")}
                        </p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(record.checkInTime), "EEEE")}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          {formatTime(record.checkInTime)}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {record.checkOutTime ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span className="font-medium">
                            {formatTime(record.checkOutTime)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {record.activeSession ? "In Progress" : "Not checked out"}
                        </span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-medium">
                        {formatDuration(record.minutesWorked)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{record.checkInLocation}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(record)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Records Found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all" 
                  ? "No attendance records match your current filters."
                  : `No attendance records found for ${currentMonth}.`
                }
              </p>
              {(searchTerm || statusFilter !== "all") && (
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Table Footer */}
          {filteredRecords.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {filteredRecords.length} of {records.length} records
              </p>
              <p className="text-sm text-gray-600">
                Total hours this month: {stats.totalHours.toFixed(1)}h
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}