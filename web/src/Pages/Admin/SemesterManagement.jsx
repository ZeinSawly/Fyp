import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, DatePicker,
  Alert, Typography, Space, Tag, Popconfirm, message, Switch,
  Row, Col, Divider
} from 'antd';
import {
  CalendarOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, StarOutlined, ArrowLeftOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SemesterManagement() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch semesters on load
  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/semesters');
      if (res.data.success) {
        setSemesters(res.data.data);
      }
    } catch (err) {
      setError('Failed to load semesters');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSemester(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingSemester(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      academic_year: record.academic_year,
      term: record.term,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
      enrollment_start_date: record.enrollment_start_date ? dayjs(record.enrollment_start_date) : null,
      enrollment_end_date: record.enrollment_end_date ? dayjs(record.enrollment_end_date) : null,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/semesters/${id}`);
      message.success('Semester deleted successfully');
      fetchSemesters();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete semester';
      if (msg.includes('sections')) {
        message.error('Cannot delete semester with existing course sections');
      } else {
        message.error(msg);
      }
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      await api.put(`/api/admin/semesters/${id}/set-current`);
      message.success('Current semester updated');
      fetchSemesters();
    } catch (err) {
      message.error('Failed to set current semester');
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError('');
    
    const data = {
      name: values.name,
      code: values.code,
      academic_year: values.academic_year,
      term: values.term,
      start_date: values.start_date.format('YYYY-MM-DD'),
      end_date: values.end_date.format('YYYY-MM-DD'),
      enrollment_start_date: values.enrollment_start_date?.format('YYYY-MM-DD') || null,
      enrollment_end_date: values.enrollment_end_date?.format('YYYY-MM-DD') || null,
      is_active: values.is_active !== undefined ? values.is_active : true,
    };

    try {
      if (editingSemester) {
        // Update existing semester
        await api.put(`/api/admin/semesters/${editingSemester.id}`, data);
        message.success('Semester updated successfully');
      } else {
        // Create new semester
        await api.post('/api/admin/semesters', data);
        message.success('Semester created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchSemesters();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save semester';
      if (msg.includes('already exists')) {
        setError('Semester code already exists');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Semester Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <CalendarOutlined style={{ color: '#2b6cb0' }} />
          <Text strong>{text}</Text>
          {record.is_current && (
            <Tag color="green" icon={<StarOutlined />}>Current</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Academic Year',
      dataIndex: 'academic_year',
      key: 'academic_year',
    },
    {
      title: 'Term',
      dataIndex: 'term',
      key: 'term',
      render: (term) => (
        <Tag color={term === 'Fall' ? 'orange' : term === 'Spring' ? 'green' : 'purple'}>
          {term}
        </Tag>
      ),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Enrollment Period',
      key: 'enrollment_period',
      render: (_, record) => {
        if (!record.enrollment_start_date && !record.enrollment_end_date) {
          return <Text type="secondary">Not set</Text>;
        }
        const start = record.enrollment_start_date ? dayjs(record.enrollment_start_date).format('MMM D') : 'Any';
        const end = record.enrollment_end_date ? dayjs(record.enrollment_end_date).format('MMM D, YYYY') : 'Any';
        return <Text>{start} → {end}</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'default'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {!record.is_current && (
            <Button
              size="small"
              icon={<StarOutlined />}
              onClick={() => handleSetCurrent(record.id)}
              style={{ color: '#d97706' }}
            >
              Set Current
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Semester"
            description={`Are you sure you want to delete "${record.name}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            disabled={record.is_current}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.is_current}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout title="Semester Management">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

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

        {/* Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <CalendarOutlined style={{ color: '#fff', fontSize: 24 }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
                Academic Semesters
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                Manage academic terms, enrollment periods, and current semester
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
            style={{
              borderRadius: 10,
              background: '#fff',
              color: '#1a365d',
              border: 'none',
              fontWeight: 600,
            }}
          >
            Add Semester
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {/* Info Alert about Current Semester */}
        <Alert
          message="Only one semester can be marked as 'Current' at a time"
          description="Students can only enroll in the semester marked as 'Current'. The current semester appears with a green 'Current' tag."
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
        />

        {/* Semesters Table */}
        <Card
          title={
            <span style={{ color: '#1a365d', fontWeight: 700 }}>
              All Semesters
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8, fontWeight: 'normal' }}>
                ({semesters.length} total)
              </Text>
            </span>
          }
          style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <Table
            dataSource={semesters}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No semesters created yet. Click "Add Semester" to create one.' }}
          />
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          title={
            <Space>
              {editingSemester ? <EditOutlined /> : <PlusOutlined />}
              <span>{editingSemester ? 'Edit Semester' : 'Add New Semester'}</span>
            </Space>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setError('');
            form.resetFields();
          }}
          footer={null}
          width={600}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
          >
            {/* Semester Name */}
            <Form.Item
              name="name"
              label="Semester Name"
              rules={[{ required: true, message: 'Please enter semester name' }]}
            >
              <Input
                placeholder="e.g., Fall 2024"
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                {/* Semester Code */}
                <Form.Item
                  name="code"
                  label="Semester Code"
                  rules={[
                    { required: true, message: 'Please enter semester code' },
                    { pattern: /^[A-Z0-9]+$/, message: 'Use uppercase letters and numbers only' },
                  ]}
                  tooltip="Unique identifier, e.g., F2024"
                >
                  <Input
                    placeholder="e.g., F2024"
                    size="large"
                    style={{ borderRadius: 10 }}
                    disabled={!!editingSemester}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                {/* Term */}
                <Form.Item
                  name="term"
                  label="Term"
                  rules={[{ required: true, message: 'Please select term' }]}
                >
                  <Select size="large" style={{ borderRadius: 10 }} placeholder="Select term">
                    <Option value="Fall">Fall</Option>
                    <Option value="Spring">Spring</Option>
                    <Option value="Summer">Summer</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Academic Year */}
            <Form.Item
              name="academic_year"
              label="Academic Year"
              rules={[
                { required: true, message: 'Please enter academic year' },
                { pattern: /^\d{4}-\d{4}$/, message: 'Format: YYYY-YYYY (e.g., 2024-2025)' },
              ]}
              tooltip="Format: 2024-2025"
            >
              <Input
                placeholder="e.g., 2024-2025"
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                {/* Start Date */}
                <Form.Item
                  name="start_date"
                  label="Start Date"
                  rules={[{ required: true, message: 'Please select start date' }]}
                >
                  <DatePicker
                    style={{ width: '100%', borderRadius: 10 }}
                    size="large"
                    placeholder="Select start date"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                {/* End Date */}
                <Form.Item
                  name="end_date"
                  label="End Date"
                  rules={[{ required: true, message: 'Please select end date' }]}
                >
                  <DatePicker
                    style={{ width: '100%', borderRadius: 10 }}
                    size="large"
                    placeholder="Select end date"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left" style={{ margin: '8px 0' }}>
              Enrollment Period (Optional)
            </Divider>

            <Row gutter={16}>
              <Col span={12}>
                {/* Enrollment Start Date */}
                <Form.Item
                  name="enrollment_start_date"
                  label="Enrollment Start"
                  tooltip="When students can start enrolling"
                >
                  <DatePicker
                    style={{ width: '100%', borderRadius: 10 }}
                    size="large"
                    placeholder="Optional"
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                {/* Enrollment End Date */}
                <Form.Item
                  name="enrollment_end_date"
                  label="Enrollment End"
                  tooltip="Deadline for enrollment (late registration may have fees)"
                >
                  <DatePicker
                    style={{ width: '100%', borderRadius: 10 }}
                    size="large"
                    placeholder="Optional"
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Active Status */}
            <Form.Item
              name="is_active"
              label="Active Status"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Item>

            <Divider />

            {/* Form Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                size="large"
                onClick={() => {
                  setModalVisible(false);
                  setError('');
                  form.resetFields();
                }}
                style={{ borderRadius: 10 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={submitting}
                style={{
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                  border: 'none',
                }}
              >
                {editingSemester ? 'Update Semester' : 'Create Semester'}
              </Button>
            </div>

            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginTop: 16, borderRadius: 10 }}
              />
            )}
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}