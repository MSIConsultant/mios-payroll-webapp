import { Form, InputNumber } from 'antd';

const SalaryForm = () => {
  const components = [
    {
      name: 'gaji_pokok',
      label: '💰 Gaji Pokok',
      required: true,
    },
    {
      name: 'tunjangan_transport',
      label: '🚗 Tunjangan Transport',
      required: false,
    },
    {
      name: 'tunjangan_makan',
      label: '🍽️ Tunjangan Makan',
      required: false,
    },
    {
      name: 'tunjangan_komunikasi',
      label: '📱 Tunjangan Komunikasi',
      required: false,
    },
    {
      name: 'tunjangan_perumahan',
      label: '🏠 Tunjangan Perumahan',
      required: false,
    },
    {
      name: 'tunjangan_kesehatan',
      label: '🏥 Tunjangan Kesehatan',
      required: false,
    },
    {
      name: 'tunjangan_lainnya',
      label: '📦 Tunjangan Lainnya',
      required: false,
    },
  ];

  return (
    <>
      {components.map((component) => (
        <Form.Item
          key={component.name}
          label={component.label}
          name={component.name}
          rules={
            component.required
              ? [{ required: true, message: `${component.label} wajib diisi` }]
              : []
          }
          initialValue={0}
        >
          <InputNumber<number>
            min={0}
            placeholder="0"
            style={{ width: '100%' }}
            formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(value?: string) => parseInt(value?.replace(/\D/g, '') || '0')}
          />
        </Form.Item>
      ))}
    </>
  );
};

export default SalaryForm;
