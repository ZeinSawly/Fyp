import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert } from 'antd';
import {
  TeamOutlined, UserOutlined, BookOutlined,
  UserAddOutlined, UserDeleteOutlined,
  BarChartOutlined, IdcardOutlined,
  GlobalOutlined, CalendarOutlined, ApartmentOutlined, BankOutlined,
  SolutionOutlined, PlusOutlined, ScheduleOutlined,
} from '@ant-design/icons';   
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Text } = Typography;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [stats, setStats] = useState({
    students: null,
    instructors: null,
    majors: null,
    departments: null,
    courses: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all available data from existing endpoints
      const [majorsRes, deptsRes, coursesRes] = await Promise.all([
        api.get('/api/admin/majors'),
        api.get('/api/admin/departments'),
        api.get('/api/admin/courses'),
      ]);

      setStats({
        majors: majorsRes.data.length,
        departments: deptsRes.data.length,
        courses: coursesRes.data.data?.length || 0,
      });

    } catch (err) {
      setError('Some statistics could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Majors',
      value: stats.majors,
      icon: <SolutionOutlined />,
      color: '#2b6cb0',
      bg: '#EFF6FF',
      desc: 'Academic programs',
    },
    {
      title: 'Departments',
      value: stats.departments,
      icon: <GlobalOutlined />,
      color: '#2f855a',
      bg: '#F0FFF4',
      desc: 'University departments',
    },
    {
      title: 'Academic Year',
      value: '2024-25',
      icon: <CalendarOutlined />,
      color: '#d97706',
      bg: '#FFFBEB',
      desc: 'Spring 2025',
    },
    {
      title: 'Total Courses',
      value: stats.courses,
      icon: <BookOutlined />,
      color: '#d97706',
      bg: '#FFFBEB',
      desc: 'Active courses',
    },
  ];

  const quickActions = [
    { label: 'Add Student', icon: <UserAddOutlined />, color: '#2b6cb0', bg: '#EFF6FF', path: '/admin/add-student', desc: 'Register a new student' },
    { label: 'Deactivate Student', icon: <UserDeleteOutlined />, color: '#d97706', bg: '#FFFBEB', path: '/admin/delete-student', desc: 'Disable a student account' },    
    { label: 'Add Instructor', icon: <UserAddOutlined />, color: '#2f855a', bg: '#F0FFF4', path: '/admin/add-instructor', desc: 'Register a new instructor' },
    { label: 'Deactivate Instructor', icon: <UserDeleteOutlined />, color: '#d97706', bg: '#FFFBEB', path: '/admin/delete-instructor', desc: 'Remove an instructor account' },
    { label: 'Add Finance Officer', icon: <BankOutlined />, color: '#6b46c1', bg: '#FAF5FF', path: '/admin/add-finance-officer', desc: 'Register a finance officer' },
    { label: 'Deactivate Finance Officer', icon: <UserDeleteOutlined />, color: '#d97706', bg: '#FFFBEB', path: '/admin/delete-finance-officer', desc: 'Disable a finance officer account' },
    { label: 'Manage Courses', icon: <BookOutlined />, color: '#2b6cb0', bg: '#EFF6FF', path: '/admin/course-management', desc: 'Add courses & sections' },
    { label: 'Add Section', icon: <PlusOutlined />, color: '#2f855a', bg: '#F0FFF4', path: '/admin/course-management', desc: 'Create course sections' },
    { label: 'Set Schedule', icon: <ScheduleOutlined />, color: '#d97706', bg: '#FFFBEB', path: '/admin/course-management', desc: 'Assign time & room' },
    { label: 'Grade Components', icon: <BarChartOutlined />, color: '#6b46c1', bg: '#FAF5FF', path: '/admin/grade-components', desc: 'Setup grading per course' },
    { label: 'Semesters', icon: <CalendarOutlined />, color: '#6b46c1', bg: '#FAF5FF', path: '/admin/semesters', desc: 'Manage academic semesters' },
  ];

  const systemInfo = [
    { label: 'Admin Name', value: user.name, icon: <UserOutlined /> },
    { label: 'Admin ID', value: user.id, icon: <IdcardOutlined /> },
    { label: 'Role', value: 'Administrator', icon: <ApartmentOutlined /> },
    { label: 'Portal', value: 'Web Admin Portal', icon: <GlobalOutlined /> },
    { label: 'Academic Year', value: '2024 - 2025', icon: <CalendarOutlined /> },
    { label: 'Semester', value: 'Spring 2025', icon: <BookOutlined /> },
  ];

  return (
    <AdminLayout title="Dashboard">

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 8px 32px rgba(26,54,93,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: 80,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
            Welcome back
          </Text>
          <div style={{
            color: '#fff', fontSize: 26, fontWeight: 800,
            margin: '4px 0 6px', letterSpacing: '-0.5px',
          }}>
            {user.name}
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Antonine University — Admin Portal · Spring 2025
          </Text>
        </div>

        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative', zIndex: 1,
        }}>
          <ApartmentOutlined style={{ color: '#fff', fontSize: 28 }} />
        </div>
      </div>

      {error && (
        <Alert message={error} type="warning" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />
      )}

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card style={{
              borderRadius: 16, border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>
                    {card.title}
                  </Text>
                  <div style={{
                    fontSize: 32, fontWeight: 800, color: '#1E293B',
                    lineHeight: 1.1, margin: '6px 0 4px',
                  }}>
                    {loading && card.value === undefined
                      ? <Spin size="small" />
                      : card.value ?? '—'
                    }
                  </div>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>{card.desc}</Text>
                </div>
                <div style={{
                  width: 50, height: 50, borderRadius: 14,
                  background: card.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: card.color,
                }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <Card
        title={<span style={{ color: '#1a365d', fontWeight: 700, fontSize: 15 }}>Quick Actions</span>}
        style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}
      >
        <Row gutter={[12, 12]}>
          {quickActions.map((action, i) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={i}>
              <div
                onClick={() => navigate(action.path)}
                style={{
                  padding: '20px 14px', borderRadius: 14,
                  border: '2px solid #E2E8F0', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: '#fff',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.backgroundColor = action.bg;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${action.color}25`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: action.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                  fontSize: 20, color: action.color,
                }}>
                  {action.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                  {action.label}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4 }}>
                  {action.desc}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Bottom row */}
      <Row gutter={[16, 16]}>

        {/* System Information */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#1a365d', fontWeight: 700, fontSize: 15 }}>System Information</span>}
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            {systemInfo.map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 0',
                borderBottom: i < systemInfo.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    backgroundColor: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#2b6cb0', fontSize: 14,
                  }}>
                    {item.icon}
                  </div>
                  <Text style={{ color: '#64748B', fontSize: 13 }}>{item.label}</Text>
                </div>
                <Text style={{ fontWeight: 600, color: '#1E293B', fontSize: 13 }}>
                  {item.value}
                </Text>
              </div>
            ))}
          </Card>
        </Col>

        {/* Available Modules */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: '#1a365d', fontWeight: 700, fontSize: 15 }}>Available Modules</span>}
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            {[
              { label: 'Student Management', desc: 'Add and remove student accounts', icon: <TeamOutlined />, color: '#2b6cb0', bg: '#EFF6FF', path: '/admin/add-student' },
              { label: 'Instructor Management', desc: 'Add and remove instructor accounts', icon: <UserOutlined />, color: '#2f855a', bg: '#F0FFF4', path: '/admin/add-instructor' },
              { label: 'Course Management', desc: 'Add courses, sections, and schedules', icon: <BookOutlined />, color: '#d97706', bg: '#FFFBEB', path: '/admin/course-management' },
              { label: 'Grade Components', desc: 'Set up grading structure per course', icon: <BarChartOutlined />, color: '#6b46c1', bg: '#FAF5FF', path: '/admin/grade-components' },
            ].map((mod, i) => (
              <div
                key={i}
                onClick={() => navigate(mod.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 12px', borderRadius: 12, cursor: 'pointer',
                  transition: 'all 0.15s',
                  borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = mod.bg;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: mod.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, color: mod.color, flexShrink: 0,
                }}>
                  {mod.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                    {mod.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                    {mod.desc}
                  </div>
                </div>
                <div style={{ color: '#CBD5E0', fontSize: 16 }}>›</div>
              </div>
            ))}
          </Card>
        </Col>

      </Row>
    </AdminLayout>
  );
}
