import { Card, Upload, Button, Table, Progress, Alert, Space, Select, Form } from 'antd';
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { RcFile } from 'antd/es/upload';
import { parseExcelFile, exportToExcel } from '../utils/formatters';
import payrollAPI from '../utils/api';
import { PayrollCalculationRequest, PayrollCalculationResponse } from '../types';

const BatchUpload = () => {
  const [fileData, setFileData] = useState<any[]>([]);
  const [results, setResults] = useState<PayrollCalculationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [ptkpDefault, setPtkpDefault] = useState('K1');
  const [jkkDefault, setJkkDefault] = useState('S');

  const handleFileUpload = async (file: RcFile) => {
    try {
      setError('');
      setProgress(0);
      const data = await parseExcelFile(file);
      setFileData(data);
    } catch (err: any) {
      setError(`Gagal membaca file: ${err.message}`);
    }
    return false; // Prevent default upload
  };

  const handleProcessBatch = async () => {
    if (fileData.length === 0) {
      setError('Tidak ada data untuk diproses');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const processedResults: PayrollCalculationResponse[] = [];

      for (let i = 0; i < fileData.length; i++) {
        const row = fileData[i];
        const payload: PayrollCalculationRequest = {
          employee_id: row.employee_id || `EMP-${i}`,
          company_id: 'DEFAULT-COMPANY',
          nama: row.nama || `Karyawan ${i + 1}`,
          npwp: row.npwp || '',
          nik: row.nik || '',
          tgl_lahir: row.tgl_lahir || new Date().toISOString().split('T')[0],
          jenis_kelamin: (row.jenis_kelamin as 'L' | 'P') || 'L',
          jabatan: row.jabatan || '',
          status_ptkp: row.ptkp_status || ptkpDefault,
          salary_profile: {
            gaji_pokok: parseFloat(row.gaji_pokok || 0),
            allowances: [],
          },
          benefit_config: {
            company_borne: [],
            risk_level: row.jkk_risk_level || jkkDefault,
          },
        };

        const result = await payrollAPI.calculatePayroll(payload);
        processedResults.push(result);
        setProgress(Math.round(((i + 1) / fileData.length) * 100));
      }

      setResults(processedResults);
      setFileData([]); // Clear original data after processing
    } catch (err: any) {
      setError(`Gagal memproses batch: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportResults = () => {
    if (results.length === 0) {
      setError('Tidak ada hasil untuk diekspor');
      return;
    }

    const exportData = results.map((r) => ({
      'Nama Karyawan': r.employee_name,
      'Bruto': r.bruto_monthly,
      'PPh 21': r.pph21.employee_portion,
      'BPJS Kesehatan': r.bpjs.kesehatan.total,
      'BPJS JHT': r.bpjs.jht.total,
      'BPJS JP': r.bpjs.jp.total,
      'BPJS JKK': r.bpjs.jkk.total,
      'Total Potongan': r.summary.total_deductions_employee,
      'Gaji Bersih': r.summary.net_salary,
      'Biaya Pemberi Kerja': r.summary.total_employer_cost,
    }));

    exportToExcel(exportData, `Hasil-Perhitungan-${new Date().toISOString().split('T')[0]}`);
  };

  const columns = [
    {
      title: 'Nama Karyawan',
      dataIndex: ['employee_name'],
      key: 'employee_name',
    },
    {
      title: 'Bruto',
      dataIndex: ['bruto_monthly'],
      key: 'bruto',
      render: (value: number) => `Rp ${value.toLocaleString('id-ID')}`,
    },
    {
      title: 'Gaji Bersih',
      dataIndex: ['summary', 'net_salary'],
      key: 'net_salary',
      render: (value: number) => (
        <span style={{ color: '#1890ff', fontWeight: 500 }}>Rp {value.toLocaleString('id-ID')}</span>
      ),
    },
    {
      title: 'PPh 21',
      dataIndex: ['pph21', 'employee_portion'],
      key: 'tax',
      render: (value: number) => <span style={{ color: '#f5222d' }}>Rp {value.toLocaleString('id-ID')}</span>,
    },
    {
      title: 'BPJS Total',
      dataIndex: ['bpjs', 'total_employee'],
      key: 'bpjs',
      render: (value: number) => `Rp ${value.toLocaleString('id-ID')}`,
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#262626' }}>📂 Import Massal</h1>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

      <Card title="📥 Upload File Excel" style={{ marginBottom: '20px' }}>
        <Upload.Dragger
          beforeUpload={handleFileUpload}
          accept=".xlsx,.xls,.csv"
          multiple={false}
          style={{ marginBottom: '20px' }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">Seret file Excel ke sini atau klik untuk memilih</p>
          <p className="ant-upload-hint">Format: XLSX, XLS, atau CSV</p>
        </Upload.Dragger>

        {fileData.length > 0 && (
          <Alert
            message={`${fileData.length} baris data siap diproses`}
            type="success"
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: '20px' }}
            showIcon
          />
        )}

        <Form layout="vertical" style={{ marginBottom: '20px' }}>
          <Form.Item label="PTKP Default (jika tidak ada di file)">
            <Select
              value={ptkpDefault}
              onChange={setPtkpDefault}
              options={[
                { label: 'TK0', value: 'TK0' },
                { label: 'K0', value: 'K0' },
                { label: 'K1', value: 'K1' },
                { label: 'K2', value: 'K2' },
                { label: 'K3', value: 'K3' },
              ]}
            />
          </Form.Item>
          <Form.Item label="JKK Risk Level Default">
            <Select
              value={jkkDefault}
              onChange={setJkkDefault}
              options={[
                { label: 'SR - Sangat Rendah', value: 'SR' },
                { label: 'R - Rendah', value: 'R' },
                { label: 'S - Sedang', value: 'S' },
                { label: 'T - Tinggi', value: 'T' },
                { label: 'ST - Sangat Tinggi', value: 'ST' },
              ]}
            />
          </Form.Item>
        </Form>

        <Space>
          <Button
            type="primary"
            onClick={handleProcessBatch}
            loading={loading}
            disabled={fileData.length === 0}
          >
            Proses Batch
          </Button>
          {fileData.length > 0 && (
            <span style={{ color: '#8c8c8c' }}>
              {fileData.length} baris siap diproses
            </span>
          )}
        </Space>

        {loading && (
          <div style={{ marginTop: '20px' }}>
            <Progress
              percent={progress}
              status={progress === 100 ? 'success' : 'active'}
              format={(percent) => `${percent}% Selesai`}
            />
          </div>
        )}
      </Card>

      {results.length > 0 && (
        <Card title={`✅ Hasil (${results.length} karyawan)`}>
          <div style={{ marginBottom: '20px' }}>
            <Alert
              message={`Berhasil memproses ${results.length} karyawan`}
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
            />
          </div>

          <Button type="primary" onClick={handleExportResults} style={{ marginBottom: '20px' }}>
            📥 Ekspor ke Excel
          </Button>

          <Table
            columns={columns}
            dataSource={results}
            rowKey={(_, index = 0) => index.toString()}
            pagination={{ pageSize: 20 }}
            size="small"
          />
        </Card>
      )}

      <Card title="📋 Template File" style={{ marginTop: '20px' }}>
        <p>File Excel harus memiliki kolom berikut:</p>
        <ul>
          <li><strong>nama</strong> atau <strong>employee_name</strong> - Nama karyawan</li>
          <li><strong>gaji_pokok</strong> - Gaji pokok</li>
          <li><strong>tunjangan_transport</strong> - Tunjangan Transport</li>
          <li><strong>tunjangan_makan</strong> - Tunjangan Makan</li>
          <li><strong>tunjangan_komunikasi</strong> - Tunjangan Komunikasi</li>
          <li><strong>tunjangan_perumahan</strong> - Tunjangan Perumahan</li>
          <li><strong>tunjangan_kesehatan</strong> - Tunjangan Kesehatan (opsional)</li>
          <li><strong>tunjangan_lainnya</strong> - Tunjangan Lainnya (opsional)</li>
          <li><strong>ptkp_status</strong> - Status PTKP (TK0, K1, K3, dll) - opsional</li>
          <li><strong>jkk_risk_level</strong> - Tingkat Risiko JKK (SR, S, T) - opsional</li>
        </ul>
      </Card>
    </div>
  );
};

export default BatchUpload;
