import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';
import { type SheetData } from '../services/supabase';
import SupabaseService from '../services/supabase';
import { type FilterOptions } from './AdvancedFilters';

interface SheetVisualizationProps {
  sheetData: SheetData;
  filters?: FilterOptions;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

const SheetVisualization: React.FC<SheetVisualizationProps> = ({ sheetData }) => {
  const supabaseService = new SupabaseService();
  const { headers, rows } = supabaseService.processTableData(sheetData);

  const chartData = useMemo(() => {
    if (rows.length === 0 || headers.length === 0) return [];

    // Take first 20 rows for better performance
    const limitedRows = rows.slice(0, 20);
    
    return limitedRows.map((row, index) => {
      const item: any = { index: index + 1 };
      headers.forEach(header => {
        const value = row[header];
        // Convert to number if possible, otherwise keep as string
        if (!isNaN(Number(value)) && value !== '' && value !== null) {
          item[header] = Number(value);
        } else {
          item[header] = value || 0;
        }
      });
      return item;
    });
  }, [rows, headers]);

  const numericColumns = useMemo(() => {
    return headers.filter(header => {
      return rows.some(row => {
        const value = row[header];
        return !isNaN(Number(value)) && value !== '' && value !== null;
      });
    });
  }, [headers, rows]);

  const stringColumns = useMemo(() => {
    return headers.filter(header => !numericColumns.includes(header));
  }, [headers, numericColumns]);

  // Pie chart data for first string column
  const pieData = useMemo(() => {
    if (stringColumns.length === 0) return [];
    
    const column = stringColumns[0];
    const counts: { [key: string]: number } = {};
    
    rows.forEach(row => {
      const value = String(row[column] || 'N/A');
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [rows, stringColumns]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary-50 p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{`Registro: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay datos para visualizar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <Typography variant="h6" className="text-blue-100">
              Total Registros
            </Typography>
            <Typography variant="h4" className="font-bold">
              {rows.length}
            </Typography>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <Typography variant="h6" className="text-green-100">
              Columnas
            </Typography>
            <Typography variant="h4" className="font-bold">
              {headers.length}
            </Typography>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <Typography variant="h6" className="text-purple-100">
              Campos Numéricos
            </Typography>
            <Typography variant="h4" className="font-bold">
              {numericColumns.length}
            </Typography>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <Typography variant="h6" className="text-orange-100">
              Campos de Texto
            </Typography>
            <Typography variant="h4" className="font-bold">
              {stringColumns.length}
            </Typography>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar Chart */}
        {numericColumns.length > 0 && (
          <Card className="shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-gray-800 font-semibold">
                Gráfico de Barras - Datos Numéricos
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="index" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {numericColumns.slice(0, 3).map((column, index) => (
                    <Bar
                      key={column}
                      dataKey={column}
                      fill={COLORS[index % COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <Card className="shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-gray-800 font-semibold">
                Distribución - {stringColumns[0]}
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Line Chart */}
        {numericColumns.length > 1 && (
          <Card className="shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-gray-800 font-semibold">
                Tendencia - Datos Numéricos
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="index" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {numericColumns.slice(0, 2).map((column, index) => (
                    <Line
                      key={column}
                      type="monotone"
                      dataKey={column}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={3}
                      dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Area Chart */}
        {numericColumns.length > 0 && (
          <Card className="shadow-lg">
            <CardContent>
              <Typography variant="h6" className="mb-4 text-gray-800 font-semibold">
                Área Acumulada
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="index" 
                    stroke="#666"
                    fontSize={12}
                  />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {numericColumns.slice(0, 2).map((column, index) => (
                    <Area
                      key={column}
                      type="monotone"
                      dataKey={column}
                      stackId="1"
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SheetVisualization;