import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { payrollAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const data = await payrollAPI.login(values.email, values.password);
      // Expect response: { access_token, refresh_token, user }
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user || null);
      message.success('Login berhasil');
      navigate('/');
    } catch (err: any) {
      message.error(err?.message || 'Login gagal');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card title="Masuk ke MIOS Payroll" style={{ width: 420 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email harus diisi' }] }>
            <Input placeholder="admin@company.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password harus diisi' }] }>
            <Input.Password placeholder="Masukkan password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              Masuk
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
