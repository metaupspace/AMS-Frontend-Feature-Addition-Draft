"use client";

import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FilterX, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export interface SelectOption {
  label: string;
  value: string;
}

export type DataTableFilter = {
  placeholder: string;
  key: string;
  type: "text" | "select" | "date";
  options?: SelectOption[] | string[];
  additionalCols?: string[];
  // New properties for controlled inputs (optional for backward compatibility)
  value?: string;
  onChange?: (value: any) => void;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filters?: DataTableFilter[];
  // Existing optional properties
  isLoading?: boolean;
  truncateConfig?: {
    enabled: boolean;
    maxLength?: number; // Default will be applied if not provided
  };
  // Row selection properties (optional for backward compatibility)
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRowIds: string[]) => void;
  // Server-side pagination properties
  serverSide?: boolean;
  paginationData?: {
    total: number;
    page: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  onPaginationChange?: (page: number, pageSize: number) => void;
  // Optional pagination properties for backward compatibility
  pageSize?: number;
  enablePagination?: boolean;
}

// Text truncation component with tooltip (unchanged)
export const TruncatedText = ({ 
  text, 
  maxLength = 50, 
  className = "" 
}: { 
  text: string; 
  maxLength?: number; 
  className?: string;
}) => {
  // Convert to string and check if truncation is needed
  const stringText = String(text);
  const needsTruncation = stringText.length > maxLength;
  
  // If no truncation needed, just return the text
  if (!needsTruncation) {
    return <span className={className}>{stringText}</span>;
  }
  
  // Truncate and add tooltip for full text
  const truncatedText = `${stringText.substring(0, maxLength)}...`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`cursor-help ${className}`}>{truncatedText}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-md p-2">
          <p className="whitespace-pre-wrap break-words">{stringText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function DataTable<TData, TValue>({
  columns,
  data,
  filters,
  isLoading = false,
  truncateConfig = { enabled: true, maxLength: 50 },
  enableRowSelection = false,
  serverSide = false,
  paginationData,
  onPaginationChange,
  pageSize = 10,
  enablePagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // For server-side pagination, we don't manage row selection state here
  const [rowSelection, setRowSelection] = useState({});
  
  // Proper pagination state management
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Update pagination state when server-side pagination data changes or pageSize prop changes
  useEffect(() => {
    if (serverSide && paginationData) {
      setPagination(prev => ({
        pageIndex: paginationData.page - 1, // Convert to 0-based indexing
        pageSize: prev.pageSize, // Keep existing page size
      }));
    } else {
      // For client-side pagination, update pageSize when prop changes
      setPagination(prev => ({
        ...prev,
        pageSize: pageSize,
      }));
    }
  }, [serverSide, paginationData?.page, paginationData?.totalPages, pageSize,paginationData]);
  
  // Apply truncation wrapper to all cell renders if enabled
  const processedColumns = truncateConfig.enabled
    ? columns.map((column) => ({
        ...column,
        cell: (props: any) => {
          const originalContent = flexRender(
            column.cell,
            props
          );
          
          // If the content is a string or can be converted to string, apply truncation
          const contentValue = props.getValue();
          
          if (contentValue !== null && contentValue !== undefined) {
            // Skip truncation for certain types of content (JSX elements, buttons, etc.)
            const isSimpleValue = typeof contentValue === 'string' || 
                                 typeof contentValue === 'number' ||
                                 typeof contentValue === 'boolean';
                                 
            if (isSimpleValue) {
              return (
                <TruncatedText 
                  text={String(contentValue)} 
                  maxLength={truncateConfig.maxLength || 50} 
                  className="inline-block"
                />
              );
            }
          }
          
          // For complex content, render as is
          return originalContent;
        },
      }))
    : columns;

  // Initialize the table with enhanced configuration
  const table = useReactTable({
    data,
    columns: processedColumns,
    getCoreRowModel: getCoreRowModel(),
    // Configure pagination based on serverSide prop
    ...(serverSide ? {
      manualPagination: true,
      pageCount: paginationData?.totalPages || 0,
      // For server-side, disable filtering since it's handled by the server
      manualFiltering: true,
    } : enablePagination ? {
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: setPagination,
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
    } : {
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
    }),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    // For server-side pagination, we disable built-in row selection
    // and handle it externally via onRowSelectionChange
    ...(enableRowSelection && !serverSide && {
      enableRowSelection: true,
      onRowSelectionChange: setRowSelection,
    }),
    state: {
      sorting,
      // For server-side, don't include columnFilters in table state
      // as filtering is handled externally
      ...(!serverSide && { columnFilters }),
      // Always include pagination state but handle it differently for server-side
      pagination: serverSide ? {
        pageIndex: (paginationData?.page || 1) - 1,
        pageSize: pagination.pageSize,
      } : pagination,
      // Include row selection state only for client-side
      ...(!serverSide && enableRowSelection && { rowSelection }),
    },
  });

  // Handle server-side pagination changes
  const handleServerPaginationChange = useCallback((newPageIndex: number, newPageSize?: number) => {
    if (onPaginationChange) {
      const currentPageSize = newPageSize || pagination.pageSize;
      // Update local state immediately for responsive UI
      setPagination({
        pageIndex: newPageIndex,
        pageSize: currentPageSize,
      });
      // Then call the server
      onPaginationChange(newPageIndex + 1, currentPageSize); // Convert to 1-based indexing
    }
  }, [onPaginationChange, pagination.pageSize]);

  // Reset filters function
  const handleResetFilters = useCallback(() => {
    // For server-side, only notify parent components
    filters?.forEach(filter => {
      if (filter.onChange) {
        filter.onChange("");
      }
    });

    // For client-side, also reset table filters
    if (!serverSide) {
      filters?.forEach(({ key }) => {
        const column = table.getColumn(key);
        if (column) {
          column.setFilterValue(undefined);
        }
      });
    }
  }, [filters, serverSide, table]);

  // Don't render pagination if it's disabled and not server-side
  const shouldShowPagination = serverSide || enablePagination;

  // Get current page size for display
  const currentPageSize = serverSide ? pagination.pageSize : table.getState().pagination.pageSize;

  return (
    <div>
      {/* Filters Section */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center py-4 gap-2">
          {filters?.map(({ type, key, placeholder, options, additionalCols, value, onChange }) => {
            const column = table.getColumn(key);
            // For server-side, use the value prop directly
            // For client-side, fall back to column filter value
            const filterValue = serverSide ? (value ?? "") : (value !== undefined ? value : (column?.getFilterValue() ?? ""));

            const commonClassName = "min-w-[200px] max-w-sm w-full";

            if (type === "text") {
              return (
                <div key={key} className="relative">
                  <Input
                    placeholder={placeholder}
                    value={filterValue as string}
                    onChange={(event) => {
                      const newValue = event.target.value;
                      
                      // For server-side, only notify parent
                      if (serverSide) {
                        if (onChange) {
                          onChange(newValue);
                        }
                      } else {
                        // For client-side, update both table filter and notify parent
                        column?.setFilterValue(newValue);
                        if (onChange) {
                          onChange(newValue);
                        }
                      }
                    }}
                    className={commonClassName}
                  />
                  {/* Show loading indicator when searching */}
                  {isLoading && filterValue && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            }

            if (type === "date") {
              const dateFilterValue = serverSide 
                ? (value as any) || { startDate: "", endDate: "" }
                : (column?.getFilterValue() as { startDate: string; endDate: string }) ?? {
                    startDate: "",
                    endDate: "",
                  };

              const handleDateChange = (
                event: React.ChangeEvent<HTMLInputElement>,
                dateType: "startDate" | "endDate"
              ) => {
                const updatedRange = {
                  ...dateFilterValue,
                  [dateType]: event.target.value,
                };

                if (serverSide) {
                  // For server-side, only notify parent
                  if (onChange) {
                    onChange(updatedRange);
                  }
                } else {
                  // For client-side, update table and notify parent
                  column?.setFilterValue(updatedRange);
                  if (onChange) {
                    onChange(updatedRange);
                  }

                  additionalCols?.forEach((item) => {
                    const extraColumn = table.getColumn(item);
                    if (extraColumn) {
                      extraColumn.setFilterValue(updatedRange);
                    }
                  });
                }
              };

              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 border rounded p-2 ${commonClassName}`}
                >
                  <Input
                    type="date"
                    value={dateFilterValue.startDate}
                    onChange={(event) => handleDateChange(event, "startDate")}
                    className="border rounded px-2 py-1 text-sm w-full"
                  />
                  <Badge variant="outline" className="px-3 py-1 text-xs whitespace-nowrap">
                    {placeholder}
                  </Badge>
                  <Input
                    type="date"
                    value={dateFilterValue.endDate}
                    onChange={(event) => handleDateChange(event, "endDate")}
                    className="border rounded px-2 py-1 text-sm w-full"
                  />
                </div>
              );
            }

            if (type === "select" && options) {
              return (
                <Select
                  key={key}
                  value={filterValue as string}
                  onValueChange={(value) => {
                    if (serverSide) {
                      // For server-side, only notify parent
                      if (onChange) {
                        onChange(value);
                      }
                    } else {
                      // For client-side, update table and notify parent
                      column?.setFilterValue(value);
                      if (onChange) {
                        onChange(value);
                      }
                    }
                  }}
                >
                  <SelectTrigger className={commonClassName}>
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((item) => {
                      const isObject =
                        typeof item === "object" && item !== null && "label" in item && "value" in item;
                      const label = isObject ? (item as SelectOption).label : String(item);
                      const value = isObject ? (item as SelectOption).value : String(item);

                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              );
            }

            return null;
          })}
        </div>

        {/* Reset Filter Button */}
        <div className="flex flex-col justify-center">
          <Button variant="outline" onClick={handleResetFilters}>
            Reset Filter <FilterX />
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Enhanced loading state with shimmer effect
              Array.from({ length: currentPageSize }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {Array.from({ length: columns.length }).map((_, colIndex) => (
                    <TableCell key={`loading-cell-${colIndex}`}>
                      <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                // For server-side pagination, we need to get selection state from props
                const isSelected = serverSide && enableRowSelection 
                  ? false // Selection state is managed externally for server-side
                  : row.getIsSelected();
                
                return (
                  <TableRow 
                    key={row.id} 
                    data-state={isSelected ? "selected" : undefined}
                    // Enhanced row selection styling when enabled
                    className={enableRowSelection && isSelected ? "bg-muted/50" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="max-w-md">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    "No results."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Pagination Section */}
      {shouldShowPagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          {/* Left side - Rows per page selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Rows per page:</span>
            <Select
              value={currentPageSize.toString()}
              onValueChange={(value) => {
                const newPageSize = Number(value);
                if (serverSide) {
                  // For server-side pagination, call the parent handler
                  handleServerPaginationChange(0, newPageSize);
                } else {
                  // For client-side pagination, update local state
                  setPagination({
                    pageIndex: 0,
                    pageSize: newPageSize,
                  });
                }
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Center - Page info with loading indicator */}
          <div className="flex items-center space-x-2">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {serverSide && paginationData ? (
                <>
                  Showing {((paginationData.page - 1) * currentPageSize) + 1} to{" "}
                  {Math.min(paginationData.page * currentPageSize, paginationData.total)}{" "}
                  of {paginationData.total} entries
                </>
              ) : (
                <>
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{" "}
                  of {table.getFilteredRowModel().rows.length} entries
                </>
              )}
            </span>
          </div>

          {/* Right side - Navigation buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (serverSide) {
                  handleServerPaginationChange(0);
                } else {
                  table.setPageIndex(0);
                }
              }}
              disabled={isLoading || (serverSide ? (paginationData?.page === 1) : !table.getCanPreviousPage())}
            >
              First
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (serverSide) {
                  const currentPage = paginationData?.page || 1;
                  handleServerPaginationChange(currentPage - 2); // Convert to 0-based
                } else {
                  table.previousPage();
                }
              }}
              disabled={isLoading || (serverSide ? (paginationData?.page === 1) : !table.getCanPreviousPage())}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {serverSide ? paginationData?.page : table.getState().pagination.pageIndex + 1} of{" "}
              {serverSide ? paginationData?.totalPages : table.getPageCount()}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (serverSide) {
                  const currentPage = paginationData?.page || 1;
                  handleServerPaginationChange(currentPage); // Convert to 0-based
                } else {
                  table.nextPage();
                }
              }}
              disabled={isLoading || (serverSide ? (paginationData?.page >= (paginationData?.totalPages || 1)) : !table.getCanNextPage())}
            >
              Next
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (serverSide) {
                  const lastPage = (paginationData?.totalPages || 1) - 1;
                  handleServerPaginationChange(lastPage);
                } else {
                  table.setPageIndex(table.getPageCount() - 1);
                }
              }}
              disabled={isLoading || (serverSide ? (paginationData?.page >= (paginationData?.totalPages || 1)) : !table.getCanNextPage())}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}