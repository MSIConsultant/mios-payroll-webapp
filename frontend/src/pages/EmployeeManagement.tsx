import { useState, useEffect } from 'react';
import type { ColumnType } from 'antd/es/table';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Employee, Allowance, EmployeeData } from '../types';
import AllowanceInput from '../components/AllowanceInput';
import { validateIndividualNPWP, validateNIK } from '../utils/validators';

interface EmployeeFormData extends Employee {
  gaji_pokok: number;
  allowances?: Allowance[];
  company_borne?: string[];
  risk_level?: string;
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [form] = Form.useForm();
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [companyBorne, setCompanyBorne] = useState<string[]>(['pph21', 'jht', 'jp', 'bpjs_kesehatan']);
  const [riskLevel, setRiskLevel] = useState<string>('RENDAH');

  // Load employees from localStorage (or from API in production)
  useEffect(() => {
    const saved = localStorage.getItem('employees');
    if (saved) {
      try {
        setEmployees(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load employees:', error);
      }
    }
  }, []);

  // Save employees to localStorage
  const saveEmployees = (data: EmployeeData[]) => {
    localStorage.setItem('employees', JSON.stringify(data));
    setEmployees(data);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setAllowances([]);
    setCompanyBorne(['pph21', 'jht', 'jp', 'bpjs_kesehatan']);
    setRiskLevel('RENDAH');
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditEmployee = (employee: EmployeeData) => {
    setEditingEmployee(employee);
    setAllowances(employee.salary_profile.allowances);
    setCompanyBorne(employee.benefit_config.company_borne);
    setRiskLevel(employee.benefit_config.risk_level);
    
    form.setFieldsValue({
      nama: employee.nama,
      npwp: employee.npwp,
      nik: employee.nik,
      tgl_lahir: dayjs(employee.tgl_lahir),
      jenis_kelamin: employee.jenis_kelamin,
      jabatan: employee.jabatan,
      status_ptkp: employee.status_ptkp,
      gaji_pokok: employee.salary_profile.gaji_pokok,
    });
    
    setIsModalVisible(true);
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter((emp) => emp.id !== id);
    saveEmployees(updated);
    message.success('Karyawan berhasil dihapus');
  };

  const handleSaveEmployee = async (values: EmployeeFormData) => {
    try {

      if (!values.tgl_lahir) {
        message.error('Tanggal lahir harus diisi');
        return;
      }

      const newEmployee: EmployeeData = {
        id: editingEmployee?.id || `emp-${Date.now()}`,
        employee_id: editingEmployee?.employee_id || `EMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        company_id: editingEmployee?.company_id || 'COMPANY-001',
        nama: values.nama,
        npwp: values.npwp,
        nik: values.nik,
        tgl_lahir: (values.tgl_lahir as any)?.format ? (values.tgl_lahir as any).format('YYYY-MM-DD') : values.tgl_lahir,
        jenis_kelamin: values.jenis_kelamin,
        jabatan: values.jabatan,
        status_ptkp: values.status_ptkp,
        salary_profile: {
          gaji_pokok: values.gaji_pokok ?? 0,
          allowances: allowances,
        },
        benefit_config: {
          company_borne: companyBorne,
          risk_level: riskLevel,
        },
      };

      let updated: EmployeeData[];
      if (editingEmployee) {
        updated = employees.map((emp) => (emp.id === editingEmployee.id ? newEmployee : emp));
        message.success('Karyawan berhasil diperbarui');
      } else {
        updated = [...employees, newEmployee];
        message.success('Karyawan berhasil ditambahkan');
      }

      saveEmployees(updated);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Gagal menyimpan karyawan');
      console.error(error);
    }
  };

  const columns: ColumnType<EmployeeData>[] = [
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
      width: 150,
    },
    {
      title: 'NPWP',
      dataIndex: 'npwp',
      key: 'npwp',
      width: 150,
    },
    {
      title: 'NIK',
      dataIndex: 'nik',
      key: 'nik',
      width: 150,
    },
    {
      title: 'Jabatan',
      dataIndex: 'jabatan',
      key: 'jabatan',
      width: 150,
    },
    {
      title: 'Status PTKP',
      dataIndex: 'status_ptkp',
      key: 'status_ptkp',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Gaji Pokok',
      dataIndex: ['salary_profile', 'gaji_pokok'],
      key: 'gaji_pokok',
      width: 150,
      render: (value: number) => `Rp ${value.toLocaleString('id-ID')}`,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_: EmployeeData, record: EmployeeData) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditEmployee(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Hapus karyawan?"
            description="Apakah Anda yakin ingin menghapus karyawan ini?"
            onConfirm={() => handleDeleteEmployee(record.id!)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />}>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <h1 style={{ color: '#262626' }}>👥 Data Karyawan</h1>
        </Col>
      </Row>

      <Card
        title="Daftar Karyawan"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEmployee}>
            Tambah Karyawan
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEmployee}
          autoComplete="off"
        >
          {/* Personal Information */}
          <h3>Informasi Personal</h3>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Nama"
                name="nama"
                rules={[{ required: true, message: 'Nama harus diisi' }]}
              >
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="NPWP"
                name="npwp"
                rules={[
                  { required: true, message: 'NPWP harus diisi' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (!validateIndividualNPWP(value)) {
                        return Promise.reject(new Error('NPWP harus 16 digit'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="1234567890123456"
                  maxLength={16}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    form.setFieldValue('npwp', clean);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="NIK"
                name="nik"
                rules={[
                  { required: true, message: 'NIK harus diisi' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (!validateNIK(value)) {
                        return Promise.reject(new Error('NIK harus 16 digit yang valid'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="1234567890123456"
                  maxLength={16}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    form.setFieldValue('nik', clean);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tanggal Lahir"
                name="tgl_lahir"
                rules={[{ required: true, message: 'Tanggal lahir harus diisi' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Jenis Kelamin"
                name="jenis_kelamin"
                rules={[{ required: true, message: 'Jenis kelamin harus dipilih' }]}
              >
                <Select placeholder="Pilih jenis kelamin">
                  <Select.Option value="L">Laki-laki</Select.Option>
                  <Select.Option value="P">Perempuan</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Jabatan"
                name="jabatan"
                rules={[{ required: true, message: 'Jabatan harus diisi' }]}
              >
                <Input placeholder="Software Engineer" />
              </Form.Item>
            </Col>
          </Row>

          {/* Salary Information */}
          <h3 style={{ marginTop: '20px' }}>Informasi Gaji</h3>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Gaji Pokok"
                name="gaji_pokok"
                rules={[{ required: true, message: 'Gaji pokok harus diisi' }]}
              >
                <Input type="number" placeholder="10000000" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Status PTKP"
                name="status_ptkp"
                rules={[{ required: true, message: 'Status PTKP harus dipilih' }]}
              >
                <Select placeholder="Pilih status PTKP">
                  <Select.Option value="TK/0">TK/0 - Tidak Kawin</Select.Option>
                  <Select.Option value="TK/1">TK/1 - Tidak Kawin + 1 Anak</Select.Option>
                  <Select.Option value="TK/2">TK/2 - Tidak Kawin + 2 Anak</Select.Option>
                  <Select.Option value="TK/3">TK/3 - Tidak Kawin + 3 Anak</Select.Option>
                  <Select.Option value="K/0">K/0 - Kawin</Select.Option>
                  <Select.Option value="K1">K/1 - Kawin + 1 Anak</Select.Option>
                  <Select.Option value="K/2">K/2 - Kawin + 2 Anak</Select.Option>
                  <Select.Option value="K/3">K/3 - Kawin + 3 Anak</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Tunjangan & Allowance
            </label>
            <AllowanceInput
              value={allowances}
              onChange={setAllowances}
            />
          </div>

          {/* Benefits Configuration */}
          <h3 style={{ marginTop: '20px' }}>Konfigurasi Benefit</h3>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label="Perusahaan Menanggung">
                <Select
                  mode="multiple"
                  placeholder="Pilih benefit yang ditanggung perusahaan"
                  value={companyBorne}
                  onChange={setCompanyBorne}
                  options={[
                    { label: 'PPh 21', value: 'pph21' },
                    { label: 'BPJS Kesehatan', value: 'bpjs_kesehatan' },
                    { label: 'JHT (Pensions)', value: 'jht' },
                    { label: 'JP (Disability)', value: 'jp' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Tingkat Risiko JKK">
                <Select
                  placeholder="Pilih tingkat risiko"
                  value={riskLevel}
                  onChange={setRiskLevel}
                  options={[
                    { label: 'Rendah', value: 'RENDAH' },
                    { label: 'Sedang', value: 'SEDANG' },
                    { label: 'Tinggi', value: 'TINGGI' },
                    { label: 'Sangat Tinggi', value: 'SANGAT_TINGGI' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
