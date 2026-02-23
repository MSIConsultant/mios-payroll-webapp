import { Divider } from 'antd';
import { PayrollCalculationResponse } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BreakdownDisplayProps {
  calculation: PayrollCalculationResponse;
}

const BreakdownDisplay = ({ calculation }: BreakdownDisplayProps) => {
  return (
    <div>
      {/* Header Info */}
      <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#262626' }}>{calculation.employee_name}</h3>
        <p style={{ margin: '0', color: '#8c8c8c', fontSize: '12px' }}>
          Periode: {calculation.period}
        </p>
      </div>

      {/* Income Section */}
      <div className="breakdown-section">
        <h4 className="section-title">💰 Penghasilan</h4>
        <div className="breakdown-row">
          <span>Gaji Pokok</span>
          <span className="salary-value">{formatCurrency(calculation.components.gaji_pokok)}</span>
        </div>
        {calculation.components.allowances.map((allowance, index) => (
          <div key={index} className="breakdown-row">
            <span>Tunjangan: {allowance.type}</span>
            <span className="salary-value">{formatCurrency(allowance.amount)}</span>
          </div>
        ))}
        <div className="breakdown-row total">
          <span>Total Bruto</span>
          <span style={{ color: '#1890ff' }}>{formatCurrency(calculation.bruto_monthly)}</span>
        </div>
      </div>

      <Divider />

      {/* Tax Section */}
      <div className="breakdown-section">
        <h4 className="section-title">🔴 PPh 21 (Pajak Penghasilan)</h4>
        <div className="breakdown-row">
          <span>PTKP Status: {calculation.pph21.ptkp_status}</span>
          <span>{calculation.pph21.ter_category}</span>
        </div>
        <div className="breakdown-row">
          <span>TER Rate</span>
          <span>{(calculation.pph21.ter_rate * 100).toFixed(2)}%</span>
        </div>
        {calculation.pph21.employee_portion > 0 && (
          <div className="breakdown-row">
            <span>PPh 21 (Karyawan Tanggung)</span>
            <span style={{ color: '#f5222d' }}>
              {formatCurrency(calculation.pph21.employee_portion)}
            </span>
          </div>
        )}
        {calculation.pph21.employer_portion > 0 && (
          <div className="breakdown-row">
            <span>PPh 21 (Pemberi Kerja Tanggung)</span>
            <span style={{ color: '#faad14' }}>
              {formatCurrency(calculation.pph21.employer_portion)}
            </span>
          </div>
        )}
      </div>

      <Divider />

      {/* BPJS Section */}
      <div className="breakdown-section">
        <h4 className="section-title">💙 BPJS Kesejahteraan</h4>

        {/* Kesehatan */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 500, fontSize: '13px' }}>Kesehatan (4% ER / 1% EE)</span>
          <div style={{ marginLeft: '10px', marginTop: '5px' }}>
            <div className="breakdown-row">
              <span>├─ Karyawan</span>
              <span>{formatCurrency(calculation.bpjs.kesehatan.employee)}</span>
            </div>
            <div className="breakdown-row">
              <span>├─ Pemberi Kerja</span>
              <span style={{ color: '#faad14' }}>
                {formatCurrency(calculation.bpjs.kesehatan.employer)}
              </span>
            </div>
            <div className="breakdown-row" style={{ fontWeight: 500 }}>
              <span>└─ Total</span>
              <span>{formatCurrency(calculation.bpjs.kesehatan.total)}</span>
            </div>
          </div>
        </div>

        {/* JHT */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 500, fontSize: '13px' }}>JHT - Dana Pensiun (3.7% ER / 2% EE)</span>
          <div style={{ marginLeft: '10px', marginTop: '5px' }}>
            <div className="breakdown-row">
              <span>├─ Karyawan</span>
              <span>{formatCurrency(calculation.bpjs.jht.employee)}</span>
            </div>
            <div className="breakdown-row">
              <span>├─ Pemberi Kerja</span>
              <span style={{ color: '#faad14' }}>
                {formatCurrency(calculation.bpjs.jht.employer)}
              </span>
            </div>
            <div className="breakdown-row" style={{ fontWeight: 500 }}>
              <span>└─ Total</span>
              <span>{formatCurrency(calculation.bpjs.jht.total)}</span>
            </div>
          </div>
        </div>

        {/* JP */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 500, fontSize: '13px' }}>JP - Asuransi Cacat (2% ER / 1% EE)</span>
          <div style={{ marginLeft: '10px', marginTop: '5px' }}>
            <div className="breakdown-row">
              <span>├─ Karyawan</span>
              <span>{formatCurrency(calculation.bpjs.jp.employee)}</span>
            </div>
            <div className="breakdown-row">
              <span>├─ Pemberi Kerja</span>
              <span style={{ color: '#faad14' }}>
                {formatCurrency(calculation.bpjs.jp.employer)}
              </span>
            </div>
            <div className="breakdown-row" style={{ fontWeight: 500 }}>
              <span>└─ Total</span>
              <span>{formatCurrency(calculation.bpjs.jp.total)}</span>
            </div>
          </div>
        </div>

        {/* JKK */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 500, fontSize: '13px' }}>
            JKK - Asuransi Kecelakaan (Risiko: {calculation.bpjs.jkk.risk_level})
          </span>
          <div style={{ marginLeft: '10px', marginTop: '5px' }}>
            <div className="breakdown-row">
              <span>├─ Pemberi Kerja</span>
              <span style={{ color: '#faad14' }}>
                {formatCurrency(calculation.bpjs.jkk.employer)}
              </span>
            </div>
            <div className="breakdown-row" style={{ fontWeight: 500 }}>
              <span>└─ Karyawan</span>
              <span>{formatCurrency(calculation.bpjs.jkk.employee)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
          <div className="breakdown-row">
            <span style={{ fontWeight: 600 }}>Total BPJS (Karyawan)</span>
            <span style={{ fontWeight: 600, color: '#f5222d' }}>
              {formatCurrency(calculation.bpjs.total_employee)}
            </span>
          </div>
          <div className="breakdown-row">
            <span style={{ fontWeight: 600 }}>Total BPJS (Pemberi Kerja)</span>
            <span style={{ fontWeight: 600, color: '#faad14' }}>
              {formatCurrency(calculation.bpjs.total_employer)}
            </span>
          </div>
        </div>
      </div>

      <Divider style={{ margin: '20px 0' }} />

      {/* Summary Section */}
      <div className="breakdown-section">
        <h4 className="section-title">📊 Ringkasan</h4>
        <div className="breakdown-row">
          <span>Bruto</span>
          <span className="salary-value">{formatCurrency(calculation.summary.bruto)}</span>
        </div>
        <div className="breakdown-row">
          <span>Total Potongan Karyawan</span>
          <span style={{ color: '#f5222d' }}>
            {formatCurrency(calculation.summary.total_deductions_employee)}
          </span>
        </div>
        <div className="breakdown-row net-salary">
          <span>✅ GAJI BERSIH (yang diterima karyawan)</span>
          <span>{formatCurrency(calculation.summary.net_salary)}</span>
        </div>
        <div className="breakdown-row employer-cost">
          <span>💼 BIAYA PEMBERI KERJA (total pengeluaran)</span>
          <span>{formatCurrency(calculation.summary.total_employer_cost)}</span>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
        <p style={{ margin: '0 0 5px 0' }}>
          <strong>Catatan - Perusahaan Menanggung:</strong>
        </p>
        {calculation.config.company_borne && calculation.config.company_borne.length > 0 ? (
          calculation.config.company_borne.map((benefit) => (
            <p key={benefit} style={{ margin: '0 0 3px 0' }}>
              ✓ {benefit.toUpperCase()}
            </p>
          ))
        ) : (
          <p style={{ margin: '0' }}>Standard: Karyawan membayar PPh 21 dan sebagian BPJS</p>
        )}
      </div>
    </div>
  );
};

export default BreakdownDisplay;
