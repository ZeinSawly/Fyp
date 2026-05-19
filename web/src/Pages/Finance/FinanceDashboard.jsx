import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Table, Tag } from 'antd';
import {
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  UserOutlined, IdcardOutlined, GlobalOutlined,
  CalendarOutlined, BankOutlined, FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FinanceLayout from '../../Components/FinanceLayout';
import api from '../../config/api';

const { Text } = Typography;

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [stats, setStats] = useState({
    totalPaid: null,
    totalPending: null,
    totalTransactions: null,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New state for current semester
  const [currentSemester, setCurrentSemester] = useState(null);
  const [semesterLoading, setSemesterLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchCurrentSemester();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/finance/stats');
      if (res.data.success) {
        setStats({
          totalPaid: res.data.data.totalPaid,
          totalPending: res.data.data.totalPending,
          totalTransactions: res.data.data.totalTransactions,
        });
        setRecentTransactions(res.data.data.recentTransactions || []);
      }
    } catch (err) {
      setError('Could not load financial statistics.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch current semester from backend
  const fetchCurrentSemester = async () => {
    setSemesterLoading(true);
    try {
      const res = await api.get('/api/admin/semesters/current');
      if (res.data.success && res.data.data) {
        setCurrentSemester(res.data.data);
      } else {
        // If no current semester set, fetch the latest semester
        const allSemestersRes = await api.get('/api/admin/semesters');
        if (allSemestersRes.data.success && allSemestersRes.data.data.length > 0) {
          // Get the most recent semester by start date
          const latest = allSemestersRes.data.data.sort((a, b) => 
            new Date(b.start_date) - new Date(a.start_date)
          )[0];
          setCurrentSemester(latest);
        }
      }
    } catch (err) {
      console.error('Failed to fetch current semester:', err);
    } finally {
      setSemesterLoading(false);
    }
  };

  // Format semester display text
  const getSemesterDisplay = () => {
    if (semesterLoading) return 'Loading...';
    if (!currentSemester) return 'Not Set';
    return `${currentSemester.term} ${currentSemester.academic_year}`;
  };

  const getAcademicYearDisplay = () => {
    if (semesterLoading) return 'Loading...';
    if (!currentSemester) return 'Not Set';
    return currentSemester.academic_year;
  };

  const statCards = [
    {
      title: 'Total Collected',
      value: stats.totalPaid !== null ? `$${Number(stats.totalPaid).toLocaleString()}` : null,
      icon: <CheckCircleOutlined />,
      color: '#2f855a', bg: '#F0FFF4',
      desc: 'Payments received',
    },
    {
      title: 'Pending Payments',
      value: stats.totalPending !== null ? `$${Number(stats.totalPending).toLocaleString()}` : null,
      icon: <ClockCircleOutlined />,
      color: '#c53030', bg: '#FFF5F5',
      desc: 'Outstanding amount',
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions,
      icon: <FileTextOutlined />,
      color: '#2b6cb0', bg: '#EFF6FF',
      desc: 'All time records',
    },
    {
      title: 'Current Semester',
      value: getSemesterDisplay(),
      icon: <CalendarOutlined />,
      color: '#d97706', bg: '#FFFBEB',
      desc: semesterLoading ? 'Loading...' : (currentSemester?.is_current ? 'Active semester' : 'Latest semester'),
    },
  ];

  const quickActions = [
    { label: 'Add Payment', icon: <BankOutlined />, color: '#2b6cb0', bg: '#EFF6FF', path: '/finance/add-payment', desc: 'Assign payment to a major' },
    { label: 'Mark Payment Paid', icon: <CheckCircleOutlined />, color: '#2f855a', bg: '#F0FFF4', path: '/finance/mark-payment', desc: 'Record a student payment' },
    { label: 'Student Summary', icon: <SearchOutlined />, color: '#d97706', bg: '#FFFBEB', path: '/finance/student-summary', desc: 'View student financial records' },
    { label: 'Payment Reports', icon: <FileTextOutlined />, color: '#6b46c1', bg: '#FAF5FF', path: '/finance/payment-report', desc: 'View financial reports' },
  ];

  const systemInfo = [
    { label: 'Officer Name', value: user.name, icon: <UserOutlined /> },
    { label: 'Officer ID', value: user.id, icon: <IdcardOutlined /> },
    { label: 'Role', value: 'Finance Officer', icon: <DollarOutlined /> },
    { label: 'Portal', value: 'Web Finance Portal', icon: <GlobalOutlined /> },
    { label: 'Academic Year', value: getAcademicYearDisplay(), icon: <CalendarOutlined /> },
    { label: 'Semester', value: getSemesterDisplay(), icon: <CalendarOutlined /> },
  ];

  const transactionColumns = [
    {
      title: 'Student ID',
      dataIndex: 'student_id',
      key: 'student_id',
      render: v => <Tag color="blue">{v}</Tag>
    },
    {
      title: 'Student Name',
      dataIndex: 'student_name',
      key: 'student_name',
      render: v => <Text strong>{v}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: v => `$${Number(v).toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => (
        <Tag color={v === 'paid' ? 'green' : 'red'}>
          {v === 'paid' ? 'Paid' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: v => v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
    },
  ];

  return (
    <FinanceLayout title="Dashboard">

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #276749 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 8px 32px rgba(26,54,93,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
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
            Antonine University — Finance Portal · {getSemesterDisplay()}
          </Text>
        </div>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative', zIndex: 1,
        }}>
          <DollarOutlined style={{ color: '#fff', fontSize: 28 }} />
        </div>
      </div>

      {error && (
        <Alert message={error} type="warning" showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
        />
      )}

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>
                    {card.title}
                  </Text>
                  <div style={{
                    fontSize: 28, fontWeight: 800, color: '#1E293B',
                    lineHeight: 1.1, margin: '6px 0 4px',
                  }}>
                    {card.value === null && card.title !== 'Current Semester'
                      ? <Spin size="small" />
                      : card.value
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
            <Col xs={24} sm={12} md={6} key={i}>
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
                  margin: '0 auto 10px', fontSize: 20, color: action.color,
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

        {/* Recent Transactions */}
        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ color: '#1a365d', fontWeight: 700, fontSize: 15 }}>Recent Transactions</span>}
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <Table
              dataSource={recentTransactions}
              columns={transactionColumns}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: 'No transactions yet' }}
            />
          </Card>
        </Col>

        {/* System Information */}
        <Col xs={24} lg={8}>
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
                    backgroundColor: '#F0FFF4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#276749', fontSize: 14,
                  }}>
                    {item.icon}
                  </div>
                  <Text style={{ color: '#64748B', fontSize: 13 }}>{item.label}</Text>
                </div>
                <Text style={{ fontWeight: 600, color: '#1E293B', fontSize: 13 }}>
                  {semesterLoading && (item.label === 'Academic Year' || item.label === 'Semester') 
                    ? <Spin size="small" /> 
                    : item.value}
                </Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

    </FinanceLayout>
  );
}