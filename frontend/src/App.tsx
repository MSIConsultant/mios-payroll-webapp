import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CalculatorOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  SettingOutlined,
  BuildOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import Calculator from './pages/Calculator';
import BatchUpload from './pages/BatchUpload';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import CompanyManagement from './pages/CompanyManagement';
import Login from './pages/Login';
import { Company } from './types';
import './App.css';

const { Sider, Content, Header } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = () => {
      const completed = localStorage.getItem('onboarding_completed') === 'true';
      const savedCompany = localStorage.getItem('company');
      
      setOnboardingComplete(completed);
      if (savedCompany) {
        try {
          setCompany(JSON.parse(savedCompany));
        } catch (error) {
          console.error('Failed to load company:', error);
        }
      }
      setLoading(false);
    };

    checkOnboarding();
  }, []);

  const handleOnboardingComplete = (companyData: Company) => {
    setCompany(companyData);
    setOnboardingComplete(true);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat...</div>;
  }

  // Show onboarding page if not completed
  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // If not logged in, show login
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    return <Login />;
  }

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/',
    },
    {
      key: '/company',
      icon: <BuildOutlined />,
      label: 'Data Perusahaan',
      path: '/company',
    },
    {
      key: '/employees',
      icon: <UserOutlined />,
      label: 'Data Karyawan',
      path: '/employees',
    },
    {
      key: '/calculator',
      icon: <CalculatorOutlined />,
      label: 'Kalkulator',
      path: '/calculator',
    },
    {
      key: '/batch',
      icon: <FileExcelOutlined />,
      label: 'Import Massal',
      path: '/batch',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Laporan',
      path: '/reports',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Pengaturan',
      path: '/settings',
    },
  ];

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const userMenu = [
    {
      key: '1',
      label: 'Profil',
    },
    {
      key: '2',
      label: 'Logout',
      icon: <LogoutOutlined />,      
      onClick: () => {
        logout();
        window.location.href = '/login';
      },
    },
  ];

  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          style={{
            background: '#001529',
          }}
        >
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              borderBottom: '1px solid #263238',
            }}
          >
            {!collapsed && '🎯 MIOS PAYROLL'}
          </div>
          
          {/* Company badge */}
          {company && !collapsed && (
            <div
              style={{
                padding: '12px 20px',
                fontSize: '12px',
                color: '#999',
                borderBottom: '1px solid #263238',
                textAlign: 'center',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              }}
            >
              🏢 {company.nama}
            </div>
          )}

          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['/']}
            items={menuItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
            }))}
            onClick={(e) => {
              const selected = menuItems.find((item) => item.key === e.key);
              if (selected) window.location.href = selected.path;
            }}
          />
        </Sider>

        <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              type="text"
              icon={<MenuOutlined size={18} />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '18px' }}
            />
            <div>
              <Dropdown
                menu={{
                  items: userMenu,
                }}
                placement="bottomRight"
              >
                <Button type="text">{user?.full_name ? `👤 ${user.full_name}` : '👤 Admin User'}</Button>
              </Dropdown>
            </div>
          </Header>

          <Content
            style={{
              margin: '20px',
              padding: '20px',
              background: '#f5f5f5',
              borderRadius: '8px',
              overflowY: 'auto',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/company" element={<CompanyManagement />} />
              <Route path="/employees" element={<EmployeeManagement />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/batch" element={<BatchUpload />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
