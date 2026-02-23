import { useState } from 'react';
import { Card, Button, Steps, Form, Input, Row, Col, Alert, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Company } from '../types';
import { validateCompanyData, formatNPWP } from '../utils/validators';

const Onboarding = ({ onComplete }: { onComplete: (company: Company) => void }) => {
  const [current, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [company, setCompany] = useState<Company>({
    nama: '',
    npwp: '',
    alamat: '',
    kota: '',
    provinsi: '',
    email: '',
    telepon: '',
    pic_nama: '',
    pic_telepon: '',
    bank_nama: '',
    bank_rekening: '',
    bank_atas_nama: '',
  });

  const handleCompanyChange = (field: keyof Company, value: string) => {
    setCompany({ ...company, [field]: value });
  };

  const steps = [
    {
      title: 'Selamat Datang',
      description: 'Mulai dari sini',
      content: (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#262626' }}>🎯 MIOS PAYROLL</h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
            Sistem Perhitungan Gaji & Pajak Karyawan untuk Indonesia
          </p>
          <Alert
            message="Selamat datang di MIOS Payroll!"
            description="Kami akan memandu Anda menyelesaikan setup awal. Data perusahaan Anda akan disimpan secara aman."
            type="info"
            showIcon
            style={{ marginBottom: '30px' }}
          />
          <div style={{ fontSize: '14px', color: '#8c8c8c', lineHeight: '1.8' }}>
            <p>✓ Hitung PPh 21 dengan akurat (TER 2024)</p>
            <p>✓ Kelola 500+ karyawan dengan mudah</p>
            <p>✓ Hitung BPJS otomatis (Kesehatan, Pensions, Disability, Kecelakaan)</p>
            <p>✓ Ekspor laporan ke Excel & PDF</p>
            <p>✓ Kelola multiple perusahaan klien</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Data Perusahaan',
      description: 'Informasi utama',
      content: (
        <Form form={form} layout="vertical" style={{ paddingTop: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Informasi Perusahaan</h3>

          <Form.Item
            label="Nama Perusahaan *"
            required
            tooltip="Nama lengkap perusahaan Anda"
          >
            <Input
              placeholder="PT. Contoh Indonesia"
              value={company.nama}
              onChange={(e) => handleCompanyChange('nama', e.target.value)}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="NPWP Perusahaan *"
            required
            tooltip="Format: 16 digit (contoh: 0123456789012345)"
            help={company.npwp ? `Format: ${formatNPWP(company.npwp)}` : ''}
          >
            <Input
              placeholder="0123456789012345"
              value={company.npwp}
              onChange={(e) => handleCompanyChange('npwp', e.target.value.replace(/\D/g, ''))}
              maxLength={16}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Kota *"
                required
              >
                <Input
                  placeholder="Jakarta"
                  value={company.kota}
                  onChange={(e) => handleCompanyChange('kota', e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Provinsi *"
                required
              >
                <Input
                  placeholder="DKI Jakarta"
                  value={company.provinsi}
                  onChange={(e) => handleCompanyChange('provinsi', e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Alamat *"
            required
          >
            <Input.TextArea
              placeholder="Jalan, No, Kelurahan, Kecamatan"
              value={company.alamat}
              onChange={(e) => handleCompanyChange('alamat', e.target.value)}
              rows={3}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Email">
                <Input
                  type="email"
                  placeholder="admin@perusahaan.com"
                  value={company.email}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Telepon">
                <Input
                  placeholder="081234567890"
                  value={company.telepon}
                  onChange={(e) => handleCompanyChange('telepon', e.target.value.replace(/\D/g, ''))}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      ),
    },
    {
      title: 'Kontak Utama',
      description: 'PIC perusahaan',
      content: (
        <Form form={form} layout="vertical" style={{ paddingTop: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Orang Bertanggung Jawab (PIC)</h3>

          <Form.Item label="Nama PIC">
            <Input
              placeholder="Nama lengkap"
              value={company.pic_nama}
              onChange={(e) => handleCompanyChange('pic_nama', e.target.value)}
              size="large"
            />
          </Form.Item>

          <Form.Item label="Telepon PIC">
            <Input
              placeholder="081234567890"
              value={company.pic_telepon}
              onChange={(e) => handleCompanyChange('pic_telepon', e.target.value.replace(/\D/g, ''))}
              size="large"
            />
          </Form.Item>

          <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Informasi Bank (Untuk Payroll)</h3>

          <Form.Item label="Nama Bank">
            <Input
              placeholder="Bank Mandiri"
              value={company.bank_nama}
              onChange={(e) => handleCompanyChange('bank_nama', e.target.value)}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Nomor Rekening">
                <Input
                  placeholder="1234567890123456"
                  value={company.bank_rekening}
                  onChange={(e) => handleCompanyChange('bank_rekening', e.target.value.replace(/\D/g, ''))}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Atas Nama Rekening">
                <Input
                  placeholder="Nama Perusahaan"
                  value={company.bank_atas_nama}
                  onChange={(e) => handleCompanyChange('bank_atas_nama', e.target.value)}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      ),
    },
    {
      title: 'Konfirmasi',
      description: 'Selesai',
      content: (
        <div style={{ paddingTop: '20px' }}>
          <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '20px' }} />
          <h3 style={{ marginBottom: '20px' }}>Data Siap Disimpan</h3>

          <Card style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <p><strong>Perusahaan:</strong> {company.nama}</p>
                <p><strong>NPWP:</strong> {formatNPWP(company.npwp)}</p>
                <p><strong>Lokasi:</strong> {company.kota}, {company.provinsi}</p>
              </Col>
              <Col xs={24} md={12}>
                <p><strong>PIC:</strong> {company.pic_nama || '-'}</p>
                <p><strong>Email:</strong> {company.email || '-'}</p>
                <p><strong>Bank:</strong> {company.bank_nama || '-'}</p>
              </Col>
            </Row>
          </Card>

          <Alert
            message="Setup berhasil! Data Anda sekarang siap digunakan."
            description="Anda bisa mengubah data perusahaan kapan saja di menu Settings."
            type="success"
            showIcon
          />
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (current === 1) {
      const validation = validateCompanyData(company);
      if (!validation.valid) {
        message.error(validation.errors[0]);
        return;
      }
    }
    setCurrentStep(current + 1);
  };

  const handlePrev = () => {
    setCurrentStep(current - 1);
  };

  const handleComplete = () => {
    const validation = validateCompanyData(company);
    if (!validation.valid) {
      message.error('Data perusahaan belum lengkap: ' + validation.errors[0]);
      return;
    }

    // Save to localStorage
    localStorage.setItem('company', JSON.stringify(company));
    localStorage.setItem('onboarding_completed', 'true');

    message.success('Data perusahaan berhasil disimpan!');
    onComplete(company);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <Card
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        }}
      >
        <Steps
          current={current}
          items={steps.map((item) => ({
            key: item.title,
            title: item.title,
            description: item.description,
          }))}
          style={{ marginBottom: '40px' }}
        />

        <div style={{ minHeight: '400px' }}>
          {steps[current].content}
        </div>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={current === 0}
            onClick={handlePrev}
            size="large"
          >
            ← Kembali
          </Button>

          <div>
            {current === steps.length - 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={handleComplete}
                icon={<CheckCircleOutlined />}
              >
                Selesai & Lanjut ke Aplikasi
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                onClick={handleNext}
              >
                Lanjut →
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
