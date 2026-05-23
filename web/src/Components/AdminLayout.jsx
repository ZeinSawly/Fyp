import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined, UserAddOutlined, UserDeleteOutlined,
  TeamOutlined, DollarOutlined, BookOutlined,
  MenuUnfoldOutlined, BankOutlined, SafetyCertificateOutlined,
  BellOutlined, CalendarOutlined, LogoutOutlined, MenuFoldOutlined, TagOutlined, GiftOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

export default function AdminLayout({ children, title = 'Dashboard' }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: 'Dashboard' },
    {
      key: 'students', icon: <TeamOutlined />, label: 'Students',
      children: [
        { key: '/admin/add-student', icon: <UserAddOutlined />, label: 'Add Student' },
        { key: '/admin/delete-student', icon: <UserDeleteOutlined />, label: 'Deactivate Student' },
      ],
    },
    {
      key: 'instructors', icon: <TeamOutlined />, label: 'Instructors',
      children: [
        { key: '/admin/add-instructor', icon: <UserAddOutlined />, label: 'Add Instructor' },
        { key: '/admin/delete-instructor', icon: <UserDeleteOutlined />, label: 'Deactivate Instructor' },
      ],
    },
    {
      key: 'finance-officers', icon: <BankOutlined />, label: 'Finance Officers',
      children: [
        { key: '/admin/add-finance-officer', icon: <UserAddOutlined />, label: 'Add Finance Officer' },
        { key: '/admin/delete-finance-officer', icon: <UserDeleteOutlined />, label: 'Deactivate Finance Officer' },
      ],
    },
    {
      key: 'courses', icon: <BookOutlined />, label: 'Course Management',
      children: [
        { key: '/admin/course-management', icon: <BookOutlined />, label: 'Manage Courses' },
      ],
    },
    {
      key: 'semesters', icon: <CalendarOutlined />, label: 'Semester Management',
      children: [
        { key: '/admin/semesters', icon: <BookOutlined />, label: 'Manage Semesters' },
      ],
    },
    {
      key: 'finance', icon: <DollarOutlined />, label: 'Finance',
      children: [
        { key: '/admin/credit-pricing', icon: <DollarOutlined />, label: 'Credit Pricing' },
        { key: '/admin/fee-management', icon: <TagOutlined />, label: 'Fee Management' },
        { key: '/admin/discount-management', icon: <GiftOutlined />, label: 'Discount Management' },
      ],
    },
  ];

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: 'linear-gradient(180deg, #1a365d 0%, #2b6cb0 100%)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>
                Antonine
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                Admin Portal
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['students', 'instructors', 'finance']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none', marginTop: 8 }}
          theme="dark"
        />

        {/* Bottom user info */}
        {!collapsed && (
          <div style={{
            position: 'absolute', bottom: 20, left: 12, right: 12,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 2, textTransform: 'uppercase' }}>
              Logged in as
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
              {user.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              Administrator · ID {user.id}
            </div>
          </div>
        )}
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        {/* Header */}
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: '#1a365d', width: 40, height: 40 }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a365d', lineHeight: 1.2 }}>
                {title}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                Antonine University — Admin Portal
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: 18, color: '#64748B', width: 40, height: 40 }}
            />
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => { if (key === 'logout') handleLogout(); },
              }}
              placement="bottomRight"
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', padding: '4px 12px',
                borderRadius: 10, border: '1px solid #E2E8F0',
                background: '#F8FAFC',
              }}>
                <Avatar style={{ backgroundColor: '#2b6cb0', fontWeight: 700 }}>
                  {user.name?.charAt(0) || 'A'}
                </Avatar>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1a365d', lineHeight: 1.2 }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>Administrator</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content style={{ margin: 24, minHeight: 'calc(100vh - 112px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
