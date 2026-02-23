# MIOS Payroll - Frontend React Application

Aplikasi frontend React untuk sistem penggajian MIOS Payroll.

## 🚀 Fitur

- ✅ **Kalkulator Gaji** - Hitung gaji dengan breakdown lengkap
- ✅ **Import Massal** - Upload file Excel untuk multiple karyawan
- ✅ **Laporan Visual** - Grafik dan tabel hasil perhitungan
- ✅ **Export PDF/Excel** - Generate slip gaji dan laporan
- ✅ **Real-time Preview** - Lihat hasil perhitungan seketika
- ✅ **Responsive Design** - Bekerja di desktop, tablet, mobile

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Ant Design** - UI Components
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Recharts** - Data Visualization
- **jsPDF** - PDF Generation
- **XLSX** - Excel Handling

## 📋 Prerequisites

- Node.js 16+
- npm atau yarn
- Backend API running on `http://localhost:8000` (atau sesuaikan di .env)

## 🏃 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure API Endpoint
Buat atau edit file `.env`:
```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

### 3. Start Development Server
```bash
npm start
```

Server akan berjalan di: **http://localhost:3000**

### 4. Build untuk Production
```bash
npm run build
```

Output akan di folder `frontend/build/`

## 📱 Pages

- **Dashboard** (`/`) - Overview dan statistik
- **Kalkulator** (`/calculator`) - Single employee calculation
- **Import Massal** (`/batch`) - Batch upload & processing
- **Laporan** (`/reports`) - Reports dan visualisasi
- **Pengaturan** (`/settings`) - System settings (WIP)

## 🎯 How to Use

### Perhitungan Single Karyawan

1. Buka **Kalkulator**
2. Masukkan data gaji karyawan (gaji pokok + tunjangan)
3. Pilih **PTKP Status** dan **JKK Risk Level**
4. Konfigurasi apakah pemberi kerja menanggung pajak/BPJS
5. Klik **Hitung**
6. Lihat breakdown lengkap di sebelah kanan
7. Klik **Simpan** untuk menyimpan atau **Cetak PDF** untuk slip gaji

### Import Massal (Batch)

1. Buka **Import Massal**
2. Drag & drop file Excel atau klik untuk browse
3. File harus memiliki kolom: `nama`, `gaji_pokok`, `tunjangan_*`, dst
4. Klik **Proses Batch**
5. Tunggu hingga 100% selesai
6. Lihat hasil di tabel
7. Klik **Ekspor ke Excel** untuk download hasil

### Generate Laporan

1. Buka **Laporan**
2. Lihat summary metrics (total bruto, tax, BPJS, gaji bersih)
3. Lihat grafik visualisasi
4. Download detail report dalam Excel atau cetak

## 🔌 API Integration

Frontend berkomunikasi dengan backend FastAPI via REST:

```typescript
POST /api/v1/calculation/calculate
GET /api/v1/calculation/ptkp-options
GET /api/v1/calculation/ter-brackets/:status
GET /api/v1/calculation/jkk-risk-levels
```

Lihat `src/utils/api.ts` untuk dokumentasi lengkap.

## 💾 State Management

Menggunakan **Zustand** untuk state management yang sederhana:

```typescript
import { usePayrollStore } from '../store/payrollStore';

const { calculations, currentCalculation, saveCalculation } = usePayrollStore();
```

## 📦 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Calculator.tsx
│   │   ├── BatchUpload.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── components/         # Reusable components
│   │   ├── SalaryForm.tsx
│   │   └── BreakdownDisplay.tsx
│   ├── store/             # Zustand store
│   │   └── payrollStore.ts
│   ├── utils/             # Utility functions
│   │   ├── api.ts
│   │   └── formatters.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── App.tsx            # Main app component
│   ├── index.tsx          # Entry point
│   ├── index.css
│   └── App.css
├── package.json
├── tsconfig.json
└── .env
```

## 🎨 UI Components

Menggunakan **Ant Design** components:

- Form, Input, InputNumber
- Table, List
- Card, Space, Row, Col
- Button, Select, Checkbox
- Alert, Modal, Drawer
- Upload, Progress
- Statistic, Badge, Tag
- dan lainnya

## 🔄 Development Workflow

1. **Buat branch baru**:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Install dependencies** (jika ada):
   ```bash
   npm install
   ```

3. **Start dev server**:
   ```bash
   npm start
   ```

4. **Buat perubahan** dan test

5. **Commit dan push**:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature
   ```

6. **Create Pull Request**

## 📝 Checklist Format Data Import

File Excel harus memiliki header:
- [ ] `nama` atau `employee_name`
- [ ] `gaji_pokok`
- [ ] `tunjangan_transport`
- [ ] `tunjangan_makan`
- [ ] `tunjangan_komunikasi`
- [ ] `tunjangan_perumahan`
- [ ] `tunjangan_kesehatan` (optional)
- [ ] `tunjangan_lainnya` (optional)
- [ ] `ptkp_status` (optional, default K1)
- [ ] `jkk_risk_level` (optional, default S)

## 🚨 Troubleshooting

### Blank page atau error di console?
- Pastikan backend running: `http://localhost:8000/docs`
- Check file `.env` sudah ada dan benar
- Clear browser cache: Ctrl+Shift+Delete

### API connection refused?
- Backend harus running
- Check `.env` API URL benar
- Test melalui Swagger UI backend

### File import error?
- Gunakan format Excel: XLSX
- Check kolom header sesuai template
- Data harus dalam format angka (tidak ada format khusus)

## 📞 Support

Untuk issue atau pertanyaan:
1. Check `README.md` backend
2. Review dokumentasi di `../ARCHITECTURE_DIAGRAMS.md`
3. Lihat contoh di `../demo_payroll.py`

## 📄 License

Proprietary - MIOS Payroll System

---

**Built with ❤️ for Indonesian Accountants**

Siap mengubah cara penggajian di Indonesia! 🇮🇩
