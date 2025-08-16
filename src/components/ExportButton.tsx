import React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { 
  Download as DownloadIcon,
  TableChart as TableIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import { type SheetData } from '../services/supabase';
import { type FilterOptions } from './AdvancedFilters';

interface ExportButtonProps {
  sheetsData: SheetData[];
  filters: FilterOptions;
}

const ExportButton: React.FC<ExportButtonProps> = ({ sheetsData, filters }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToCSV = () => {
    if (!sheetsData || sheetsData.length === 0) return;

    const csv = sheetsData.map(sheet => {
      if (sheet.data.length === 0) return '';
      
      const rows = sheet.data.map(row => 
        row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      );
      
      return `# ${sheet.name}\n${rows.join('\n')}`;
    }).join('\n\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_senpa_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleClose();
  };

  const exportToJSON = () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      filters: filters,
      sheets: sheetsData.map(sheet => ({
        name: sheet.name,
        headers: sheet.data.length > 0 ? sheet.data[0] : [],
        data: sheet.data.slice(1),
        recordCount: Math.max(0, sheet.data.length - 1)
      })),
      summary: {
        totalSheets: sheetsData.length,
        totalRecords: sheetsData.reduce((total, sheet) => total + Math.max(0, sheet.data.length - 1), 0)
      }
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_senpa_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleClose();
  };

  const generateReport = () => {
    const reportData = {
      title: 'Reporte Operativo SENPA',
      date: new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      filters: filters,
      summary: {
        totalSheets: sheetsData.length,
        totalRecords: sheetsData.reduce((total, sheet) => total + Math.max(0, sheet.data.length - 1), 0),
        detenidos: 0, // Calculate based on actual data
        incidentesActivos: 0,
        casosResueltos: 0
      }
    };

    // Create a simple HTML report
    const htmlReport = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${reportData.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          .metric { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .filters { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportData.title}</h1>
          <p>Generado el: ${reportData.date}</p>
        </div>
        
        <div class="filters">
          <h3>Filtros Aplicados:</h3>
          <p><strong>Fecha desde:</strong> ${filters.dateFrom || 'No aplicado'}</p>
          <p><strong>Fecha hasta:</strong> ${filters.dateTo || 'No aplicado'}</p>
          <p><strong>Estados:</strong> ${filters.states.join(', ') || 'Todos'}</p>
          <p><strong>Ubicaciones:</strong> ${filters.locations.join(', ') || 'Todas'}</p>
          <p><strong>Tipos:</strong> ${filters.types.join(', ') || 'Todos'}</p>
          <p><strong>Búsqueda:</strong> ${filters.searchText || 'No aplicada'}</p>
        </div>
        
        <div class="metrics">
          <h3>Resumen Ejecutivo:</h3>
          <div class="metric">
            <div>Total de Hojas</div>
            <div class="metric-value">${reportData.summary.totalSheets}</div>
          </div>
          <div class="metric">
            <div>Total de Registros</div>
            <div class="metric-value">${reportData.summary.totalRecords}</div>
          </div>
        </div>
        
        <div class="sheets">
          <h3>Detalle por Hoja:</h3>
          ${sheetsData.map(sheet => `
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
              <h4>${sheet.name}</h4>
              <p>Registros: ${Math.max(0, sheet.data.length - 1)}</p>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlReport], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_senpa_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleClose();
  };

  const hasData = sheetsData && sheetsData.length > 0;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleClick}
        disabled={!hasData}
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        Exportar Datos
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'export-button',
        }}
      >
        <MenuItem onClick={exportToCSV}>
          <TableIcon className="mr-2" />
          Exportar como CSV
        </MenuItem>
        <MenuItem onClick={exportToJSON}>
          <DownloadIcon className="mr-2" />
          Exportar como JSON
        </MenuItem>
        <MenuItem onClick={generateReport}>
          <ReportIcon className="mr-2" />
          Generar Reporte HTML
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;