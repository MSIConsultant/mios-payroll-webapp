import { Card, Row, Col, Button, Space, Statistic, Table } from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { usePayrollStore } from '../store/payrollStore';
import { formatCurrency, exportToExcel } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { calculations } = usePayrollStore();

  // Calculate metrics
  const totalBruto = calculations.reduce((sum, c) => sum + c.bruto, 0);
  const totalTax = calculations.reduce((sum, c) => sum + c.tax, 0);
  const totalBPJS = calculations.reduce((sum, c) => sum + c.bpjs, 0);
  const totalNetSalary = calculations.reduce((sum, c) => sum + c.net_salary, 0);

  // Prepare chart data
  const chartData = calculations.map((c) => ({
    name: c.employee_name.substring(0, 10),
    bruto: c.bruto,
    netto: c.net_salary,
    tax: c.tax,
  }));

  const columns = [
    {
      title: 'Nama',
      dataIndex: 'employee_name',
      key: 'employee_name',
    },
    {
      title: 'Bruto',
      dataIndex: 'bruto',
      key: 'bruto',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'PPh 21',
      dataIndex: 'tax',
      key: 'tax',
      render: (value: number) => <span style={{ color: '#f5222d' }}>{formatCurrency(value)}</span>,
    },
    {
      title: 'BPJS',
      dataIndex: 'bpjs',
      key: 'bpjs',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Gaji Bersih',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (value: number) => <span style={{ color: '#1890ff', fontWeight: 500 }}>{formatCurrency(value)}</span>,
    },
  ];

  const handleExportReport = () => {
    const reportData = calculations.map((c) => ({
      'Nama Karyawan': c.employee_name,
      'Bruto': c.bruto,
      'PPh 21': c.tax,
      'BPJS': c.bpjs,
      'Total Potongan': c.tax + c.bpjs,
      'Gaji Bersih': c.net_salary,
      'Tanggal': c.date,
    }));

    exportToExcel(reportData, `Laporan-Gaji-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#262626' }}>📊 Laporan</h1>

      {/* Summary Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Bruto"
              value={totalBruto}
              formatter={(value: any) => formatCurrency(value as number)}
              valueStyle={{ fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total PPh 21"
              value={totalTax}
              formatter={(value: any) => formatCurrency(value as number)}
              valueStyle={{ color: '#f5222d', fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total BPJS"
              value={totalBPJS}
              formatter={(value: any) => formatCurrency(value as number)}
              valueStyle={{ fontSize: '18px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Gaji Bersih"
              value={totalNetSalary}
              formatter={(value: any) => formatCurrency(value as number)}
              valueStyle={{ color: '#1890ff', fontSize: '18px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card title="📈 Visualisasi Gaji" style={{ marginBottom: '20px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="bruto" fill="#1890ff" name="Bruto" />
              <Bar dataKey="netto" fill="#52c41a" name="Gaji Bersih" />
              <Bar dataKey="tax" fill="#f5222d" name="PPh 21" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Report Table */}
      <Card
        title="📋 Detail Laporan"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExportReport}>
              Export Excel
            </Button>
            <Button icon={<PrinterOutlined />}>Print</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={calculations}
          rowKey="id"
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Reports;
