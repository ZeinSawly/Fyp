import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Select, Alert, Typography, Row, Col, Divider
} from 'antd';
import {
  UserAddOutlined, IdcardOutlined, LockOutlined,
  CalendarOutlined, ArrowLeftOutlined, CheckCircleOutlined,
  MailOutlined, PhoneOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AddInstructor() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/api/admin/departments');
        setDepartments(res.data);
      } catch (err) {
        setError('Failed to load departments. Please refresh the page.');
      } finally {
        setDeptsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/api/admin/add-instructor', {
        id: parseInt(values.id),
        name: values.name,
        password: values.password,
        dob: values.dob,
        email: values.email,
        phone: values.phone,
        department: parseInt(values.department),
      });
      setSuccess(`Instructor "${values.name}" has been added successfully.`);
      form.resetFields();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add instructor.';
      if (msg.includes('already exists')) {
        setError('An instructor with this ID already exists.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add Instructor">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Back button */}
        <div style={{ marginBottom: 24 }}>
          <Button
            type="text" icon={<ArrowLeftOutlined />}
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
            <UserAddOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Add New Instructor
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Fill in the details below to register a new instructor account
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert message={success} type="success" showIcon
            icon={<CheckCircleOutlined />} closable
            onClose={() => setSuccess('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}
        {error && (
          <Alert message={error} type="error" showIcon closable
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

            {/* Personal Information */}
            <Title level={5} style={{ color: '#1a365d', marginBottom: 16 }}>
              Personal Information
            </Title>

            {/* Full Name */}
            <Form.Item
              label={<Text style={{ fontWeight: 600, color: '#374151' }}>Full Name</Text>}
              name="name"
              rules={[{ required: true, message: 'Please enter the instructor name' }]}
            >
              <Input
                prefix={<UserAddOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="Enter instructor full name"
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            {/* ID + Password */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Instructor ID</Text>}
                  name="id"
                  rules={[
                    { required: true, message: 'Please enter the instructor ID' },
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
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>University Email</Text>}
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter the email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
                    placeholder="instructor@ua.edu.lb"
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

            {/* Academic Information */}
            <Title level={5} style={{ color: '#1a365d', marginBottom: 16 }}>
              Academic Information
            </Title>

            {/* Department */}
            <Form.Item
              label={<Text style={{ fontWeight: 600, color: '#374151' }}>Department</Text>}
              name="department"
              rules={[{ required: true, message: 'Please select a department' }]}
            >
              <Select
                placeholder="Select a department"
                size="large"
                loading={deptsLoading}
                style={{ borderRadius: 10 }}
                suffixIcon={<ApartmentOutlined style={{ color: '#9CA3AF' }} />}
              >
                {departments.map(d => (
                  <Option key={d.id} value={d.id}>{d.name}</Option>
                ))}
              </Select>
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
                type="primary" htmlType="submit" size="large"
                loading={loading} icon={<UserAddOutlined />}
                style={{
                  borderRadius: 10, minWidth: 160,
                  background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(43,108,176,0.3)',
                }}
              >
                {loading ? 'Adding...' : 'Add Instructor'}
              </Button>
            </div>

          </Form>
        </Card>

      </div>
    </AdminLayout>
  );
}