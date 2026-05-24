import React, { useState, useEffect } from 'react';
import {
  Card, Select, Table, Tag, Button, Typography, Row, Col,
  Modal, Form, Input, InputNumber, message, Alert, Popconfirm,
  Spin, Empty, Statistic, Progress,
} from 'antd';
import {
  BookOutlined, PlusOutlined, DeleteOutlined,
  CheckCircleOutlined, WarningOutlined, ArrowLeftOutlined,
  PieChartOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;

export default function GradeComponents() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [components, setComponents] = useState([]);
  const [componentsLoading, setComponentsLoading] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await api.get('/api/admin/courses-for-dropdown');
      if (res.data.success) {
        setCourses(res.data.data || []);
      }
    } catch (err) {
      message.error('Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchComponents = async (courseId) => {
    if (!courseId) {
      setComponents([]);
      return;
    }
    setComponentsLoading(true);
    try {
      const res = await api.get(`/api/admin/grade-component/${encodeURIComponent(courseId)}`);
      if (res.data.success) {
        setComponents(res.data.data || []);
      }
    } catch (err) {
      message.error('Failed to load components');
    } finally {
      setComponentsLoading(false);
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    fetchComponents(courseId);
  };

  const openAddModal = () => {
    addForm.resetFields();
    addForm.setFieldsValue({ max_grade: 100 });
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    addForm.resetFields();
  };

  const handleAddComponent = async () => {
    try {
      const values = await addForm.validateFields();
      setAdding(true);

      const res = await api.post('/api/admin/grade-component', {
        course_id: selectedCourse,
        name: values.name,
        max_grade: values.max_grade,
        weight: values.weight,
      });

      message.success(res.data.message || 'Component added');
      closeAddModal();
      fetchComponents(selectedCourse);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Failed to add component');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteComponent = async (componentId) => {
    try {
      await api.delete(`/api/admin/grade-component/${componentId}`);
      message.success('Component deleted');
      fetchComponents(selectedCourse);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // ─── Calculations ───
  const totalWeight = components.reduce((sum, c) => sum + Number(c.weight), 0);
  const remainingWeight = Math.max(0, 100 - totalWeight);
  const isComplete = Math.abs(totalWeight - 100) < 0.01;
  const isOverweight = totalWeight > 100;

  // ─── Table ───
  const columns = [
    {
      title: 'Component',
      dataIndex: 'name',
      key: 'name',
      render: (v) => <Text strong style={{ color: '#1a365d' }}>{v}</Text>,
    },
    {
      title: 'Max Grade',
      dataIndex: 'max_grade',
      key: 'max_grade',
      align: 'center',
      width: 120,
      render: (v) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      align: 'center',
      width: 200,
      render: (v) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={Number(v)}
              size="small"
              showInfo={false}
              strokeColor="#276749"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Text strong style={{ minWidth: 50, textAlign: 'right' }}>
              {Number(v).toFixed(1)}%
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 100,
      render: (_, row) => (
        <Popconfirm
          title="Delete this component?"
          description="If students already have grades for this, they'll be lost."
          onConfirm={() => handleDeleteComponent(row.id)}
          okText="Yes, delete"
          cancelText="Cancel"
        >
          <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <AdminLayout title="Grade Components">
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

        {/* Header */}
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
            <PieChartOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Grade Components
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Define how each course is graded (e.g., Midterm 30%, Final 40%, Assignments 30%)
            </div>
          </div>
        </div>

        {/* Course selector */}
        <Card
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
        >
          <Row gutter={16} align="middle">
            <Col xs={24} md={18}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Course</Text>
              <Select
                size="large"
                style={{ width: '100%' }}
                placeholder="Choose a course to manage its grade components..."
                value={selectedCourse}
                onChange={handleCourseChange}
                loading={coursesLoading}
                showSearch
                optionFilterProp="label"
                options={courses.map((c) => ({
                  value: c.id,
                  label: `${c.id} — ${c.name}`,
                }))}
              />
            </Col>
            <Col xs={24} md={6} style={{ marginTop: 24 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => selectedCourse && fetchComponents(selectedCourse)}
                disabled={!selectedCourse}
                style={{ width: '100%' }}
                size="large"
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </Card>

        {/* No course selected */}
        {!selectedCourse && (
          <Card style={{ borderRadius: 14, border: 'none', textAlign: 'center', padding: 40 }}>
            <BookOutlined style={{ fontSize: 48, color: '#CBD5E0', marginBottom: 12 }} />
            <div style={{ color: '#94A3B8', fontSize: 14 }}>
              Select a course to view or define its grade components
            </div>
          </Card>
        )}

        {/* Course selected: show stats + table */}
        {selectedCourse && (
          <>
            {/* Stats row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <Statistic
                    title="Components"
                    value={components.length}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: '#1a365d' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <Statistic
                    title="Total Weight"
                    value={totalWeight.toFixed(1)}
                    suffix="%"
                    valueStyle={{ 
                      color: isComplete ? '#276749' : isOverweight ? '#c53030' : '#d97706' 
                    }}
                    prefix={isComplete ? <CheckCircleOutlined /> : <WarningOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <Statistic
                    title="Remaining"
                    value={remainingWeight.toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: remainingWeight === 0 ? '#276749' : '#d97706' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Status banner */}
            {!isComplete && (
              <Alert
                message={isOverweight ? 'Total weight exceeds 100%' : `Total weight is ${totalWeight.toFixed(1)}% — must equal 100% before grade finalization is possible`}
                description={isOverweight 
                  ? 'Delete or adjust components so they total exactly 100%.'
                  : `Add ${remainingWeight.toFixed(1)}% more to complete the breakdown.`}
                type={isOverweight ? 'error' : 'warning'}
                showIcon
                style={{ marginBottom: 16, borderRadius: 10 }}
              />
            )}

            {isComplete && (
              <Alert
                message="Grade breakdown is complete (100%)"
                description="This course is ready for grade finalization at the end of the semester."
                type="success"
                showIcon
                style={{ marginBottom: 16, borderRadius: 10 }}
              />
            )}

            {/* Components table */}
            <Card
              title={
                <Row justify="space-between" align="middle">
                  <Col>
                    <span style={{ color: '#1a365d', fontWeight: 700 }}>Components</span>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={openAddModal}
                      disabled={isComplete}
                      style={{
                        borderRadius: 10,
                        background: isComplete ? undefined : 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                        border: 'none',
                      }}
                    >
                      Add Component
                    </Button>
                  </Col>
                </Row>
              }
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <Table
                dataSource={components}
                columns={columns}
                rowKey="id"
                loading={componentsLoading}
                pagination={false}
                size="middle"
                locale={{
                  emptyText: (
                    <div style={{ padding: 20 }}>
                      <Text type="secondary">
                        No components defined yet. Click "Add Component" to start.
                      </Text>
                    </div>
                  ),
                }}
              />
            </Card>

            {/* Help info */}
            <Card style={{ borderRadius: 14, border: 'none', marginTop: 16, background: '#F0F9FF' }}>
              <Text strong style={{ color: '#1a365d', display: 'block', marginBottom: 8 }}>
                💡 How grade components work
              </Text>
              <Text style={{ color: '#475569', fontSize: 13 }}>
                Each component represents an assessment (Midterm, Final, Project, etc). The <strong>Max Grade</strong> is what students are scored out of (typically 100), and the <strong>Weight</strong> is how much it contributes to the final grade. All components must sum to <strong>100%</strong> for grade finalization to work. Once at 100%, the instructor can enter grades and finalize the section at semester end.
              </Text>
            </Card>
          </>
        )}
      </div>

      {/* ADD COMPONENT MODAL */}
      <Modal
        title={
          <span style={{ color: '#1a365d', fontWeight: 700 }}>
            <PlusOutlined style={{ marginRight: 8 }} />
            Add Grade Component
          </span>
        }
        open={addModalOpen}
        onCancel={closeAddModal}
        onOk={handleAddComponent}
        okText="Add Component"
        okButtonProps={{ loading: adding }}
        width={460}
        destroyOnClose
      >
        <div style={{
          background: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 16,
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Adding to: <Text strong>{selectedCourse}</Text>
          </Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Current total: <Text strong>{totalWeight.toFixed(1)}%</Text> · Remaining: <Text strong style={{ color: '#276749' }}>{remainingWeight.toFixed(1)}%</Text>
            </Text>
          </div>
        </div>

        <Form form={addForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="Component Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input
              size="large"
              placeholder="e.g., Midterm Exam, Final Project, Quiz 1"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="max_grade"
                label="Max Grade"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'number', min: 1, message: 'Must be positive' },
                ]}
                extra="What the student is scored out of"
              >
                <InputNumber
                  size="large"
                  min={1}
                  max={1000}
                  step={1}
                  style={{ width: '100%', borderRadius: 8 }}
                  placeholder="100"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="weight"
                label="Weight (%)"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'number', min: 0.1, max: 100, message: '0.1 – 100' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (Number(value) > remainingWeight + 0.01) {
                        return Promise.reject(
                          `Would exceed 100% (only ${remainingWeight.toFixed(1)}% available)`
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                extra={`Max ${remainingWeight.toFixed(1)}% available`}
              >
                <InputNumber
                  size="large"
                  min={0.1}
                  max={remainingWeight}
                  step={0.5}
                  style={{ width: '100%', borderRadius: 8 }}
                  placeholder="30"
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </AdminLayout>
  );
}