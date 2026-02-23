import { Card, Row, Col, Button, Table, Tag, Space, Empty, Statistic } from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  FileExcelOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { usePayrollStore } from '../store/payrollStore';
import { CalculationRecord } from '../types';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
  const { calculations } = usePayrollStore();

  // Calculate summary metrics
  const totalCalculations = calculations.length;
  const completedCalculations = calculations.filter((c: CalculationRecord) => c.status === 'saved').length;
  const totalBruto = calculations.reduce((sum: number, c: CalculationRecord) => sum + c.bruto, 0);
  const totalNetSalary = calculations.reduce((sum: number, c: CalculationRecord) => sum + c.net_salary, 0);

  const columns = [
    {
      title: 'Nama Karyawan',
      dataIndex: 'employee_name',
      key: 'employee_name',
      sorter: (a: CalculationRecord, b: CalculationRecord) =>
        a.employee_name.localeCompare(b.employee_name),
    },
    {
      title: 'Bruto',
      dataIndex: 'bruto',
      key: 'bruto',
      render: (value: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(value)}</span>,
      sorter: (a: CalculationRecord, b: CalculationRecord) => a.bruto - b.bruto,
    },
    {
      title: 'Gaji Bersih',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (value: number) => <span style={{ color: '#1890ff', fontWeight: 500 }}>{formatCurrency(value)}</span>,
      sorter: (a: CalculationRecord, b: CalculationRecord) => a.net_salary - b.net_salary,
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
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: CalculationRecord, b: CalculationRecord) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'processing',
          calculated: 'success',
          saved: 'success',
          exported: 'default',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#262626' }}>📊 Dashboard</h1>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Perhitungan"
              value={totalCalculations}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Disimpan"
              value={completedCalculations}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Bruto"
              value={totalBruto}
              formatter={(value: any) => formatCurrency(value as number)}
              prefix="Rp"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Gaji Bersih"
              value={totalNetSalary}
              formatter={(value: any) => formatCurrency(value as number)}
              valueStyle={{ color: '#1890ff' }}
              prefix="Rp"
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card
        title="⚡ Aksi Cepat"
        style={{ marginBottom: '20px' }}
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} href="/calculator">
              Perhitungan Baru
            </Button>
            <Button icon={<FileExcelOutlined />} href="/batch">
              Import Massal
            </Button>
            <Button icon={<FileTextOutlined />} href="/reports">
              Laporan
            </Button>
          </Space>
        }
      />

      {/* Recent Calculations Table */}
      <Card title="📋 Perhitungan Terbaru">
        {calculations.length > 0 ? (
          <Table
            columns={columns}
            dataSource={calculations.slice(0, 10)}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        ) : (
          <Empty description="Belum ada perhitungan" style={{ marginTop: '40px' }}>
            <Button type="primary" href="/calculator">
              Mulai Perhitungan
            </Button>
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
