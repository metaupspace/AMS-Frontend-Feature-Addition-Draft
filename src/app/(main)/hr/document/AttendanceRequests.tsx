"use client";

import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Check,
  X,
  Search,
  Filter,
  Clock,
  Calendar,
  User,
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { attendanceQueries } from "@/queries/attendance";
import {
  AttendanceEditRequest,
  AttendanceReviewRequest,
} from "@/models/attendance";


export enum RequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export function AttendanceRequests() {
  const [requests, setRequests] = useState<AttendanceReviewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>(
    "all"
  );
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );

  // Fetch requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await attendanceQueries.getAllEditAttendanceRequests();
      setRequests(data || []);
    } catch (error) {
      console.error("Failed to fetch attendance requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle approval of request
  const handleApproveRequest = async (
    requestId: string,
    requestData: boolean
  ) => {
    try {
      setIsProcessing(true);
      // approval request to be added
      const response = await attendanceQueries.reviewEditRequestAttendance(requestId , showApprovalModal);
      console.log("request accepted", response);
      //
      console.log("Approving request:", requestId, requestData);

      await fetchRequests();
    } catch (error) {
      console.error("Failed to approve request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle rejection of request
  const handleRejectRequest = async (
    requestId: string,
    requestData: boolean
  ) => {
    try {
      setIsProcessing(true);
      // rejection logic to be added
      //
      const response = await attendanceQueries.reviewEditRequestAttendance(requestId , showApprovalModal);
      console.log("request accepted", response);

      //
      console.log("Rejecting request:", requestId, requestData);

      await fetchRequests();
    } catch (error) {
      console.error("Failed to reject request:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter requests based on search and filters
  // Filter requests based on search and filters
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "PENDING" && !request.reviewedBy) ||
      (statusFilter === "APPROVED" && request.reviewedBy) ||
      (statusFilter === "REJECTED" && request.reviewedBy);

    let matchesDate = true;
    if (dateFilter !== "all") {
      const requestDate = new Date(request.date);
      const now = new Date();

      switch (dateFilter) {
        case "today":
          matchesDate = requestDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = requestDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = requestDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  }).reverse();

  const handleActionClick = (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    setSelectedRequest(requestId);
    setActionType(action);
    if (action === "approve") {
      setShowApprovalModal(true);
    } else {
      setShowRejectionModal(true);
    }
  };

  const handleConfirmAction = async () => {
    if (selectedRequest && actionType) {
      try {
        const requestData = requests.find((r) => r.id === selectedRequest);
        if (!requestData) return;

        if (actionType === "approve") {
          await handleApproveRequest(selectedRequest, true);
        } else if (actionType === "reject") {
          await handleRejectRequest(selectedRequest, false);
        }
      } catch (error) {
        console.error("Failed to process request:", error);
      }
    }

    setShowApprovalModal(false);
    setShowRejectionModal(false);
    setSelectedRequest(null);
    setActionType(null);
  };

  const getStatusBadge = (request: AttendanceReviewRequest) => {
  switch (request.status) {
    case "PENDING":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">Reviewed</Badge>;
  }
};


  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "N/A";
    return new Date(dateTimeString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 animate-pulse"
              >
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Status: {statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter(RequestStatus.PENDING)}
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter(RequestStatus.APPROVED)}
                  >
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter(RequestStatus.REJECTED)}
                  >
                    Rejected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date: {dateFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setDateFilter("all")}>
                    All Time
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter("today")}>
                    Today
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter("week")}>
                    This Week
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDateFilter("month")}>
                    This Month
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Requested Times</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{request.employeeId}</p>
                          <p className="text-sm text-gray-600">
                            {request.employeeId}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm font-medium">
                        {formatDate(request.date)}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">
                          Check In: {formatDateTime(request.requestCheckIn)}
                        </p>
                        <p className="text-gray-600">
                          Check Out: {formatDateTime(request.requestCheckOut)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p
                        className="text-sm max-w-xs truncate"
                        title={request.reason}
                      >
                        {request.reason}
                      </p>
                    </TableCell>

                   <TableCell>
  {getStatusBadge(request)}
</TableCell>


                    <TableCell>
                      {request.reviewedBy ? (
                        <div className="text-sm">
                          <p className="font-medium">{request.reviewedBy}</p>
                          <p className="text-gray-600">
                            {formatDateTime(request.reviewedAt)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Not reviewed
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {!request.reviewedBy && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isProcessing}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleActionClick(request.id, "approve")
                              }
                              className="text-green-600 focus:text-green-600"
                              disabled={isProcessing}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleActionClick(request.id, "reject")
                              }
                              className="text-red-600 focus:text-red-600"
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance requests found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={handleConfirmAction}
        title="Approve Attendance Request"
        description="Are you sure you want to approve this attendance edit request?"
        confirmText="Approve"
        isLoading={isProcessing}
        variant="default"
      />

      {/* Rejection Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleConfirmAction}
        title="Reject Attendance Request"
        description="Are you sure you want to reject this attendance edit request? This action cannot be undone."
        confirmText="Reject"
        isLoading={isProcessing}
        variant="destructive"
      />
    </>
  );
}
