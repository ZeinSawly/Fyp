import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Button, Select, Table, Tag, Spin,
  Empty, Alert, Modal, Statistic, Divider, message,
} from 'antd';
import {
  CalendarOutlined, DollarOutlined, UserOutlined,
  WarningOutlined, CheckCircleOutlined, EyeOutlined,
  ThunderboltOutlined, GiftOutlined,
} from '@ant-design/icons';
import FinanceLayout from '../../Components/FinanceLayout';
import api from '../../config/api';

const { Title, Text } = Typography;

export default function GenerateBills() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState(null);
  const [loadingSemesters, setLoadingSemesters] = useState(true);

  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Returns null if eligible, or an info object if not yet eligible
const getEligibility = (semester) => {
    if (!semester || !semester.enrollment_end_date) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const enrollmentEnd = new Date(semester.enrollment_end_date);
    
    if (today <= enrollmentEnd) {
      const daysUntil = Math.ceil((enrollmentEnd - today) / (1000 * 60 * 60 * 24));
      return {
        eligible: false,
        enrollment_end_date: semester.enrollment_end_date,
        days_until_eligible: daysUntil,
      };
    }
    
    return { eligible: true };
  };

  // Load all semesters on mount
  useEffect(() => {
    api.get('/api/common/semesters')
      .then((res) => {
        if (res.data.success) {
          setSemesters(res.data.data || []);
        }
      })
      .catch((err) => console.error('Failed to load semesters', err))
      .finally(() => setLoadingSemesters(false));
  }, []);

  const handlePreview = async () => {
    if (!selectedSemesterId) return;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewData(null);

    try {
      const res = await api.post(`/api/finance/semesters/${selectedSemesterId}/preview-bills`);
      if (res.data.success) {
        setPreviewData(res.data.data);
      } else {
        setPreviewError(res.data.message || 'Failed to preview');
      }
    } catch (err) {
      console.error('Preview error:', err);
      setPreviewError(err.response?.data?.message || 'Failed to preview bills');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/api/finance/semesters/${selectedSemesterId}/generate-bills`);

      if (res.data.success) {
        const { generated_count, skipped_count, semester_name } = res.data.data;
        message.success({
          content: (
            <span>
              Generated <strong>{generated_count}</strong> bill{generated_count === 1 ? '' : 's'} for {semester_name}
              {skipped_count > 0 && ` (${skipped_count} skipped)`}
            </span>
          ),
          duration: 5,
        });
        setConfirmModalOpen(false);
        // Refresh the preview to show updated state
        handlePreview();
      } else {
        message.error(res.data.message || 'Generation failed');
      }
    } catch (err) {
      console.error('Generate error:', err);
      message.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount) =>
    `$${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Table columns for the per-student breakdown
  const columns = [
    {
      title: 'Student',
      key: 'student',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1a365d' }}>
            {row.student.name}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            {row.student.id} · {row.student.major_name}
          </div>
        </div>
      ),
    },
    {
      title: 'Credits',
      dataIndex: 'total_credits',
      key: 'total_credits',
      align: 'center',
      width: 80,
      render: (v, row) => (
        <Tag color="blue">
          {v} ({row.sections_count} sec)
        </Tag>
      ),
    },
    {
      title: 'Base Tuition',
      dataIndex: 'base_tuition',
      key: 'base_tuition',
      align: 'right',
      render: (v) => <Text>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Discounts',
      key: 'discounts',
      align: 'right',
      render: (_, row) => {
        if (row.total_discount_amount === 0) return <Text style={{ color: '#CBD5E0' }}>—</Text>;
        return (
          <div>
            <div style={{ color: '#2f855a', fontWeight: 700 }}>
              -{formatCurrency(row.total_discount_amount)}
            </div>
            {row.discounts_applied.map((d, i) => (
              <div key={i} style={{ fontSize: 10, color: '#94A3B8' }}>
                {d.type_name} ({d.calculation === 'percentage' ? `${d.value}%` : formatCurrency(d.value)})
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Final Tuition',
      dataIndex: 'final_tuition',
      key: 'final_tuition',
      align: 'right',
      render: (v) => <Text strong>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Fees',
      dataIndex: 'total_fees',
      key: 'total_fees',
      align: 'right',
      render: (v) => <Text>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Total Due',
      dataIndex: 'total_due',
      key: 'total_due',
      align: 'right',
      render: (v) => (
        <Text strong style={{ color: '#1a365d', fontSize: 14 }}>
          {formatCurrency(v)}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      width: 130,
      render: (_, row) => {
        if (row.already_billed) {
          return <Tag color="default" icon={<CheckCircleOutlined />}>Already Billed</Tag>;
        }
        if (row.skipped_reason) {
          return <Tag color="orange" icon={<WarningOutlined />}>{row.skipped_reason}</Tag>;
        }
        return <Tag color="blue" icon={<ThunderboltOutlined />}>Will Bill</Tag>;
      },
    },
  ];

  const selectedSemester = semesters.find((s) => s.id === selectedSemesterId);
  const eligibility = selectedSemester ? getEligibility(selectedSemester) : null;
  const isEligible = eligibility?.eligible !== false;
  const canGenerate = previewData && previewData.summary.students_to_bill > 0 && isEligible;

  return (
    <FinanceLayout title="Generate Semester Bills">

      {/* Header card */}
      <Card style={{
        borderRadius: 16, border: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20,
      }}>
        <Title level={4} style={{ margin: 0, color: '#1a365d' }}>
          <ThunderboltOutlined style={{ marginRight: 8 }} />
          Generate Semester Bills
        </Title>
        <Text style={{ color: '#64748B', fontSize: 13 }}>
          Pick a semester to preview the bills that would be created for all enrolled students.
          Already-billed students are automatically skipped.
        </Text>

        <Row gutter={12} style={{ marginTop: 16 }}>
          <Col xs={24} md={16}>
            <Select
              size="large"
              placeholder="Select a semester..."
              value={selectedSemesterId}
              onChange={setSelectedSemesterId}
              loading={loadingSemesters}
              style={{ width: '100%' }}
            >
              {semesters.map((s) => {
                const elig = getEligibility(s);
                const notReady = elig && !elig.eligible;
                return (
                    <Select.Option key={s.id} value={s.id}>
                    {s.name} ({s.academic_year})
                    {s.is_current && (
                        <Tag color="green" style={{ marginLeft: 8 }}>Current</Tag>
                    )}
                    {notReady && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>
                        Enrollment Active
                        </Tag>
                    )}
                    </Select.Option>
                );
                })}
            </Select>
          </Col>
          <Col xs={24} md={8}>
          <Button
            type="primary"
            size="large"
            icon={<EyeOutlined />}
            onClick={handlePreview}
            loading={previewLoading}
            disabled={!selectedSemesterId || !isEligible}
            style={{ width: '100%', background: '#276749', borderColor: '#276749' }}
            >
            Preview Bills
            </Button>
          </Col>
        </Row>

        {selectedSemester && (
          <div style={{
            marginTop: 12, padding: 12, background: '#F8FAFC',
            borderRadius: 10, fontSize: 12, color: '#4A5568',
          }}>
            <CalendarOutlined style={{ marginRight: 6 }} />
            {selectedSemester.name} runs from <strong>{new Date(selectedSemester.start_date).toLocaleDateString()}</strong> to <strong>{new Date(selectedSemester.end_date).toLocaleDateString()}</strong>.
            Enrollment ended <strong>{new Date(selectedSemester.enrollment_end_date).toLocaleDateString()}</strong>.
          </div>
        )}

        {selectedSemester && eligibility && !eligibility.eligible && (
        <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginTop: 12 }}
            message="Enrollment period still active"
            description={
            <span>
                Bills cannot be generated until the enrollment period for{' '}
                <strong>{selectedSemester.name}</strong> ends on{' '}
                <strong>{new Date(selectedSemester.enrollment_end_date).toLocaleDateString()}</strong>.
                Students may still be enrolling, swapping, or dropping courses.
                {' '}
                <strong>
                {eligibility.days_until_eligible === 1
                    ? '1 day'
                    : `${eligibility.days_until_eligible} days`}
                </strong>{' '}
                remaining.
            </span>
            }
        />
        )}
      </Card>

      {previewError && (
        <Alert
          message="Preview failed"
          description={previewError}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      {previewLoading && (
        <Card style={{ borderRadius: 16, border: 'none', textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#64748B' }}>
            Computing bills for enrolled students...
          </div>
        </Card>
      )}

      {previewData && !previewLoading && (
        <>
          {/* Summary cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Total Enrolled"
                  value={previewData.summary.total_students}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1a365d', fontSize: 22 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Will Bill"
                  value={previewData.summary.students_to_bill}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#276749', fontSize: 22 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Already Billed"
                  value={previewData.summary.students_already_billed}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#94A3B8', fontSize: 22 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Skipped"
                  value={previewData.summary.students_skipped}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#d97706', fontSize: 22 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Financial totals card */}
          {canGenerate && (
            <Card
              style={{
                borderRadius: 16, border: 'none',
                marginBottom: 20,
                background: 'linear-gradient(135deg, #1a365d 0%, #276749 100%)',
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Total Tuition</Text>}
                    value={previewData.summary.grand_total_tuition}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#fff', fontSize: 18, fontWeight: 700 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Total Discounts</Text>}
                    value={previewData.summary.grand_total_discount}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#C6F6D5', fontSize: 18, fontWeight: 700 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Total Fees</Text>}
                    value={previewData.summary.grand_total_fees}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#fff', fontSize: 18, fontWeight: 700 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Grand Total</Text>}
                    value={previewData.summary.grand_total_due}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#fff', fontSize: 22, fontWeight: 800 }}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* Action button */}
          {canGenerate && (
            <Card style={{
              borderRadius: 16, border: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              marginBottom: 20, background: '#FFFBEB',
            }}>
              <Row align="middle" justify="space-between" gutter={16}>
                <Col flex="auto">
                  <Text strong style={{ color: '#9C4221', display: 'block', marginBottom: 4 }}>
                    <WarningOutlined style={{ marginRight: 6 }} />
                    Review before confirming
                  </Text>
                  <Text style={{ color: '#7B341E', fontSize: 12 }}>
                    Once confirmed, bills will be created in the database and students will see them in their accounts.
                    This action cannot be easily undone.
                  </Text>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    size="large"
                    danger
                    icon={<ThunderboltOutlined />}
                    onClick={() => setConfirmModalOpen(true)}
                  >
                    Confirm & Generate Bills
                  </Button>
                </Col>
              </Row>
            </Card>
          )}

          {!canGenerate && previewData.students.length > 0 && (
            <Alert
              message="No new bills to generate"
              description="All eligible students for this semester have already been billed, or there are no students with enrollments."
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}

          {/* Per-student table */}
          <Card
            title={
              <span style={{ color: '#1a365d', fontWeight: 700, fontSize: 14 }}>
                Per-Student Breakdown
              </span>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            {previewData.students.length === 0 ? (
              <Empty description="No enrolled students" />
            ) : (
              <Table
                dataSource={previewData.students}
                columns={columns}
                rowKey={(row) => row.student.id}
                pagination={{ pageSize: 20 }}
                size="middle"
                scroll={{ x: 'max-content' }}
              />
            )}
          </Card>
        </>
      )}

      {!previewData && !previewLoading && !previewError && (
        <Card style={{ borderRadius: 16, border: 'none', textAlign: 'center', padding: 40 }}>
          <EyeOutlined style={{ fontSize: 40, color: '#CBD5E0', marginBottom: 12 }} />
          <div style={{ color: '#94A3B8', fontSize: 14 }}>
            Select a semester and click "Preview Bills" to see what would be generated
          </div>
        </Card>
      )}

      {/* CONFIRMATION MODAL */}
      <Modal
        title={
          <span style={{ color: '#1a365d', fontWeight: 700 }}>
            <ThunderboltOutlined style={{ marginRight: 8 }} />
            Confirm Bill Generation
          </span>
        }
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={handleConfirmGenerate}
        okText="Yes, Generate Bills"
        okButtonProps={{
          loading: generating,
          danger: true,
        }}
        cancelText="Cancel"
        width={500}
      >
        {previewData && (
          <>
            <Alert
              message="This action will create real bills in the system"
              description="Students will immediately see these charges in their financial accounts and on the mobile app."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div style={{
              background: '#F8FAFC', padding: 16, borderRadius: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">Semester:</Text>
                <Text strong>{previewData.semester.name}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">Students to bill:</Text>
                <Text strong style={{ color: '#276749' }}>
                  {previewData.summary.students_to_bill}
                </Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 14 }}>Grand total:</Text>
                <Text strong style={{ fontSize: 16, color: '#1a365d' }}>
                  {formatCurrency(previewData.summary.grand_total_due)}
                </Text>
              </div>
            </div>
          </>
        )}
      </Modal>

    </FinanceLayout>
  );
}