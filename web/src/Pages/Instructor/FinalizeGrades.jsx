import React, { useState, useEffect } from 'react';
import {
  Card, Select, Button, Typography, Row, Col, Table, Tag,
  Modal, message, Alert, Spin, Empty, Statistic, Divider, Space,
} from 'antd';
import {
  TrophyOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, LockOutlined, SafetyCertificateOutlined,
  ArrowLeftOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import InstructorLayout from '../../Components/InstructorLayout';
import api from '../../config/api';

const { Title, Text, Paragraph } = Typography;

export default function FinalizeGrades() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const [selectedSection, setSelectedSection] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await api.get(`/api/instructor/${user.id}/courses`);
      if (res.data.success) {
        setCourses(res.data.data || []);
      }
    } catch (err) {
      message.error('Failed to load your courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSection(sectionId);
    setPreview(null);
    setResultData(null);
    if (sectionId) {
      fetchPreview(sectionId);
    }
  };

  const fetchPreview = async (sectionId) => {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const res = await api.get(`/api/instructor/grades/finalize/preview/${sectionId}`);
      if (res.data.success) {
        setPreview(res.data.data);
      } else {
        message.error(res.data.message || 'Failed to load preview');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const res = await api.post(`/api/instructor/grades/finalize/${selectedSection}`);

      if (res.data.success) {
        message.success({
          content: `Grades finalized for ${res.data.data.students_finalized} student(s)`,
          duration: 4,
        });
        setResultData(res.data.data);
        setConfirmModalOpen(false);
        // Refresh the preview to show the section is now locked
        fetchPreview(selectedSection);
      } else {
        message.error(res.data.message || 'Finalization failed');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Finalization failed');
    } finally {
      setFinalizing(false);
    }
  };

  // ────────── helpers ──────────

  const getLetterColor = (letter) => {
    if (!letter) return 'default';
    if (letter.startsWith('A')) return 'green';
    if (letter.startsWith('B')) return 'blue';
    if (letter.startsWith('C')) return 'orange';
    if (letter.startsWith('D')) return 'volcano';
    return 'red'; // F
  };

  const formatPercent = (v) =>
    v === null || v === undefined ? '—' : `${Number(v).toFixed(2)}%`;

  // ────────── table columns ──────────

  const studentColumns = [
    {
      title: 'Student',
      key: 'student',
      render: (_, row) => (
        <div>
          <Text strong style={{ color: '#1a365d' }}>{row.student_name}</Text>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{row.student_id}</div>
        </div>
      ),
    },
    {
      title: 'Component Grades',
      key: 'components',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(row.component_grades || []).map((cg) => (
            <Tag
              key={cg.component_id}
              color={cg.grade !== null && cg.grade !== undefined ? 'blue' : 'red'}
              style={{ fontSize: 11 }}
            >
              {cg.component_name}: {cg.grade !== null && cg.grade !== undefined
                ? `${cg.grade}/${cg.max_grade}`
                : 'missing'}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Final',
      dataIndex: 'final_percent',
      key: 'final_percent',
      align: 'right',
      width: 100,
      render: (v) => (
        <Text strong style={{ fontSize: 14 }}>
          {formatPercent(v)}
        </Text>
      ),
    },
    {
      title: 'Letter',
      dataIndex: 'letter_grade',
      key: 'letter_grade',
      align: 'center',
      width: 90,
      render: (v) => v
        ? <Tag color={getLetterColor(v)} style={{ fontSize: 14, fontWeight: 700, padding: '2px 10px' }}>{v}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'GPA Points',
      dataIndex: 'grade_points',
      key: 'grade_points',
      align: 'center',
      width: 100,
      render: (v) => v !== null && v !== undefined
        ? <Text style={{ fontWeight: 600 }}>{Number(v).toFixed(2)}</Text>
        : '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 110,
      render: (v) => {
        if (v === 'passed') return <Tag color="green" icon={<CheckCircleOutlined />}>PASS</Tag>;
        if (v === 'failed') return <Tag color="red" icon={<CloseCircleOutlined />}>FAIL</Tag>;
        return <Tag color="warning" icon={<WarningOutlined />}>Missing</Tag>;
      },
    },
  ];

  const isLocked = preview?.section?.grades_finalized === 1;

  return (
    <InstructorLayout title="Finalize Grades">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #276749 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <TrophyOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Finalize Grades
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Convert component grades into official course completions
            </div>
          </div>
        </div>

        {/* Section selector */}
        <Card
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
        >
          <Row gutter={16} align="middle">
            <Col xs={24} md={18}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Select Section</Text>
              <Select
                size="large"
                style={{ width: '100%' }}
                placeholder="Choose a section to finalize..."
                value={selectedSection}
                onChange={handleSectionChange}
                loading={coursesLoading}
                showSearch
                optionFilterProp="label"
                options={courses.map((c) => ({
                  value: c.section_id,
                  label: `${c.course_name} — Section ${c.section_code}`,
                }))}
              />
            </Col>
            <Col xs={24} md={6} style={{ marginTop: 24 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => selectedSection && fetchPreview(selectedSection)}
                disabled={!selectedSection}
                style={{ width: '100%' }}
                size="large"
              >
                Refresh Preview
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Info banner */}
        {!preview && !previewLoading && (
          <Card style={{ borderRadius: 14, border: 'none', textAlign: 'center', padding: 40 }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: '#CBD5E0', marginBottom: 12 }} />
            <div style={{ color: '#94A3B8', fontSize: 14 }}>
              Select a section to preview finalization
            </div>
          </Card>
        )}

        {/* Loading */}
        {previewLoading && (
          <Card style={{ borderRadius: 14, border: 'none', textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#64748B' }}>
              Computing final grades...
            </div>
          </Card>
        )}

        {/* Preview results */}
        {preview && !previewLoading && (
          <>
            {/* Section info */}
            <Card
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
            >
              <Row gutter={[16, 8]}>
                <Col xs={24} sm={12} md={6}>
                  <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Course
                  </Text>
                  <div style={{ fontWeight: 700, color: '#1a365d' }}>
                    {preview.section?.course_name || '—'}
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Section
                  </Text>
                  <div style={{ fontWeight: 700 }}>
                    <Tag color="blue">{preview.section?.section_code || '—'}</Tag>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Credits
                  </Text>
                  <div style={{ fontWeight: 700 }}>
                    <Tag color="purple">{preview.section?.credits || '—'}</Tag>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Semester
                  </Text>
                  <div style={{ fontWeight: 700 }}>
                    {preview.section?.semester_name || '—'}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Locked banner */}
            {isLocked && (
              <Alert
                message="This section is already finalized"
                description="Grades for this section have been officially submitted and cannot be modified. Contact the administrator if changes are needed."
                type="success"
                showIcon
                icon={<LockOutlined />}
                style={{ marginBottom: 16, borderRadius: 10 }}
              />
            )}

            {/* Reason if can't finalize */}
            {!isLocked && !preview.can_finalize && preview.reason && (
              <Alert
                message="Cannot finalize yet"
                description={preview.reason}
                type="warning"
                showIcon
                style={{ marginBottom: 16, borderRadius: 10 }}
              />
            )}

            {/* Summary stats */}
            {preview.students?.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <Statistic
                      title="Total Students"
                      value={preview.summary?.total_students || 0}
                      valueStyle={{ color: '#1a365d' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <Statistic
                      title="Will Pass"
                      value={preview.summary?.passed || 0}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#276749' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <Statistic
                      title="Will Fail"
                      value={preview.summary?.failed || 0}
                      prefix={<CloseCircleOutlined />}
                      valueStyle={{ color: '#c53030' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <Statistic
                      title="Missing Grades"
                      value={preview.summary?.missing || 0}
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: (preview.summary?.missing || 0) > 0 ? '#d97706' : '#94A3B8' }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* Component info */}
            {preview.components?.length > 0 && (
              <Card
                title={<span style={{ color: '#1a365d', fontWeight: 700 }}>Grade Components</span>}
                style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
              >
                <Space wrap>
                  {preview.components.map((c) => (
                    <Tag key={c.id} color="blue" style={{ padding: '4px 10px', fontSize: 12 }}>
                      <strong>{c.name}</strong> · {Number(c.weight).toFixed(0)}% weight · max {c.max_grade}
                    </Tag>
                  ))}
                </Space>
              </Card>
            )}

            {/* Students table */}
            {preview.students?.length > 0 && (
              <Card
                title={
                  <Row justify="space-between" align="middle">
                    <Col>
                      <span style={{ color: '#1a365d', fontWeight: 700 }}>
                        Per-Student Final Grades
                      </span>
                    </Col>
                    {!isLocked && preview.can_finalize && (
                      <Col>
                        <Button
                          type="primary"
                          danger
                          size="large"
                          icon={<TrophyOutlined />}
                          onClick={() => setConfirmModalOpen(true)}
                        >
                          Finalize Section
                        </Button>
                      </Col>
                    )}
                  </Row>
                }
                style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                <Table
                  dataSource={preview.students}
                  columns={studentColumns}
                  rowKey="student_id"
                  size="middle"
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            )}

            {/* If finalize just happened, show GPA updates */}
            {resultData && resultData.gpa_updates && (
              <Card
                title={<span style={{ color: '#276749', fontWeight: 700 }}>
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  Finalization Complete — GPA Updates
                </span>}
                style={{ borderRadius: 14, border: 'none', marginTop: 16, background: '#F0FFF4' }}
              >
                <Row gutter={[12, 12]}>
                  {resultData.gpa_updates.map((upd) => (
                    <Col key={upd.student_id} xs={24} sm={12} md={8}>
                      <Card size="small" style={{ borderRadius: 10 }}>
                        <Text strong>{upd.student_name}</Text>
                        <div style={{ marginTop: 6, fontSize: 12 }}>
                          New GPA: <Tag color="green">{Number(upd.new_gpa).toFixed(2)}</Tag>
                        </div>
                        <div style={{ fontSize: 12 }}>
                          Credits: <Tag>{upd.completed_credits}</Tag>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        title={
          <span style={{ color: '#c53030', fontWeight: 700 }}>
            <TrophyOutlined style={{ marginRight: 8 }} />
            Finalize Grades — Permanent Action
          </span>
        }
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={handleFinalize}
        okText="Yes, Finalize Permanently"
        cancelText="Cancel"
        okButtonProps={{ loading: finalizing, danger: true }}
        width={520}
      >
        {preview && (
          <>
            <Alert
              message="This action cannot be undone"
              description="Once finalized, you will not be able to change grades. Course completions will be recorded and student GPAs will be recalculated. Only an administrator can reverse this."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text type="secondary">Course:</Text>
                <Text strong>{preview.section?.course_name} ({preview.section?.section_code})</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text type="secondary">Students to finalize:</Text>
                <Text strong>{preview.summary?.total_students || 0}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text type="secondary">Will pass:</Text>
                <Text strong style={{ color: '#276749' }}>{preview.summary?.passed || 0}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Will fail:</Text>
                <Text strong style={{ color: '#c53030' }}>{preview.summary?.failed || 0}</Text>
              </div>
            </div>
          </>
        )}
      </Modal>
    </InstructorLayout>
  );
}