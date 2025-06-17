"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportToCSV, TableColumn } from "@/utils/csvExport";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ExportCSVButtonProps<T extends Record<string, any>> extends Omit<ButtonProps, 'onClick'> {
  data: T[];
  columns: TableColumn[];
  filename: string;
  variant?: "default" | "outline" | "secondary";
  onExport?: () => void; // Optional callback to fetch data before export
}

/**
 * A reusable button component that exports data to CSV
 * 
 * @param data - Array of data to export
 * @param columns - Column configuration for the CSV
 * @param filename - Base filename for the exported CSV (date will be appended)
 * @param variant - Button variant (default, outline, secondary)
 * @param onExport - Optional callback to fetch data before export
 * @param rest - Additional button props
 */
export function ExportCSVButton<T extends Record<string, any>>({
  data,
  columns,
  filename,
  variant = "secondary",
  onExport,
  disabled,
  ...rest
}: ExportCSVButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // If there's no data and an onExport callback is provided, call it first
      if (data.length === 0 && onExport) {
        console.log('No data available, calling onExport callback...');
        onExport();
        
        // Show a message to the user that we're fetching data
        toast({
          title: "Preparing Export",
          description: "Fetching data for export. Please try again in a moment.",
        });
        return;
      }

      // Validate that we have data to export
      if (!data || data.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There is no data available to export.",
          variant: "destructive",
        });
        return;
      }

      // Validate columns configuration
      if (!columns || columns.length === 0) {
        toast({
          title: "Export Configuration Error",
          description: "No columns configured for export.",
          variant: "destructive",
        });
        return;
      }

      console.log('Exporting data:', { 
        dataLength: data.length, 
        columnsLength: columns.length, 
        filename,
        sampleData: data[0] 
      });

      // Perform the export
      await exportToCSV(data, columns, filename);
      
      toast({
        title: "Export Successful",
        description: `Successfully exported ${data.length} records to CSV.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export CSV file.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isDisabled = disabled || isExporting;

  return (
    <Button
      variant={variant}
      onClick={handleExport}
      disabled={isDisabled}
      {...rest}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}