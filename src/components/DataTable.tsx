import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { type SheetData } from '../services/supabase';
import SupabaseService from '../services/supabase';
import { type FilterOptions } from './AdvancedFilters';

interface DataTableProps {
  sheetData: SheetData;
  filters?: FilterOptions;
}

const DataTable: React.FC<DataTableProps> = ({ sheetData }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const supabaseService = new SupabaseService();
  const { headers, rows } = supabaseService.processTableData(sheetData);

  const filteredRows = useMemo(() => {
    let result = rows;
    
    // Apply local search term if provided (additional to global filters)
    if (searchTerm) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    return result;
  }, [rows, searchTerm]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getCellValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 italic">N/A</span>;
    }
    
    if (typeof value === 'number') {
      return <Chip label={value.toLocaleString()} size="small" variant="outlined" />;
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value} className="cursor-help">
          {value.substring(0, 47)}...
        </span>
      );
    }
    
    return value;
  };

  if (headers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay datos disponibles en esta hoja</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex justify-between items-center">
        <TextField
          placeholder="Buscar en los datos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon className="text-gray-400" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'white',
            },
            minWidth: '300px',
          }}
        />
        <div className="text-sm text-gray-500">
          Mostrando {Math.min(rowsPerPage, filteredRows.length - page * rowsPerPage)} de {filteredRows.length} registros
        </div>
      </div>

      {/* Table */}
      <Paper className="rounded-xl shadow-lg overflow-hidden">
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell
                    key={index}
                    sx={{
                      backgroundColor: '#f8fafc',
                      fontWeight: 600,
                      color: '#475569',
                      borderBottom: '2px solid #e2e8f0',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <TableRow
                    key={index}
                    hover
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: '#f8fafc',
                      },
                      '&:hover': {
                        backgroundColor: '#e2e8f0',
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {headers.map((header, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        sx={{
                          fontSize: '0.875rem',
                          color: '#334155',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        {getCellValue(row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        />
      </Paper>
    </div>
  );
};

export default DataTable;