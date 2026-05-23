import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Typography, Row, Col,
  Modal, Form, InputNumber, DatePicker, Select, Input,
  message, Alert, Empty, Tabs, Switch,
} from 'antd';
import {
  DollarOutlined, EditOutlined, HistoryOutlined,
  PlusOutlined, CheckCircleOutlined, ArrowLeftOutlined,
  TagOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CHARGE_BASIS_LABELS = {
  per_semester: { label: 'Per Semester', color: 'blue' },
  one_time: { label: 'One Time', color: 'purple' },
  on_demand: { label: 'On Demand', color: 'orange' },
};

export default function FeeManagement() {
  const navigate = useNavigate();

  // Fee types state
  const [feeTypes, setFeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Type modal (create/edit fee type)
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm] = Form.useForm();
  const [savingType, setSavingType] = useState(false);

  // Pricing modal (set price for a fee type)
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingPriceFor, setEditingPriceFor] = useState(null);
  const [priceForm] = Form.useForm();
  const [savingPrice, setSavingPrice] = useState(false);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState(null);

  useEffect(() => {
    fetchFeeTypes();
    fetchHistory();
  }, []);

  const fetchFeeTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/fee-types');
      if (res.data.success) setFeeTypes(res.data.data);
    } catch {
      message.error('Failed to load fee types');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (feeTypeId = null) => {
    setHistoryLoading(true);
    try {
      const url = feeTypeId
        ? `/api/admin/fee-pricing/history?fee_type_id=${feeTypeId}`
        : `/api/admin/fee-pricing/history`;
      const res = await api.get(url);
      if (res.data.success) setHistory(res.data.data);
    } catch {
      message.error('Failed to load pricing history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─── FEE TYPE HANDLERS ─────────────────────────

  const openCreateType = () => {
    setEditingType(null);
    typeForm.resetFields();
    typeForm.setFieldsValue({ charge_basis: 'per_semester', is_active: true });
    setTypeModalOpen(true);
  };

  const openEditType = (ft) => {
    setEditingType(ft);
    typeForm.setFieldsValue({
      code: ft.code,
      name: ft.name,
      description: ft.description,
      charge_basis: ft.charge_basis,
      is_active: ft.is_active === 1,
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
        charge_basis: values.charge_basis,
        is_active: values.is_active,
      };

      if (editingType) {
        // Update
        await api.put(`/api/admin/fee-types/${editingType.id}`, payload);
        message.success('Fee type updated');
      } else {
        // Create
        await api.post('/api/admin/fee-types', payload);
        message.success('Fee type created');
      }

      closeTypeModal();
      fetchFeeTypes();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSavingType(false);
    }
  };

  // ─── PRICING HANDLERS ─────────────────────────

  const openSetPrice = (ft) => {
    setEditingPriceFor(ft);
    priceForm.setFieldsValue({
      amount: null,
      effective_from: dayjs(),
    });
    setPriceModalOpen(true);
  };

  const closePriceModal = () => {
    setPriceModalOpen(false);
    setEditingPriceFor(null);
    priceForm.resetFields();
  };

  const handleSavePrice = async () => {
    try {
      const values = await priceForm.validateFields();
      setSavingPrice(true);

      await api.put('/api/admin/fee-pricing', {
        fee_type_id: editingPriceFor.id,
        amount: values.amount,
        effective_from: values.effective_from.format('YYYY-MM-DD'),
      });

      message.success(`Price updated for ${editingPriceFor.name}`);
      closePriceModal();
      fetchFeeTypes();
      fetchHistory(historyFilter);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Price update failed');
    } finally {
      setSavingPrice(false);
    }
  };

  // ─── FORMATTING ─────────────────────────

  const formatCurrency = (v) =>
    v === null || v === undefined
      ? <Text type="secondary">Not set</Text>
      : `$${Number(v).toFixed(2)}`;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  // ─── COLUMNS ─────────────────────────

  const feeTypeColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: v => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: v => <Text strong>{v}</Text>,
    },
    {
      title: 'Charge Basis',
      dataIndex: 'charge_basis',
      key: 'charge_basis',
      width: 140,
      render: v => {
        const cfg = CHARGE_BASIS_LABELS[v] || { label: v, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Current Price',
      dataIndex: 'current_amount',
      key: 'current_amount',
      align: 'right',
      width: 140,
      render: v => (
        <Text strong style={{ fontSize: 14, color: v ? '#276749' : '#94A3B8' }}>
          {formatCurrency(v)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: v => v
        ? <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
        : <Tag color="default">Inactive</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      align: 'center',
      render: (_, row) => (
        <>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditType(row)}
            style={{ marginRight: 6 }}
          >
            Edit
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => openSetPrice(row)}
            style={{ background: '#276749', borderColor: '#276749' }}
            disabled={!row.is_active}
          >
            {row.current_amount ? 'Update Price' : 'Set Price'}
          </Button>
        </>
      ),
    },
  ];

  const historyColumns = [
    {
      title: 'Fee',
      dataIndex: 'fee_name',
      key: 'fee_name',
      render: (v, row) => (
        <span>
          <Tag color="blue">{row.fee_code}</Tag> <Text strong>{v}</Text>
        </span>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: v => formatCurrency(v),
    },
    {
      title: 'Effective From',
      dataIndex: 'effective_from',
      key: 'effective_from',
      render: v => formatDate(v),
    },
    {
      title: 'Effective Until',
      dataIndex: 'effective_until',
      key: 'effective_until',
      render: v => v ? formatDate(v) : <Tag color="green">Current</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      render: v => v
        ? <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
        : <Tag color="default">Historical</Tag>,
    },
  ];

  // Unique fee types from history
  const uniqueFees = [...new Map(
    history.map(h => [h.fee_type_id, { id: h.fee_type_id, name: h.fee_name }])
  ).values()];

  // ─── TABS ─────────────────────────

  const tabItems = [
    {
      key: 'types',
      label: <span><AppstoreOutlined /> Fee Types & Pricing</span>,
      children: (
        <Card
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <span style={{ color: '#1a365d', fontWeight: 700 }}>Fee Catalog</span>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreateType}
                  style={{
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                    border: 'none',
                  }}
                >
                  Add Fee Type
                </Button>
              </Col>
            </Row>
          }
        >
          <Alert
            message="Fees are charged equally across all majors"
            description="Registration, insurance, and other administrative fees use the same amount regardless of the student's major. Edit a fee type to deactivate it; deactivated fees won't be applied to new bills."
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />

          <Table
            dataSource={feeTypes}
            columns={feeTypeColumns}
            rowKey="id"
            loading={loading}
            size="middle"
            pagination={false}
            locale={{ emptyText: 'No fee types yet — click "Add Fee Type" to create one' }}
          />
        </Card>
      ),
    },
    {
      key: 'history',
      label: <span><HistoryOutlined /> Pricing History</span>,
      children: (
        <Card
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <span style={{ color: '#1a365d', fontWeight: 700 }}>All Pricing Changes</span>
              </Col>
              <Col>
                <Select
                  placeholder="Filter by fee"
                  style={{ width: 240 }}
                  allowClear
                  value={historyFilter}
                  onChange={(val) => { setHistoryFilter(val); fetchHistory(val); }}
                  showSearch
                  optionFilterProp="children"
                >
                  {uniqueFees.map(f => (
                    <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          }
        >
          <Table
            dataSource={history}
            columns={historyColumns}
            rowKey="id"
            loading={historyLoading}
            size="middle"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description="No pricing history yet" /> }}
          />
        </Card>
      ),
    },
  ];

  return (
    <AdminLayout title="Fee Management">
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

        {/* Title */}
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
            <TagOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Fee Management
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Manage registration, insurance, and other administrative fees
            </div>
          </div>
        </div>

        <Tabs defaultActiveKey="types" items={tabItems} size="large"
          style={{ background: '#fff', borderRadius: 16, padding: '8px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        />
      </div>

      {/* ─── FEE TYPE MODAL ─── */}
      <Modal
        title={
          <span style={{ color: '#1a365d', fontWeight: 700 }}>
            <TagOutlined style={{ marginRight: 8 }} />
            {editingType ? 'Edit Fee Type' : 'New Fee Type'}
          </span>
        }
        open={typeModalOpen}
        onCancel={closeTypeModal}
        onOk={handleSaveType}
        okText={editingType ? 'Save Changes' : 'Create'}
        okButtonProps={{ loading: savingType }}
        width={500}
        destroyOnClose
      >
        <Form form={typeForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Required' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Only uppercase letters, numbers, and underscores' },
            ]}
            extra="A short uppercase identifier, e.g., REGISTRATION, INSURANCE, LOST_ID"
          >
            <Input
              size="large"
              placeholder="e.g., LIBRARY_FINE"
              disabled={!!editingType} // can't change code once created
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Display Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input size="large" placeholder="e.g., Library Fine" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="description" label="Description (optional)">
            <TextArea rows={2} placeholder="What this fee is for" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="charge_basis"
            label="When is this charged?"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select size="large">
              <Select.Option value="per_semester">Per Semester (auto-charged each term)</Select.Option>
              <Select.Option value="one_time">One Time (only on first enrollment)</Select.Option>
              <Select.Option value="on_demand">On Demand (only when requested/needed)</Select.Option>
            </Select>
          </Form.Item>

          {editingType && (
            <Form.Item
              name="is_active"
              label="Active"
              valuePropName="checked"
              extra="Inactive fees are not applied to new bills"
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ─── PRICE MODAL ─── */}
      <Modal
        title={
          <span style={{ color: '#1a365d', fontWeight: 700 }}>
            <DollarOutlined style={{ marginRight: 8 }} />
            {editingPriceFor?.current_amount ? 'Update' : 'Set'} Fee Price
          </span>
        }
        open={priceModalOpen}
        onCancel={closePriceModal}
        onOk={handleSavePrice}
        okText={editingPriceFor?.current_amount ? 'Update Price' : 'Set Price'}
        okButtonProps={{
          loading: savingPrice,
          style: { background: '#276749', borderColor: '#276749' },
        }}
        width={480}
        destroyOnClose
      >
        {editingPriceFor && (
          <>
            <div style={{
              background: '#F8FAFC', padding: 14, borderRadius: 10, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Fee</Text>
                <Text strong style={{ fontSize: 13 }}>
                  <Tag color="blue">{editingPriceFor.code}</Tag> {editingPriceFor.name}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Charge basis</Text>
                <Tag color={CHARGE_BASIS_LABELS[editingPriceFor.charge_basis]?.color}>
                  {CHARGE_BASIS_LABELS[editingPriceFor.charge_basis]?.label}
                </Tag>
              </div>
              {editingPriceFor.current_amount && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Current price</Text>
                  <Text strong style={{ color: '#276749' }}>
                    {formatCurrency(editingPriceFor.current_amount)}
                  </Text>
                </div>
              )}
            </div>

            <Form form={priceForm} layout="vertical" requiredMark={false}>
              <Form.Item
                name="amount"
                label="New Amount"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'number', min: 0, message: 'Must be non-negative' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  step={1}
                  precision={2}
                  prefix="$"
                  placeholder="e.g., 250.00"
                />
              </Form.Item>

              <Form.Item
                name="effective_from"
                label="Effective From"
                rules={[{ required: true, message: 'Required' }]}
                extra="The new amount applies to bills generated on or after this date."
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={(d) => d && d < dayjs().startOf('day')}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </AdminLayout>
  );
}