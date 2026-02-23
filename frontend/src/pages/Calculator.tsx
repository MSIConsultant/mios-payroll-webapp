import {
  Card,
  Form,
  InputNumber,
  Select,
  Button,
  Alert,
  Row,
  Col,
  Space,
  Divider,
} from 'antd';
import {
  CalculatorOutlined,
  SaveOutlined,
  PrinterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { usePayrollStore } from '../store/payrollStore';
import { payrollAPI } from '../utils/api';
import { generatePayslipPDF } from '../utils/formatters';
import {
  PayrollCalculationRequest,
  EmployeeData,
  Allowance,
} from '../types';
import BreakdownDisplay from '../components/BreakdownDisplay';
import AllowanceInput from '../components/AllowanceInput';

const Calculator = () => {
  // form not required here; using local state for inputs
  const { currentCalculation, setCurrentCalculation, loading, error, setError, setLoading, saveCalculation } =
    usePayrollStore();

  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [gajiPokok, setGajiPokok] = useState(0);

  // Load employees from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEmployees(parsed);
      } catch (error) {
        console.error('Failed to load employees:', error);
      }
    }
  }, []);

  // Handle employee selection
  const handleSelectEmployee = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setAllowances(employee.salary_profile.allowances);
      setGajiPokok(employee.salary_profile.gaji_pokok);
      setCurrentCalculation(null);
      setError('');
    }
  };

  // Calculate payroll
  const handleCalculate = async () => {
    if (!selectedEmployee) {
      setError('Pilih karyawan terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload: PayrollCalculationRequest = {
        employee_id: selectedEmployee.employee_id,
        company_id: selectedEmployee.company_id,
        nama: selectedEmployee.nama,
        npwp: selectedEmployee.npwp,
        nik: selectedEmployee.nik,
        tgl_lahir: selectedEmployee.tgl_lahir,
        jenis_kelamin: selectedEmployee.jenis_kelamin,
        jabatan: selectedEmployee.jabatan,
        status_ptkp: selectedEmployee.status_ptkp,
        salary_profile: {
          gaji_pokok: gajiPokok,
          allowances: allowances,
        },
        benefit_config: {
          company_borne: selectedEmployee.benefit_config.company_borne,
          risk_level: selectedEmployee.benefit_config.risk_level,
        },
      };

      const result = await payrollAPI.calculatePayroll(payload);
      setCurrentCalculation(result);
    } catch (err: any) {
      setError(err.message || 'Perhitungan gagal. Pastikan backend berjalan.');
      setCurrentCalculation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (currentCalculation) {
      saveCalculation(currentCalculation);
      handleClear();
    }
  };

  const handlePrint = async (): Promise<void> => {
    if (currentCalculation) {
      await generatePayslipPDF(
        currentCalculation.employee_name,
        currentCalculation,
        `Slip-Gaji-${currentCalculation.employee_name}`
      );
    }
  };

  const handleClear = () => {
    setSelectedEmployee(null);
    setAllowances([]);
    setGajiPokok(0);
    setCurrentCalculation(null);
    setError('');
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#262626' }}>🧮 Kalkulator Gaji Karyawan</h1>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

      {employees.length === 0 && (
        <Alert
          message="Belum Ada Data Karyawan"
          description="Silakan tambahkan data karyawan terlebih dahulu di halaman 'Data Karyawan'"
          type="warning"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      <Row gutter={[20, 20]}>
        {/* Left: Selection & Input */}
        <Col xs={24} lg={12}>
          <Card title="📋 Pilih & Atur Karyawan" loading={loading}>
            <Form layout="vertical">
              {/* Employee Selection */}
              <Form.Item label="Pilih Karyawan">
                <Select
                  placeholder="Cari dan pilih karyawan..."
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.nama} (${emp.npwp})`,
                  }))}
                  onChange={handleSelectEmployee}
                  value={selectedEmployee?.id || undefined}
                />
              </Form.Item>

              {selectedEmployee && (
                <>
                  {/* Employee Info */}
                  <div
                    style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '16px',
                    }}
                  >
                    <h4 style={{ marginBottom: '8px' }}>Informasi Karyawan</h4>
                    <Row gutter={[8, 8]}>
                      <Col xs={24} md={12}>
                        <div>
                          <strong>Nama:</strong> {selectedEmployee.nama}
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div>
                          <strong>Jabatan:</strong> {selectedEmployee.jabatan}
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div>
                          <strong>PTKP:</strong> {selectedEmployee.status_ptkp}
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div>
                          <strong>Tingkat Risiko:</strong> {selectedEmployee.benefit_config.risk_level}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <Divider />

                  {/* Salary Adjustment */}
                  <h4 style={{ marginBottom: '16px' }}>Sesuaikan Gaji (Opsional)</h4>

                  <Form.Item label="Gaji Pokok">
                    <InputNumber
                      value={gajiPokok}
                      onChange={(val) => setGajiPokok(val || 0)}
                      min={0}
                      formatter={(value) =>
                        `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      }
                      parser={(value) =>
                        parseInt(value?.replace(/Rp\s?|(,*)/g, '') || '0')
                      }
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                      Tunjangan & Allowance
                    </label>
                    <AllowanceInput value={allowances} onChange={setAllowances} />
                  </div>

                  <Divider />

                  {/* Benefit Configuration Display */}
                  <div
                    style={{
                      background: '#e6f7ff',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '16px',
                    }}
                  >
                    <h4 style={{ marginBottom: '8px' }}>Konfigurasi Benefit</h4>
                    <div>
                      <strong>Perusahaan Menanggung:</strong>
                      <div style={{ marginTop: '4px' }}>
                        {selectedEmployee.benefit_config.company_borne.length > 0 ? (
                          selectedEmployee.benefit_config.company_borne.map((item) => (
                            <div key={item} style={{ marginLeft: '12px' }}>
                              ✓ {item.toUpperCase()}
                            </div>
                          ))
                        ) : (
                          <div style={{ marginLeft: '12px' }}>Tidak ada</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Form.Item>
                    <Space style={{ width: '100%' }}>
                      <Button
                        type="primary"
                        icon={<CalculatorOutlined />}
                        onClick={handleCalculate}
                        loading={loading}
                        style={{ flex: 1 }}
                      >
                        Hitung Gaji
                      </Button>
                      <Button icon={<ClearOutlined />} onClick={handleClear}>
                        Bersihkan
                      </Button>
                    </Space>
                  </Form.Item>
                </>
              )}
            </Form>
          </Card>
        </Col>

        {/* Right: Results */}
        <Col xs={24} lg={12}>
          {currentCalculation ? (
            <>
              <Card title="✅ Hasil Perhitungan">
                <BreakdownDisplay calculation={currentCalculation} />
              </Card>

              <Space style={{ width: '100%', marginTop: '20px' }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  style={{ flex: 1 }}
                >
                  Simpan
                </Button>
                <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                  Cetak PDF
                </Button>
              </Space>
            </>
          ) : (
            <Card title="Hasil Perhitungan" style={{ minHeight: '400px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#8c8c8c',
                  textAlign: 'center',
                }}
              >
                {selectedEmployee
                  ? 'Klik "Hitung Gaji" untuk melihat hasil perhitungan'
                  : 'Pilih karyawan dan atur gaji untuk memulai perhitungan'}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Calculator;
