import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Alert, Typography, Row, Col, Divider
} from 'antd';
import {
  UserAddOutlined, IdcardOutlined, LockOutlined,
  CalendarOutlined, ArrowLeftOutlined, CheckCircleOutlined,
  MailOutlined, PhoneOutlined, EnvironmentOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;

export default function AddFinanceOfficer() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/api/admin/add-finance-officer', {
        name: values.name,
        id: parseInt(values.id),
        password: values.password,
        dob: values.dob,
        email: values.email,
        phone: values.phone,
        office_location: values.office_location,
      });
      setSuccess(`Finance Officer "${values.name}" has been added successfully.`);
      form.resetFields();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add finance officer.';
      if (msg.includes('already exists')) {
        setError('A finance officer with this ID already exists.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add Finance Officer">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Back button */}
        <div style={{ marginBottom: 24 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin')}
            style={{ color: '#64748B' }}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Title card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <BankOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Add New Finance Officer
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Fill in the details below to register a new finance officer account
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert
            message={success} type="success" showIcon
            icon={<CheckCircleOutlined />} closable
            onClose={() => setSuccess('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}
        {error && (
          <Alert
            message={error} type="error" showIcon closable
            onClose={() => setError('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {/* Form card */}
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
          >

            {/* Section: Personal Info */}
            <Title level={5} style={{ color: '#1a365d', marginBottom: 16 }}>
              Personal Information
            </Title>

            {/* Full Name */}
            <Form.Item
              label={<Text style={{ fontWeight: 600, color: '#374151' }}>Full Name</Text>}
              name="name"
              rules={[{ required: true, message: 'Please enter the finance officer name' }]}
            >
              <Input
                prefix={<UserAddOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="Enter finance officer full name"
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            {/* ID + Password */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Employee ID</Text>}
                  name="id"
                  rules={[
                    { required: true, message: 'Please enter the employee ID' },
                    { pattern: /^\d+$/, message: 'ID must contain numbers only' },
                  ]}
                >
                  <Input
                    prefix={<IdcardOutlined style={{ color: '#9CA3AF' }} />}
                    placeholder="Numbers only"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Password</Text>}
                  name="password"
                  rules={[
                    { required: true, message: 'Please enter a password' },
                    { min: 6, message: 'Password must be at least 6 characters' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                    placeholder="Enter password"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Email + Phone */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Email</Text>}
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter the email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
                    placeholder="finance@ua.edu.lb"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Phone Number</Text>}
                  name="phone"
                  rules={[{ required: true, message: 'Please enter the phone number' }]}
                >
                  <Input
                    prefix={<PhoneOutlined style={{ color: '#9CA3AF' }} />}
                    placeholder="+961 XX XXX XXX"
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* DOB */}
            <Form.Item
              label={<Text style={{ fontWeight: 600, color: '#374151' }}>Date of Birth</Text>}
              name="dob"
              rules={[
                { required: true, message: 'Please enter date of birth' },
                { pattern: /^\d{4}-\d{2}-\d{2}$/, message: 'Format must be YYYY-MM-DD' },
              ]}
            >
              <Input
                prefix={<CalendarOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="YYYY-MM-DD"
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Divider />

            {/* Section: Employment Info */}
            <Title level={5} style={{ color: '#1a365d', marginBottom: 16 }}>
              Employment Information
            </Title>

            {/* Office Location */}
            <Form.Item
              label={<Text style={{ fontWeight: 600, color: '#374151' }}>Office Location</Text>}
              name="office_location"
              rules={[{ required: true, message: 'Please enter the office location' }]}
            >
              <Input
                prefix={<EnvironmentOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="e.g., Building A, Room 101"
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Divider />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                size="large"
                onClick={() => { form.resetFields(); setError(''); setSuccess(''); }}
                style={{ borderRadius: 10, minWidth: 100 }}
              >
                Clear
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<BankOutlined />}
                style={{
                  borderRadius: 10, minWidth: 180,
                  background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(43,108,176,0.3)',
                }}
              >
                {loading ? 'Adding...' : 'Add Finance Officer'}
              </Button>
            </div>

          </Form>
        </Card>

      </div>
    </AdminLayout>
  );
}