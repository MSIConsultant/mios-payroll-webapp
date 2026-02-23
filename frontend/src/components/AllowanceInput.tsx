import { Button, InputNumber, Input, Row, Col, Divider, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Allowance } from '../types';

interface AllowanceInputProps {
  value?: Allowance[];
  onChange?: (value: Allowance[]) => void;
}

const AllowanceInput: React.FC<AllowanceInputProps> = ({ value = [], onChange }) => {
  const handleAddAllowance = () => {
    const newAllowance: Allowance = { type: '', amount: 0 };
    onChange?.([...value, newAllowance]);
  };

  const handleChangeType = (index: number, type: string) => {
    const updated = [...value];
    updated[index].type = type;
    onChange?.(updated);
  };

  const handleChangeAmount = (index: number, amount: number) => {
    const updated = [...value];
    updated[index].amount = amount || 0;
    onChange?.(updated);
  };

  const handleRemoveAllowance = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange?.(updated);
  };

  const allowanceTypes = [
    'Transport',
    'Meal',
    'Communication',
    'Housing',
    'Health',
    'Other',
  ];

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '12px' }}>
      {value.length === 0 ? (
        <Empty description="Tidak ada tunjangan" style={{ margin: '20px 0' }} />
      ) : (
        <div>
          {value.map((allowance, index) => (
            <div key={index}>
              <Row gutter={[12, 0]} align="middle">
                <Col xs={24} md={10}>
                  <Input
                    placeholder="Tipe tunjangan (e.g., Transport, Meal)"
                    value={allowance.type}
                    onChange={(e) => handleChangeType(index, e.target.value)}
                    list={`allowance-types-${index}`}
                  />
                  <datalist id={`allowance-types-${index}`}>
                    {allowanceTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </Col>
                <Col xs={24} md={10}>
                  <InputNumber
                    placeholder="Jumlah"
                    value={allowance.amount}
                    onChange={(val) => handleChangeAmount(index, val || 0)}
                    formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => parseInt(value?.replace(/Rp\s?|(,*)/g, '') || '0')}
                    style={{ width: '100%' }}
                    min={0}
                  />
                </Col>
                <Col xs={24} md={4}>
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveAllowance(index)}
                    block
                  >
                    Hapus
                  </Button>
                </Col>
              </Row>
              {index < value.length - 1 && <Divider style={{ margin: '12px 0' }} />}
            </div>
          ))}
        </div>
      )}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAddAllowance}
        block
        style={{ marginTop: '12px' }}
      >
        Tambah Tunjangan
      </Button>
    </div>
  );
};

export default AllowanceInput;
