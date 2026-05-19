import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Select, Alert, Typography, Row, Col, Divider
} from 'antd';
import {
  UserAddOutlined, IdcardOutlined, LockOutlined,
  CalendarOutlined, BookOutlined, ArrowLeftOutlined,
  CheckCircleOutlined, MailOutlined, PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

const CAMPUSES = ['Hadat', 'Baabda', 'Zahle'];

export default function AddStudent() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [majorsLoading, setMajorsLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await api.get('/api/admin/majors');
        setMajors(res.data);
      } catch (err) {
        setError('Failed to load majors. Please refresh the page.');
      } finally {
        setMajorsLoading(false);
      }
    };
    fetchMajors();
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/api/admin/add-student', {
        name: values.name,
        id: values.id,
        password: values.password,
        dob: values.dob,
        email: values.email,
        phone: values.phone,
        enrollment_date: values.enrollment_date,
        major_id: values.major_id,
        campus: values.campus,
      });
      setSuccess(`Student "${values.name}" has been added successfully.`);
      form.resetFields();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add student.';
      if (msg.includes('already exists')) {
        setError('A student with this ID already exists.');
      } else if (msg.includes('Major does not exist')) {
        setError('The selected major does not exist.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add Student">
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
            <UserAddOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Add New Student
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Fill in the details below to register a new student account
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
              rules={[{ required: true, message: 'Please enter the student name' }]}
            >
              <Input
                prefix={<UserAddOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="Enter student full name"
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            {/* Student ID + Password */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Student ID</Text>}
                  name="id"
                  rules={[
                    { required: true, message: 'Please enter the student ID' },
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
                    placeholder="student@antonine.edu.lb"
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

            {/* Section: Academic Info */}
            <Title level={5} style={{ color: '#1a365d', marginBottom: 16 }}>
              Academic Information
            </Title>

            {/* Enrollment Date + Campus */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Enrollment Date</Text>}
                  name="enrollment_date"
                  rules={[
                    { required: true, message: 'Please enter enrollment date' },
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
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Campus</Text>}
                  name="campus"
                  rules={[{ required: true, message: 'Please select a campus' }]}
                >
                  <Select
                    placeholder="Select campus"
                    size="large"
                    style={{ borderRadius: 10 }}
                    suffixIcon={<EnvironmentOutlined style={{ color: '#9CA3AF' }} />}
                  >
                    {CAMPUSES.map(c => (
                      <Option key={c} value={c}>{c}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Major */}
            <Form.Item
              label={<Text style={{ fontWeight: 600, color: '#374151' }}>Major</Text>}
              name="major_id"
              rules={[{ required: true, message: 'Please select a major' }]}
            >
              <Select
                placeholder="Select a major"
                size="large"
                loading={majorsLoading}
                style={{ borderRadius: 10 }}
                suffixIcon={<BookOutlined style={{ color: '#9CA3AF' }} />}
              >
                {majors.map(m => (
                  <Option key={m.id} value={m.id}>{m.name}</Option>
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
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<UserAddOutlined />}
                style={{
                  borderRadius: 10, minWidth: 140,
                  background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(43,108,176,0.3)',
                }}
              >
                {loading ? 'Adding...' : 'Add Student'}
              </Button>
            </div>

          </Form>
        </Card>

      </div>
    </AdminLayout>
  );
}