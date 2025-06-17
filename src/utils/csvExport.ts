import { saveAs } from 'file-saver';
import Papa from 'papaparse';

export interface TableColumn {
  id: string;
  label: string;
  format?: (...value: any) => string;
}

export const exportToCSV = async <T extends Record<string, any>>(
  data: T[],
  columns: TableColumn[],
  filename: string
): Promise<void> => {
  try {
    console.log('Starting CSV export...', { 
      dataLength: data.length, 
      columnsLength: columns.length,
      filename 
    });

    // Validate input data
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data: Expected an array');
    }

    if (data.length === 0) {
      throw new Error('No data to export');
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      throw new Error('Invalid columns configuration');
    }

    // Transform data according to column configuration
    const transformedData = data.map((row, index) => {
      const transformedRow: Record<string, any> = {};
      
      columns.forEach(column => {
        try {
          const value = row[column.id];
          
          // Apply formatter if provided
          if (column.format && typeof column.format === 'function') {
            transformedRow[column.label] = column.format(value);
          } else {
            // Handle different data types
            if (value === null || value === undefined) {
              transformedRow[column.label] = '';
            } else if (typeof value === 'object' && value instanceof Date) {
              transformedRow[column.label] = value.toLocaleDateString();
            } else if (typeof value === 'object') {
              transformedRow[column.label] = JSON.stringify(value);
            } else {
              transformedRow[column.label] = String(value);
            }
          }
        } catch (columnError) {
          console.warn(`Error processing column ${column.id} for row ${index}:`, columnError);
          transformedRow[column.label] = '';
        }
      });
      
      return transformedRow;
    });

    console.log('Data transformation complete. Sample transformed row:', transformedData[0]);

    // Convert to CSV using Papa Parse
    const csv = Papa.unparse(transformedData, {
      quotes: true, 
      skipEmptyLines: true,
      header: true,
    });

    if (!csv || csv.trim().length === 0) {
      throw new Error('Failed to generate CSV content');
    }

    console.log('CSV generation complete. Length:', csv.length);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.csv`;
    
    console.log('Downloading file:', fullFilename);
    
    // Use saveAs to download the file
    saveAs(blob, fullFilename);
    
    console.log('CSV export completed successfully');
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    
    // Re-throw with a more user-friendly message
    if (error instanceof Error) {
      throw new Error(`Export failed: ${error.message}`);
    } else {
      throw new Error('Failed to export CSV file due to an unknown error');
    }
  }
};

export const formatters = {
  date: (value: string | Date) => {
    if (!value) return '';
    try {
      const date = value instanceof Date ? value : new Date(value);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
    } catch {
      return '';
    }
  },
  dateTime: (value: string | Date) => {
    if (!value) return '';
    try {
      const date = value instanceof Date ? value : new Date(value);
      return isNaN(date.getTime()) ? '' : date.toLocaleString();
    } catch {
      return '';
    }
  },
  currency: (value: number) => {
    if (!value && value !== 0) return '';
    try {
      return `₹${value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } catch {
      return String(value);
    }
  },
  boolean: (value: boolean) => {
    if (value === null || value === undefined) return '';
    return value ? 'Yes' : 'No';
  },
  number: (value: number) => {
    if (!value && value !== 0) return '';
    try {
      return value.toLocaleString('en-IN');
    } catch {
      return String(value);
    }
  },
  text: (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value);
  }
};