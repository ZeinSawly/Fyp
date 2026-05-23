import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Select, Alert, Typography,
  Row, Col, Divider, Tag, Spin, Descriptions, Space, Tooltip,
} from 'antd';
import {
  BookOutlined, ArrowLeftOutlined, SaveOutlined,
  IdcardOutlined, LockOutlined, InfoCircleOutlined,
  TeamOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function EditCourse() {
  const { course_id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Prerequisites state
  const [availablePrereqs, setAvailablePrereqs] = useState([]);
  const [prereqsLoading, setPrereqsLoading] = useState(false);

  // Load course on mount
  useEffect(() => {
    fetchCourse();
  }, [course_id]);

  const fetchCourse = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/admin/courses/${course_id}`);
      if (res.data.success) {
        const c = res.data.data;
        setCourse(c);

        // Pre-fill the form
        form.setFieldsValue({
          name: c.name,
          description: c.description,
          prerequisite_ids: (c.prerequisites || []).map(p => p.id),
        });

        // Now load the available prereqs for this course's major
        fetchAvailablePrereqs(c.major_id, c.id);
      } else {
        setError(res.data.message || 'Failed to load course');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePrereqs = async (majorId, currentCourseId) => {
    setPrereqsLoading(true);
    try {
      const res = await api.get(
        `/api/admin/courses/prerequisites/available?major_id=${majorId}&exclude_course_id=${currentCourseId}`
      );
      if (res.data.success) {
        setAvailablePrereqs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load prereqs:', err);
    } finally {
      setPrereqsLoading(false);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put(`/api/admin/courses/${course_id}`, {
        name: values.name,
        description: values.description,
        prerequisite_ids: values.prerequisite_ids || [],
      });

      if (res.data.success) {
        setSuccess('Course updated successfully.');
        // Refetch to reflect new state
        fetchCourse();
      } else {
        setError(res.data.message || 'Failed to update course');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Course">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      </AdminLayout>
    );
  }

  if (error && !course) {
    return (
      <AdminLayout title="Edit Course">
        <Card style={{ borderRadius: 14, border: 'none' }}>
          <Alert
            message="Course not found"
            description={error}
            type="error"
            showIcon
            action={
              <Button onClick={() => navigate('/admin/course-management')}>
                Back to Courses
              </Button>
            }
          />
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Course">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Back button */}
        <div style={{ marginBottom: 24 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/course-management')}
            style={{ color: '#64748B' }}
          >
            Back to Course Management
          </Button>
        </div>

        {/* Title card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <BookOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              Editing Course
            </div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              {course?.name}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>
              <Tag color="blue">{course?.id}</Tag>
              {course?.major_name && (
                <Tag color="green">{course.major_name}</Tag>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert
            message={success}
            type="success"
            showIcon
            closable
            onClose={() => setSuccess('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}
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

        <Row gutter={[20, 20]}>
          {/* Locked / read-only details */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <span style={{ color: '#1a365d', fontWeight: 700 }}>
                  <LockOutlined style={{ marginRight: 8 }} />
                  Course Identity
                </span>
              }
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              extra={
                <Tooltip title="These fields cannot be edited after creation to preserve data integrity">
                  <InfoCircleOutlined style={{ color: '#94A3B8' }} />
                </Tooltip>
              }
            >
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Course ID">
                  <Tag color="blue">{course?.id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Credits">
                  <Tag color="purple">{course?.credits}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color={course?.type === 'major' ? 'geekblue' : 'purple'}>
                    {course?.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Major">
                  {course?.major_name || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {course?.department_name || '—'}
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '12px 0' }} />

              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
                USAGE
              </Text>
              <div style={{ marginTop: 8 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#64748B' }}>
                      <TeamOutlined style={{ marginRight: 6 }} />
                      Sections
                    </Text>
                    <Tag color={course?.stats?.section_count > 0 ? 'blue' : 'default'}>
                      {course?.stats?.section_count || 0}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#64748B' }}>
                      <ApartmentOutlined style={{ marginRight: 6 }} />
                      Enrollments
                    </Text>
                    <Tag color={course?.stats?.enrollment_count > 0 ? 'orange' : 'default'}>
                      {course?.stats?.enrollment_count || 0}
                    </Tag>
                  </div>
                </Space>
              </div>
            </Card>
          </Col>

          {/* Editable form */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <span style={{ color: '#1a365d', fontWeight: 700 }}>
                  Editable Information
                </span>
              }
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                requiredMark={false}
              >
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Course Name</Text>}
                  name="name"
                  rules={[{ required: true, message: 'Please enter course name' }]}
                >
                  <Input
                    prefix={<BookOutlined style={{ color: '#9CA3AF' }} />}
                    size="large"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>

                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Description</Text>}
                  name="description"
                >
                  <TextArea
                    rows={4}
                    placeholder="Course description"
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      Prerequisites
                      <Text type="secondary" style={{ fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                        (from {course?.major_name})
                      </Text>
                    </span>
                  }
                  name="prerequisite_ids"
                  extra={
                    availablePrereqs.length === 0
                      ? 'No other courses in this major to use as prerequisites'
                      : 'Select courses that must be completed before this course'
                  }
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Select prerequisite courses"
                    disabled={availablePrereqs.length === 0}
                    loading={prereqsLoading}
                    showSearch
                    optionFilterProp="label"
                    maxTagCount="responsive"
                    style={{ borderRadius: 10 }}
                    options={availablePrereqs.map(c => ({
                      label: `${c.id} — ${c.name}`,
                      value: c.id,
                    }))}
                  />
                </Form.Item>

                <Divider />

                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    size="large"
                    onClick={() => navigate('/admin/course-management')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={saving}
                    icon={<SaveOutlined />}
                    style={{
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                      border: 'none',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Space>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}