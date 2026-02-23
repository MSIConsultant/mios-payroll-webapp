import { Card, Alert } from 'antd';

const Settings = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#262626' }}>⚙️ Pengaturan</h1>

      <Card title="Pengaturan Sistem">
        <Alert
          message="Fitur Pengaturan Belum Tersedia"
          description="Pengaturan sistem akan dikembangkan di fase berikutnya"
          type="info"
          showIcon
        />

        <div style={{ marginTop: '30px' }}>
          <h3>Fitur yang Akan Datang:</h3>
          <ul>
            <li>Konfigurasi Perusahaan (nama, NPWP, alamat)</li>
            <li>Pengaturan Pajak (update tabel TER, PTKP)</li>
            <li>Pengaturan BPJS (rate kontribusi)</li>
            <li>Preferensi Laporan (format, kolom default)</li>
            <li>Enkripsi Data dan Backup</li>
            <li>Manajemen User dan Hak Akses</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
