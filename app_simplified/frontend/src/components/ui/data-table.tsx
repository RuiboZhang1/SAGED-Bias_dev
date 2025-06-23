import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';

interface DataFrameFormat {
  columns: string[];
  data: Record<string, any>[];
  index?: (string | number)[];
}

interface DataTableProps {
  data: Record<string, any> | DataFrameFormat;
  className?: string;
  maxHeight?: string | number;
}

const formatValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'object') {
    return (
      <Box sx={{ maxWidth: 300, overflow: 'auto' }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
          {JSON.stringify(value, null, 2)}
        </pre>
      </Box>
    );
  }
  
  return String(value);
};

const isNumericColumn = (columnName: string): boolean => {
  return ['index', 'count', 'number', 'id', 'score', 'rating', 'value', 'amount'].some(
    keyword => columnName.toLowerCase().includes(keyword)
  );
};

const isDataFrameFormat = (data: any): data is DataFrameFormat => {
  return data && 
         Array.isArray(data.columns) && 
         Array.isArray(data.data) &&
         data.columns.length > 0;
};

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ data, className, maxHeight = 500, ...props }, ref) => {
    if (isDataFrameFormat(data)) {
      const { columns, data: rows, index } = data;
      
      return (
        <TableContainer 
          component={Paper} 
          sx={{ 
            mb: 2, 
            maxHeight: maxHeight,
            overflow: 'auto'
          }} 
          ref={ref} 
          {...props}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ 
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  textAlign: 'right',
                  color: '#374151'
                }}>
                  Index
                </TableCell>
                {columns.map((column) => (
                  <TableCell 
                    key={column}
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      textAlign: isNumericColumn(column) ? 'right' : 'left',
                      color: '#374151'
                    }}
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {index?.[i] ?? i}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell 
                      key={`${i}-${column}`}
                      sx={{ textAlign: isNumericColumn(column) ? 'right' : 'left' }}
                    >
                      {formatValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    // Original format handling
    const parsedData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        try {
          parsedData[key] = JSON.parse(value);
        } catch (e) {
          parsedData[key] = value;
        }
      } else {
        parsedData[key] = value;
      }
    });

    const allIndices = new Set<number>();
    Object.values(parsedData).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(key => {
          if (!isNaN(Number(key))) {
            allIndices.add(Number(key));
          }
        });
      }
    });

    const sortedIndices = Array.from(allIndices).sort((a, b) => a - b);

    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          mb: 2, 
          maxHeight: maxHeight,
          overflow: 'auto'
        }} 
        ref={ref} 
        {...props}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ 
                fontWeight: 'bold',
                fontSize: '0.875rem',
                textAlign: 'right',
                color: '#374151'
              }}>
                Index
              </TableCell>
              {Object.keys(parsedData).map((columnName) => (
                <TableCell 
                  key={columnName}
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    textAlign: isNumericColumn(columnName) ? 'right' : 'left',
                    color: '#374151'
                  }}
                >
                  {columnName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedIndices.map((index) => (
              <TableRow key={index}>
                <TableCell sx={{ textAlign: 'right' }}>
                  {index}
                </TableCell>
                {Object.keys(parsedData).map((columnName) => {
                  const columnData = parsedData[columnName];
                  const value = typeof columnData === 'object' && columnData !== null
                    ? columnData[index]
                    : columnData;
                  return (
                    <TableCell 
                      key={`${columnName}-${index}`}
                      sx={{ textAlign: isNumericColumn(columnName) ? 'right' : 'left' }}
                    >
                      {formatValue(value)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);

DataTable.displayName = "DataTable"; 