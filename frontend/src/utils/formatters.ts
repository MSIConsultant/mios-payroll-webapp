/**
 * Currency formatter - formats numbers as Indonesian Rupiah
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(Math.round(value));
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number => {
  return parseInt(value.replace(/\D/g, ''), 10) || 0;
};

/**
 * Convert numbers to percentage
 */
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data: any[], filename: string) => {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parse Excel file (requires xlsx library)
 */
export const parseExcelFile = async (file: File): Promise<any[]> => {
  const XLSX = await import('xlsx');
  return new Promise((resolve: (value: any[]) => void, reject: (reason?: any) => void) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsBinaryString(file);
  });
};

/**
 * Generate Excel from data
 */
export const exportToExcel = async (data: any[], filename: string): Promise<void> => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Generate PDF (placeholder - will use jsPDF)
 */
export const generatePayslipPDF = async (
  employeeName: string,
  payrollData: any,
  filename: string
): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(16);
  doc.text('SLIP GAJI KARYAWAN', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(12);
  doc.text(`Nama: ${employeeName}`, 20, yPosition);

  yPosition += 10;
  doc.text(`Periode: ${payrollData.period}`, 20, yPosition);

  yPosition += 15;
  doc.setFontSize(10);

  // Income section
  doc.text('PENGHASILAN:', 20, yPosition);
  yPosition += 7;

  const components = payrollData.components;
  if (components && typeof components === 'object') {
    if ('gaji_pokok' in components) {
      doc.text(`  Gaji Pokok: Rp ${formatNumber(components.gaji_pokok)}`, 25, yPosition);
      yPosition += 5;
    }
    if (components.allowances && Array.isArray(components.allowances)) {
      components.allowances.forEach((allowance: any) => {
        if (allowance.amount > 0) {
          doc.text(`  ${allowance.type}: Rp ${formatNumber(allowance.amount)}`, 25, yPosition);
          yPosition += 5;
        }
      });
    }
  }

  yPosition += 5;
  doc.text(`  TOTAL BRUTO: Rp ${formatNumber(payrollData.bruto_monthly)}`, 20, yPosition, {
    fontStyle: 'bold',
  } as any);

  // Deductions section
  yPosition += 15;
  doc.text('POTONGAN:', 20, yPosition);
  yPosition += 7;

  doc.text(
    `  PPh 21: Rp ${formatNumber(payrollData.pph21.employee_portion)}`,
    25,
    yPosition
  );
  yPosition += 5;
  doc.text(
    `  BPJS Kesehatan: Rp ${formatNumber(payrollData.bpjs.kesehatan.employee)}`,
    25,
    yPosition
  );
  yPosition += 5;
  doc.text(
    `  BPJS JHT: Rp ${formatNumber(payrollData.bpjs.jht.employee)}`,
    25,
    yPosition
  );
  yPosition += 5;
  doc.text(
    `  BPJS JP: Rp ${formatNumber(payrollData.bpjs.jp.employee)}`,
    25,
    yPosition
  );
  yPosition += 5;
  doc.text(
    `  BPJS JKK: Rp ${formatNumber(payrollData.bpjs.jkk.employee)}`,
    25,
    yPosition
  );

  // Net salary
  yPosition += 10;
  doc.setFontSize(11);
  doc.text(
    `GAJI BERSIH: Rp ${formatNumber(payrollData.summary.net_salary)}`,
    20,
    yPosition,
    { fontStyle: 'bold' } as any
  );

  // Footer
  doc.setFontSize(8);
  doc.text('Dicetak oleh: MIOS Payroll System', 20, doc.internal.pageSize.getHeight() - 10);

  doc.save(`${filename}.pdf`);
};
