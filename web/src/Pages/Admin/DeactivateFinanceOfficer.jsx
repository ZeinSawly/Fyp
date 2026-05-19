import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Alert, Typography,
  Modal, Divider, Row, Col, Tag, Steps
} from 'antd';
import {
  IdcardOutlined, ArrowLeftOutlined, StopOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  SearchOutlined, UserOutlined, MailOutlined,
  PhoneOutlined, EnvironmentOutlined,
  CalendarOutlined, InfoCircleOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function DeactivateFinanceOfficer() {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm();
  const [reasonForm] = Form.useForm();

  const [step, setStep] = useState(0);
  const [searching, setSearching] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [officer, setOfficer] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async (values) => {
    setSearching(true);
    setError('');
    setOfficer(null);
    try {
      const res = await api.get(`/api/admin/lookup-finance-officer/${values.id.trim()}`);
      setOfficer(res.data.data);
      setStep(1);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No finance officer found with ID ${values.id}. Please check the ID and try again.`);
      } else {
        setError('Failed to search. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    if (officer?.status === 'inactive') {
      setError('This finance officer account is already deactivated.');
      return;
    }
    setStep(2);
  };

  const handleDeactivate = async (values) => {
    Modal.confirm({
      title: 'Final Confirmation',
      icon: <ExclamationCircleOutlined style={{ color: '#d97706' }} />,
      content: (
        <div>
          <p>You are about to deactivate the account of:</p>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#1a365d' }}>{officer.name}</p>
          <p style={{ color: '#64748B', fontSize: 13 }}>ID: {officer.id}</p>
          <p style={{ color: '#d97706', fontSize: 13, marginTop: 8 }}>
            The finance officer will no longer be able to log in.
          </p>
        </div>
      ),
      okText: 'Yes, Deactivate',
      okButtonProps: {
        style: { borderRadius: 8, backgroundColor: '#d97706', borderColor: '#d97706' },
      },
      cancelText: 'Cancel',
      cancelButtonProps: { style: { borderRadius: 8 } },
      onOk: async () => {
        setDeactivating(true);
        setError('');
        try {
          await api.post('/api/admin/deactivate-finance-officer', {
            id: officer.id,
            reason: values.reason,
          });
          setSuccess(`Finance Officer "${officer.name}" (ID: ${officer.id}) has been deactivated successfully.`);
          setStep(3);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to deactivate finance officer.');
        } finally {
          setDeactivating(false);
        }
      },
    });
  };

  const handleReset = () => {
    setStep(0);
    setOfficer(null);
    setError('');
    setSuccess('');
    searchForm.resetFields();
    reasonForm.resetFields();
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <AdminLayout title="Deactivate Finance Officer">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Back */}
        <div style={{ marginBottom: 24 }}>
          <Button type="text" icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin')} style={{ color: '#64748B' }}>
            Back to Dashboard
          </Button>
        </div>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <StopOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Deactivate Finance Officer Account
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              Disable a finance officer account without deleting any data
            </div>
          </div>
        </div>

        {/* Steps */}
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <Steps
            current={step === 3 ? 2 : step}
            size="small"
            items={[
              { title: 'Search Officer', icon: <SearchOutlined /> },
              { title: 'Verify Details', icon: <UserOutlined /> },
              { title: 'Deactivate', icon: <StopOutlined /> },
            ]}
          />
        </Card>

        {/* Alerts */}
        {error && (
          <Alert message={error} type="error" showIcon closable
            onClose={() => setError('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}
        {success && (
          <Alert message={success} type="success" showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {/* STEP 0: Search */}
        {step === 0 && (
          <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Title level={5} style={{ color: '#1a365d', marginBottom: 6 }}>
              Step 1 — Search for Finance Officer
            </Title>
            <Text style={{ color: '#64748B', fontSize: 13, display: 'block', marginBottom: 20 }}>
              Enter the finance officer ID to look up their account before deactivating.
            </Text>

            <Form form={searchForm} layout="vertical" onFinish={handleSearch} requiredMark={false}>
              <Form.Item
                name="id"
                label={<Text style={{ fontWeight: 600, color: '#374151' }}>Employee ID</Text>}
                rules={[
                  { required: true, message: 'Please enter the employee ID' },
                  { pattern: /^\d+$/, message: 'ID must contain numbers only' },
                ]}
              >
                <Input
                  prefix={<IdcardOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="Enter finance officer ID"
                  size="large" style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Button
                type="primary" htmlType="submit" size="large"
                loading={searching} icon={<SearchOutlined />}
                style={{
                  borderRadius: 10, width: '100%',
                  background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                  border: 'none',
                }}
              >
                {searching ? 'Searching...' : 'Search Finance Officer'}
              </Button>
            </Form>
          </Card>
        )}

        {/* STEP 1: Verify */}
        {step === 1 && officer && (
          <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <Title level={5} style={{ color: '#1a365d', margin: 0 }}>
                  Step 2 — Verify Finance Officer Details
                </Title>
                <Text style={{ color: '#64748B', fontSize: 13 }}>
                  Make sure this is the correct finance officer before proceeding.
                </Text>
              </div>
              <Tag
                color={officer.status === 'active' ? 'green' : 'red'}
                style={{ borderRadius: 20, fontWeight: 700, fontSize: 12 }}
              >
                {officer.status === 'active' ? 'Active' : 'Already Inactive'}
              </Tag>
            </div>

            {/* Officer info grid */}
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <Row gutter={[16, 16]}>
                {[
                  { label: 'Full Name', value: officer.name, icon: <UserOutlined />, color: '#2b6cb0' },
                  { label: 'Employee ID', value: officer.id, icon: <IdcardOutlined />, color: '#2b6cb0' },
                  { label: 'Email', value: officer.email || '—', icon: <MailOutlined />, color: '#2f855a' },
                  { label: 'Phone', value: officer.phone || '—', icon: <PhoneOutlined />, color: '#2f855a' },
                  { label: 'Office Location', value: officer.office_location || '—', icon: <EnvironmentOutlined />, color: '#d97706' },
                  { label: 'Date of Birth', value: formatDate(officer.dob), icon: <CalendarOutlined />, color: '#6b46c1' },
                ].map((item, i) => (
                  <Col xs={24} sm={12} key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        backgroundColor: item.color + '15',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: item.color, fontSize: 15, flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                          {item.value}
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>

            {officer.status === 'inactive' && (
              <Alert message="This account is already deactivated" type="warning" showIcon
                style={{ marginBottom: 16, borderRadius: 10 }} />
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button size="large" onClick={handleReset} style={{ borderRadius: 10 }}>
                Search Again
              </Button>
              <Button
                type="primary" size="large" onClick={handleConfirm}
                disabled={officer.status === 'inactive'}
                icon={<StopOutlined />}
                style={{ borderRadius: 10, minWidth: 200, backgroundColor: '#d97706', borderColor: '#d97706' }}
              >
                Proceed to Deactivate
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: Reason */}
        {step === 2 && officer && (
          <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <Title level={5} style={{ color: '#1a365d', marginBottom: 6 }}>
              Step 3 — Provide a Reason
            </Title>
            <Text style={{ color: '#64748B', fontSize: 13, display: 'block', marginBottom: 20 }}>
              Enter a reason for deactivating this account. This will be recorded for audit purposes.
            </Text>

            {/* Summary */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#FFF7ED', borderRadius: 12, padding: '14px 16px',
              border: '1px solid #FED7AA', marginBottom: 20,
            }}>
              <InfoCircleOutlined style={{ color: '#d97706', fontSize: 18 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>{officer.name}</div>
                <div style={{ color: '#64748B', fontSize: 12 }}>
                  ID: {officer.id} · {officer.office_location}
                </div>
              </div>
            </div>

            <Form form={reasonForm} layout="vertical" onFinish={handleDeactivate} requiredMark={false}>
              <Form.Item
                name="reason"
                label={<Text style={{ fontWeight: 600, color: '#374151' }}>Reason for Deactivation</Text>}
                rules={[
                  { required: true, message: 'Please enter a reason' },
                  { min: 10, message: 'Reason must be at least 10 characters' },
                ]}
              >
                <TextArea
                  placeholder="e.g. Contract ended, resignation, role change..."
                  rows={4}
                  style={{ borderRadius: 10, fontSize: 14 }}
                />
              </Form.Item>

              <Divider />

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button size="large" onClick={() => setStep(1)} style={{ borderRadius: 10 }}>
                  Back
                </Button>
                <Button
                  danger type="primary" htmlType="submit" size="large"
                  loading={deactivating} icon={<StopOutlined />}
                  style={{ borderRadius: 10, minWidth: 200 }}
                >
                  {deactivating ? 'Deactivating...' : 'Confirm Deactivation'}
                </Button>
              </div>
            </Form>
          </Card>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%', backgroundColor: '#F0FFF4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <CheckCircleOutlined style={{ color: '#2f855a', fontSize: 34 }} />
            </div>
            <Title level={4} style={{ color: '#1a365d', marginBottom: 8 }}>Account Deactivated</Title>
            <Text style={{ color: '#64748B', fontSize: 14, display: 'block', marginBottom: 24 }}>
              The finance officer account has been successfully deactivated.
            </Text>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button size="large" onClick={handleReset} style={{ borderRadius: 10 }}>
                Deactivate Another
              </Button>
              <Button type="primary" size="large" onClick={() => navigate('/admin')}
                style={{ borderRadius: 10, background: 'linear-gradient(135deg, #1a365d, #2b6cb0)', border: 'none' }}>
                Back to Dashboard
              </Button>
            </div>
          </Card>
        )}

      </div>
    </AdminLayout>
  );
}