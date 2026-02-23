import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Row, Col, Alert, message, Divider, Space } from 'antd';
import { EditOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { Company } from '../types';
import { validateCompanyData, formatNPWP } from '../utils/validators';

const CompanyManagement = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = () => {
    const saved = localStorage.getItem('company');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompany(parsed);
        form.setFieldsValue(parsed);
      } catch (error) {
        console.error('Failed to load company:', error);
      }
    }
  };

  const handleSave = async (values: Company) => {
    try {
      setLoading(true);
      const validation = validateCompanyData(values);

      if (!validation.valid) {
        message.error(validation.errors[0]);
        return;
      }

      localStorage.setItem('company', JSON.stringify(values));
      setCompany(values);
      setEditing(false);
      message.success('Data perusahaan berhasil diperbarui');
    } finally {
      setLoading(false);
    }
  };

  if (!company) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Belum Ada Data Perusahaan"
          description="Silakan lakukan setup awal terlebih dahulu."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#262626' }}>🏢 Data Perusahaan</h1>

      <Card title={<span>Informasi Perusahaan</span>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          disabled={!editing}
        >
          {!editing && (
            <Alert
              message="Mode Tampilan"
              description="Klik 'Edit' untuk mengubah data perusahaan"
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />
          )}

          {editing && (
            <Alert
              message="Mode Edit"
              description="Perubahan akan disimpan ke localStorage. Di production, data akan tersimpan di database."
              type="warning"
              showIcon
              style={{ marginBottom: '20px' }}
            />
          )}

          <h3 style={{ marginTop: '20px', marginBottom: '16px' }}>Informasi Utama</h3>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Nama Perusahaan"
                name="nama"
                rules={[{ required: true, message: 'Nama perusahaan wajib diisi' }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="NPWP Perusahaan"
                name="npwp"
                rules={[{ required: true, message: 'NPWP wajib diisi' }]}
              >
                <Input
                  size="large"
                  maxLength={16}
                  placeholder="0123456789012345"
                  onChange={(e) => {
                    form.setFieldValue('npwp', e.target.value.replace(/\D/g, ''));
                  }}
                  suffix={company.npwp ? formatNPWP(company.npwp) : ''}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Kota"
                name="kota"
                rules={[{ required: true, message: 'Kota wajib diisi' }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Provinsi"
                name="provinsi"
                rules={[{ required: true, message: 'Provinsi wajib diisi' }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Alamat"
            name="alamat"
            rules={[{ required: true, message: 'Alamat wajib diisi' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Divider />
          <h3 style={{ marginBottom: '16px' }}>Kontak</h3>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
              >
                <Input size="large" type="email" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Telepon"
                name="telepon"
              >
                <Input
                  size="large"
                  maxLength={12}
                  placeholder="081234567890"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <h3 style={{ marginBottom: '16px' }}>Orang Bertanggung Jawab (PIC)</h3>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Nama PIC"
                name="pic_nama"
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Telepon PIC"
                name="pic_telepon"
              >
                <Input size="large" maxLength={12} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <h3 style={{ marginBottom: '16px' }}>Informasi Bank</h3>

          <Form.Item
            label="Nama Bank"
            name="bank_nama"
          >
            <Input size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Nomor Rekening"
                name="bank_rekening"
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Atas Nama Rekening"
                name="bank_atas_nama"
              >
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Space>
            {editing ? (
              <>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Simpan Perubahan
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                    loadCompany();
                  }}
                  size="large"
                >
                  Batal
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                  size="large"
                >
                  Edit Data
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadCompany}
                  size="large"
                >
                  Refresh
                </Button>
              </>
            )}
          </Space>
        </Form>
      </Card>

      <Card title="Catatan" style={{ marginTop: '20px', backgroundColor: '#fafafa' }}>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Data perusahaan disimpan secara lokal di browser Anda</li>
          <li>NPWP harus format 16 digit (0XXXXXXXXXXXXXXX)</li>
          <li>Perubahan data dapat dilakukan kapan saja melalui halaman ini</li>
          <li>Semua perhitungan gaji akan menggunakan data perusahaan ini</li>
        </ul>
      </Card>
    </div>
  );
};

export default CompanyManagement;
