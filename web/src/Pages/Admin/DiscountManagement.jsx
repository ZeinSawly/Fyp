import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Typography, Row, Col,
  Modal, Form, Input, InputNumber, Select, AutoComplete,
  message, Alert, Empty, Tabs, Switch, Popconfirm, Spin,
} from 'antd';
import {
  GiftOutlined, EditOutlined, PlusOutlined,
  CheckCircleOutlined, ArrowLeftOutlined, UserOutlined,
  AppstoreOutlined, TrophyOutlined, HistoryOutlined,
  CloseCircleOutlined, SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Text } = Typography;
const { TextArea } = Input;

const SCOPE_LABELS = {
  semester: { label: 'Per Semester', color: 'blue' },
  academic_year: { label: 'Academic Year', color: 'purple' },
};

const APPLIES_TO_LABELS = {
  tuition_only: 'Tuition Only',
  tuition_and_fees: 'Tuition + Fees',
  specific_fee: 'Specific Fee',
};

const CALC_LABELS = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed Amount',
};

const STATUS_COLORS = {
  active: 'green',
  cancelled: 'red',
  expired: 'default',
};

export default function DiscountManagement() {
  const navigate = useNavigate();

  // Discount types state
  const [discountTypes, setDiscountTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Student discounts state
  const [studentDiscounts, setStudentDiscounts] = useState([]);
  const [loadingAwards, setLoadingAwards] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);

  // Semesters (for the award form)
  const [semesters, setSemesters] = useState([]);

  // Type modal
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm] = Form.useForm();
  const [savingType, setSavingType] = useState(false);

  // Award form
  const [awardForm] = Form.useForm();
  const [awarding, setAwarding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTypeForAward, setSelectedTypeForAward] = useState(null);
  const [studentSearchOptions, setStudentSearchOptions] = useState([]);
  const [studentSearching, setStudentSearching] = useState(false);

  useEffect(() => {
    fetchDiscountTypes();
    fetchStudentDiscounts();
    fetchSemesters();
  }, []);

  const fetchDiscountTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await api.get('/api/admin/discount-types');
      if (res.data.success) setDiscountTypes(res.data.data);
    } catch { message.error('Failed to load discount types'); }
    finally { setLoadingTypes(false); }
  };

  const fetchStudentDiscounts = async (filterStatus = null) => {
    setLoadingAwards(true);
    try {
      const url = filterStatus
        ? `/api/admin/student-discounts?status=${filterStatus}`
        : `/api/admin/student-discounts`;
      const res = await api.get(url);
      if (res.data.success) setStudentDiscounts(res.data.data);
    } catch { message.error('Failed to load awarded discounts'); }
    finally { setLoadingAwards(false); }
  };

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/api/common/semesters');
      if (res.data.success) setSemesters(res.data.data);
    } catch { console.error('Failed to load semesters'); }
  };

  // ─── DISCOUNT TYPE HANDLERS ─────────────────────────

  const openCreateType = () => {
    setEditingType(null);
    typeForm.resetFields();
    typeForm.setFieldsValue({
      scope: 'semester',
      calculation: 'percentage',
      applies_to: 'tuition_only',
      is_active: true,
    });
    setTypeModalOpen(true);
  };

  const openEditType = (dt) => {
    setEditingType(dt);
    typeForm.setFieldsValue({
      code: dt.code,
      name: dt.name,
      description: dt.description,
      scope: dt.scope,
      calculation: dt.calculation,
      applies_to: dt.applies_to,
      is_active: dt.is_active === 1,
    });
    setTypeModalOpen(true);
  };

  const closeTypeModal = () => {
    setTypeModalOpen(false);
    setEditingType(null);
    typeForm.resetFields();
  };

  const handleSaveType = async () => {
    try {
      const values = await typeForm.validateFields();
      setSavingType(true);

      const payload = {
        code: values.code,
        name: values.name,
        description: values.description,
        scope: values.scope,
        calculation: values.calculation,
        applies_to: values.applies_to,
        is_active: values.is_active,
      };

      if (editingType) {
        await api.put(`/api/admin/discount-types/${editingType.id}`, payload);
        message.success('Discount type updated');
      } else {
        await api.post('/api/admin/discount-types', payload);
        message.success('Discount type created');
      }

      closeTypeModal();
      fetchDiscountTypes();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Save failed');
    } finally { setSavingType(false); }
  };

  // ─── AWARD HANDLERS ─────────────────────────

  const handleStudentSearch = async (value) => {
    if (!value || value.length < 1) {
      setStudentSearchOptions([]);
      return;
    }
    setStudentSearching(true);
    try {
      const res = await api.get(`/api/admin/students/search?q=${encodeURIComponent(value)}`);
      if (res.data.success) {
        setStudentSearchOptions(
          res.data.data.map(s => ({
            value: String(s.id),
            label: (
              <div>
                <div style={{ fontWeight: 600, color: '#1a365d' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  ID: {s.id} · {s.major_name || '—'}
                </div>
              </div>
            ),
            student: s,
          }))
        );
      }
    } catch { console.error('Student search failed'); }
    finally { setStudentSearching(false); }
  };

  const handleStudentSelect = (value, option) => {
    const s = option.student;
    setSelectedStudent(s);
    awardForm.setFieldValue('student_id', s.id);
  };

  const handleTypeChange = (typeId) => {
    const type = discountTypes.find(t => t.id === typeId);
    setSelectedTypeForAward(type);
    // Clear scope-specific fields when type changes
    awardForm.setFieldsValue({
      semester_id: undefined,
      academic_year: undefined,
      percentage: undefined,
      fixed_amount: undefined,
    });
  };

  const handleAward = async () => {
    try {
      const values = await awardForm.validateFields();
      setAwarding(true);

      const payload = {
        student_id: values.student_id,
        discount_type_id: values.discount_type_id,
        reason: values.reason,
      };

      if (selectedTypeForAward?.calculation === 'percentage') {
        payload.percentage = values.percentage;
      } else {
        payload.fixed_amount = values.fixed_amount;
      }

      if (selectedTypeForAward?.scope === 'semester') {
        payload.semester_id = values.semester_id;
      } else {
        payload.academic_year = values.academic_year;
      }

      await api.post('/api/admin/student-discounts', payload);
      message.success('Discount awarded successfully');

      // Reset
      awardForm.resetFields();
      setSelectedStudent(null);
      setSelectedTypeForAward(null);
      fetchStudentDiscounts(statusFilter);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Failed to award discount');
    } finally { setAwarding(false); }
  };

  const handleCancelDiscount = async (id) => {
    try {
      await api.put(`/api/admin/student-discounts/${id}/cancel`);
      message.success('Discount cancelled');
      fetchStudentDiscounts(statusFilter);
    } catch (err) {
      message.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  // ─── TABLE COLUMNS ─────────────────────────

  const discountTypeColumns = [
    { title: 'Code', dataIndex: 'code', key: 'code', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Name', dataIndex: 'name', key: 'name', render: v => <Text strong>{v}</Text> },
    {
      title: 'Scope', dataIndex: 'scope', key: 'scope',
      render: v => {
        const cfg = SCOPE_LABELS[v] || { label: v, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Calculation', dataIndex: 'calculation', key: 'calculation',
      render: v => <Tag>{CALC_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Applies To', dataIndex: 'applies_to', key: 'applies_to',
      render: v => <Text style={{ fontSize: 12 }}>{APPLIES_TO_LABELS[v] || v}</Text>,
    },
    {
      title: 'Status', dataIndex: 'is_active', key: 'is_active',
      render: v => v
        ? <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
        : <Tag color="default">Inactive</Tag>,
    },
    {
      title: 'Action', key: 'action', width: 100, align: 'center',
      render: (_, row) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditType(row)}>
          Edit
        </Button>
      ),
    },
  ];

  const awardedColumns = [
    {
      title: 'Student',
      key: 'student',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.student_name}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{row.student_id}</Text>
        </div>
      ),
    },
    {
      title: 'Discount Type',
      key: 'type',
      render: (_, row) => (
        <div>
          <Tag color="blue">{row.type_code}</Tag>
          <div style={{ fontSize: 12 }}>{row.type_name}</div>
        </div>
      ),
    },
    {
      title: 'Value', key: 'value', align: 'right',
      render: (_, row) => (
        <Text strong style={{ color: '#276749' }}>
          {row.calculation === 'percentage'
            ? `${Number(row.percentage).toFixed(0)}%`
            : `$${Number(row.fixed_amount).toFixed(2)}`}
        </Text>
      ),
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, row) => (
        <Text style={{ fontSize: 12 }}>
          {row.scope === 'semester'
            ? (row.semester_name || `Semester ${row.semester_id}`)
            : `AY ${row.academic_year}`}
        </Text>
      ),
    },
    {
      title: 'Reason', dataIndex: 'reason', key: 'reason',
      ellipsis: true,
      render: v => <Text type="secondary" style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
    {
      title: 'Approved By',
      dataIndex: 'approver_name', key: 'approver_name',
      render: v => <Text style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: v => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Action', key: 'action', align: 'center', width: 120,
      render: (_, row) => row.status === 'active' && (
        <Popconfirm
          title="Cancel this discount?"
          description="The student will no longer benefit from it on new bills."
          okText="Yes, cancel"
          cancelText="Keep"
          onConfirm={() => handleCancelDiscount(row.id)}
        >
          <Button size="small" danger icon={<CloseCircleOutlined />}>Cancel</Button>
        </Popconfirm>
      ),
    },
  ];

  // Academic year dropdown (derive unique years from semesters)
  const academicYearOptions = [...new Set(
    semesters.map(s => s.academic_year).filter(Boolean)
  )].sort().reverse();

  // ─── TABS ─────────────────────────

  const tabItems = [
    {
      key: 'types',
      label: <span><AppstoreOutlined /> Discount Types</span>,
      children: (
        <Card
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          title={
            <Row justify="space-between" align="middle">
              <Col><span style={{ color: '#1a365d', fontWeight: 700 }}>Discount Type Catalog</span></Col>
              <Col>
                <Button
                  type="primary" icon={<PlusOutlined />} onClick={openCreateType}
                  style={{
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #1a365d, #2b6cb0)', border: 'none',
                  }}
                >
                  Add Discount Type
                </Button>
              </Col>
            </Row>
          }
        >
          <Alert
            message="Discount types define the kinds of discounts that can be awarded"
            description="GPA scholarships, financial aid, merit awards, sibling discounts — each one has its own rules (percentage vs fixed amount, semester-bound vs academic-year-bound, what it applies to)."
            type="info" showIcon style={{ marginBottom: 16, borderRadius: 8 }}
          />

          <Table
            dataSource={discountTypes}
            columns={discountTypeColumns}
            rowKey="id"
            loading={loadingTypes}
            size="middle"
            pagination={false}
            locale={{ emptyText: 'No discount types yet — click "Add Discount Type" to create one' }}
          />
        </Card>
      ),
    },
    {
      key: 'award',
      label: <span><TrophyOutlined /> Award Discount</span>,
      children: (
        <Card
          title={<span style={{ color: '#1a365d', fontWeight: 700 }}>Grant a Discount to a Student</span>}
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <Form form={awardForm} layout="vertical" requiredMark={false}>

            {/* Student Search */}
            <Form.Item
              label={<Text style={{ fontWeight: 600 }}>Student</Text>}
              name="student_id"
              rules={[{ required: true, message: 'Please select a student' }]}
            >
              <AutoComplete
                size="large"
                placeholder="Search by name or student ID..."
                options={studentSearchOptions}
                onSearch={handleStudentSearch}
                onSelect={handleStudentSelect}
                notFoundContent={studentSearching ? <Spin size="small" /> : null}
                style={{ width: '100%' }}
                value={selectedStudent ? `${selectedStudent.name} (${selectedStudent.id})` : undefined}
              />
            </Form.Item>

            {/* Hidden field stores the actual ID — handled by AutoComplete onSelect */}

            {/* Discount Type */}
            <Form.Item
              label={<Text style={{ fontWeight: 600 }}>Discount Type</Text>}
              name="discount_type_id"
              rules={[{ required: true, message: 'Please select a discount type' }]}
            >
              <Select
                size="large"
                placeholder="Select discount type"
                onChange={handleTypeChange}
                showSearch
                optionFilterProp="label"
                options={discountTypes
                  .filter(dt => dt.is_active)
                  .map(dt => ({
                    value: dt.id,
                    label: `${dt.name} (${dt.code})`,
                  }))
                }
              />
            </Form.Item>

            {/* Calculation value (percentage or fixed) — depends on selected type */}
            {selectedTypeForAward?.calculation === 'percentage' && (
              <Form.Item
                label={<Text style={{ fontWeight: 600 }}>Percentage</Text>}
                name="percentage"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'number', min: 0.1, max: 100, message: 'Between 0 and 100' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }} size="large"
                  min={0.1} max={100} step={0.1} precision={2}
                  addonAfter="%" placeholder="e.g., 25"
                />
              </Form.Item>
            )}

            {selectedTypeForAward?.calculation === 'fixed_amount' && (
              <Form.Item
                label={<Text style={{ fontWeight: 600 }}>Fixed Amount</Text>}
                name="fixed_amount"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'number', min: 0.01, message: 'Must be positive' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }} size="large"
                  min={0.01} step={1} precision={2}
                  prefix="$" placeholder="e.g., 500"
                />
              </Form.Item>
            )}

            {/* Scope value */}
            {selectedTypeForAward?.scope === 'semester' && (
              <Form.Item
                label={<Text style={{ fontWeight: 600 }}>Semester</Text>}
                name="semester_id"
                rules={[{ required: true, message: 'Please select a semester' }]}
                extra="The discount will only apply to bills in this semester"
              >
                <Select size="large" placeholder="Select semester" showSearch optionFilterProp="label">
                  {semesters.map(s => (
                    <Select.Option key={s.id} value={s.id} label={s.name}>
                      {s.name} ({s.academic_year})
                      {s.is_current && <Tag color="green" style={{ marginLeft: 8 }}>Current</Tag>}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {selectedTypeForAward?.scope === 'academic_year' && (
              <Form.Item
                label={<Text style={{ fontWeight: 600 }}>Academic Year</Text>}
                name="academic_year"
                rules={[{ required: true, message: 'Please select an academic year' }]}
                extra="The discount will apply to both semesters in this academic year"
              >
                <Select size="large" placeholder="Select academic year" showSearch>
                  {academicYearOptions.map(ay => (
                    <Select.Option key={ay} value={ay}>{ay}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {/* Reason */}
            <Form.Item
              label={<Text style={{ fontWeight: 600 }}>Reason / Justification</Text>}
              name="reason"
              rules={[{ required: true, message: 'Please provide a reason' }]}
              extra="This is part of the audit trail — explain why this student qualifies"
            >
              <TextArea rows={3} placeholder="e.g., 'GPA 3.8 in Fall 2025 qualifies for merit scholarship'" />
            </Form.Item>

            <Button
              type="primary" size="large" htmlType="submit"
              onClick={handleAward}
              loading={awarding} icon={<TrophyOutlined />}
              disabled={!selectedTypeForAward}
              style={{
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1a365d, #276749)', border: 'none',
              }}
            >
              {awarding ? 'Awarding...' : 'Award Discount'}
            </Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'awarded',
      label: <span><HistoryOutlined /> Awarded Discounts</span>,
      children: (
        <Card
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          title={
            <Row justify="space-between" align="middle">
              <Col><span style={{ color: '#1a365d', fontWeight: 700 }}>All Awarded Discounts</span></Col>
              <Col>
                <Select
                  placeholder="Filter by status"
                  style={{ width: 200 }} allowClear
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); fetchStudentDiscounts(val); }}
                >
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                  <Select.Option value="expired">Expired</Select.Option>
                </Select>
              </Col>
            </Row>
          }
        >
          <Table
            dataSource={studentDiscounts}
            columns={awardedColumns}
            rowKey="id"
            loading={loadingAwards}
            size="middle"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="No discounts awarded yet" /> }}
          />
        </Card>
      ),
    },
  ];

  return (
    <AdminLayout title="Discount Management">
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        <div style={{ marginBottom: 24 }}>
          <Button type="text" icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin')} style={{ color: '#64748B' }}>
            Back to Dashboard
          </Button>
        </div>

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
            <GiftOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Discount Management</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Define discount types and award scholarships, financial aid, and other discounts
            </div>
          </div>
        </div>

        <Tabs defaultActiveKey="types" items={tabItems} size="large"
          style={{ background: '#fff', borderRadius: 16, padding: '8px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        />
      </div>

      {/* DISCOUNT TYPE MODAL */}
      <Modal
        title={
          <span style={{ color: '#1a365d', fontWeight: 700 }}>
            <GiftOutlined style={{ marginRight: 8 }} />
            {editingType ? 'Edit Discount Type' : 'New Discount Type'}
          </span>
        }
        open={typeModalOpen}
        onCancel={closeTypeModal}
        onOk={handleSaveType}
        okText={editingType ? 'Save Changes' : 'Create'}
        okButtonProps={{ loading: savingType }}
        width={560}
        destroyOnClose
      >
        <Form form={typeForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Required' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Uppercase letters, numbers, underscores only' },
            ]}
            extra="Short uppercase identifier, e.g., GPA_SCHOLARSHIP, FINANCIAL_AID"
          >
            <Input size="large" placeholder="e.g., DEAN_AWARD" disabled={!!editingType} style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="name" label="Display Name" rules={[{ required: true, message: 'Required' }]}>
            <Input size="large" placeholder="e.g., Dean's List Award" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="What this discount is for" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="scope" label="Scope" rules={[{ required: true }]}>
                <Select size="large">
                  <Select.Option value="semester">Per Semester</Select.Option>
                  <Select.Option value="academic_year">Academic Year</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="calculation" label="Calculation" rules={[{ required: true }]}>
                <Select size="large">
                  <Select.Option value="percentage">Percentage</Select.Option>
                  <Select.Option value="fixed_amount">Fixed Amount</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="applies_to" label="Applies To" rules={[{ required: true }]}>
            <Select size="large">
              <Select.Option value="tuition_only">Tuition Only</Select.Option>
              <Select.Option value="tuition_and_fees">Tuition + Fees</Select.Option>
              <Select.Option value="specific_fee">Specific Fee</Select.Option>
            </Select>
          </Form.Item>

          {editingType && (
            <Form.Item name="is_active" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </AdminLayout>
  );
}