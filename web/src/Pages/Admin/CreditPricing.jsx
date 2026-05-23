import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Typography, Row, Col,
  Modal, Form, InputNumber, DatePicker, Select,
  message, Alert, Tooltip, Empty, Tabs,
} from 'antd';
import {
  DollarOutlined, EditOutlined, HistoryOutlined,
  PlusOutlined, CheckCircleOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;

export default function CreditPricing() {
  const navigate = useNavigate();

  const [currentPrices, setCurrentPrices] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // History filter
  const [historyFilter, setHistoryFilter] = useState(null);

  useEffect(() => {
    fetchCurrentPrices();
    fetchHistory();
  }, []);

  const fetchCurrentPrices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/credit-pricing/current');
      if (res.data.success) {
        setCurrentPrices(res.data.data);
      }
    } catch (err) {
      message.error('Failed to load current credit prices');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (majorId = null) => {
    setHistoryLoading(true);
    try {
      const url = majorId
        ? `/api/admin/credit-pricing/history?major_id=${majorId}`
        : `/api/admin/credit-pricing/history`;
      const res = await api.get(url);
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      message.error('Failed to load pricing history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEditModal = (major) => {
    setEditingMajor(major);
    form.setFieldsValue({
      price_per_credit: null, // empty for new price
      effective_from: dayjs(),
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingMajor(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await api.put('/api/admin/credit-pricing', {
        major_id: editingMajor.major_id,
        price_per_credit: values.price_per_credit,
        effective_from: values.effective_from.format('YYYY-MM-DD'),
      });

      if (res.data.success) {
        message.success(`Credit price updated for ${editingMajor.major_name}`);
        closeEditModal();
        fetchCurrentPrices();
        fetchHistory(historyFilter);
      } else {
        message.error(res.data.message || 'Update failed');
      }
    } catch (err) {
      if (err.errorFields) return; // form validation
      message.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (v) => 
    v === null || v === undefined 
      ? <Text type="secondary">Not set</Text>
      : `$${Number(v).toFixed(2)}`;

  const formatDate = (d) => 
    d ? new Date(d).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    }) : '—';

  const currentColumns = [
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department_name',
      render: v => <Text type="secondary" style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
    {
      title: 'Major',
      dataIndex: 'major_name',
      key: 'major_name',
      render: v => <Text strong style={{ color: '#1a365d' }}>{v}</Text>,
    },
    {
      title: 'Degree',
      dataIndex: 'degree_type',
      key: 'degree_type',
      render: v => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Price per Credit',
      dataIndex: 'price_per_credit',
      key: 'price_per_credit',
      align: 'right',
      render: v => (
        <Text strong style={{ fontSize: 15, color: v ? '#276749' : '#94A3B8' }}>
          {formatCurrency(v)}
        </Text>
      ),
    },
    {
      title: 'Effective Since',
      dataIndex: 'effective_from',
      key: 'effective_from',
      render: v => (
        <Text style={{ fontSize: 12 }}>{formatDate(v)}</Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 130,
      render: (_, row) => (
        <Button
          type="primary"
          size="small"
          icon={row.price_per_credit ? <EditOutlined /> : <PlusOutlined />}
          onClick={() => openEditModal(row)}
          style={{ background: '#276749', borderColor: '#276749' }}
        >
          {row.price_per_credit ? 'Update' : 'Set'}
        </Button>
      ),
    },
  ];

  const historyColumns = [
    {
      title: 'Major',
      dataIndex: 'major_name',
      key: 'major_name',
      render: v => <Text strong>{v}</Text>,
    },
    {
      title: 'Price per Credit',
      dataIndex: 'price_per_credit',
      key: 'price_per_credit',
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

  // Get unique majors from history for the filter dropdown
  const uniqueMajors = [...new Map(
    history.map(h => [h.major_id, { id: h.major_id, name: h.major_name }])
  ).values()];

  const tabItems = [
    {
      key: 'current',
      label: <span><DollarOutlined /> Current Prices</span>,
      children: (
        <Card
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <Alert
            message="How pricing works"
            description={
              <span>
                When you update a price, the previous one is automatically archived (you can view past prices in the History tab).
                This preserves accuracy of bills that were already generated with the old price.
              </span>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />

          <Table
            dataSource={currentPrices}
            columns={currentColumns}
            rowKey="major_id"
            loading={loading}
            size="middle"
            pagination={false}
            locale={{ emptyText: 'No majors found' }}
          />
        </Card>
      ),
    },
    {
      key: 'history',
      label: <span><HistoryOutlined /> Price History</span>,
      children: (
        <Card
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <span style={{ color: '#1a365d', fontWeight: 700 }}>
                  All Pricing Changes
                </span>
              </Col>
              <Col>
                <Select
                  placeholder="Filter by major"
                  style={{ width: 220 }}
                  allowClear
                  value={historyFilter}
                  onChange={(val) => {
                    setHistoryFilter(val);
                    fetchHistory(val);
                  }}
                  showSearch
                  optionFilterProp="children"
                >
                  {uniqueMajors.map(m => (
                    <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          }
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
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
    <AdminLayout title="Credit Pricing">
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

        {/* Title card */}
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
            <DollarOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Credit Pricing
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Set the per-credit tuition rate for each major
            </div>
          </div>
        </div>

        <Tabs
          defaultActiveKey="current"
          items={tabItems}
          size="large"
          style={{ background: '#fff', borderRadius: 16, padding: '8px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        />
      </div>

      {/* EDIT MODAL */}
      <Modal
        title={
          <span style={{ color: '#1a365d', fontWeight: 700 }}>
            <DollarOutlined style={{ marginRight: 8 }} />
            {editingMajor?.price_per_credit ? 'Update' : 'Set'} Credit Price
          </span>
        }
        open={editModalOpen}
        onCancel={closeEditModal}
        onOk={handleSave}
        okText={editingMajor?.price_per_credit ? 'Update Price' : 'Set Price'}
        okButtonProps={{
          loading: saving,
          style: { background: '#276749', borderColor: '#276749' },
        }}
        width={480}
        destroyOnClose
      >
        {editingMajor && (
          <>
            {/* Major info box */}
            <div style={{
              background: '#F8FAFC', padding: 14, borderRadius: 10, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Major</Text>
                <Text strong style={{ fontSize: 13 }}>{editingMajor.major_name}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Department</Text>
                <Text style={{ fontSize: 13 }}>{editingMajor.department_name || '—'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Degree</Text>
                <Tag color="blue">{editingMajor.degree_type}</Tag>
              </div>
              {editingMajor.price_per_credit && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Current Price</Text>
                  <Text strong style={{ color: '#276749' }}>
                    {formatCurrency(editingMajor.price_per_credit)}
                  </Text>
                </div>
              )}
            </div>

            <Form form={form} layout="vertical" requiredMark={false}>
              <Form.Item
                name="price_per_credit"
                label="New Price per Credit"
                rules={[
                  { required: true, message: 'Please enter a price' },
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
                  placeholder="e.g., 230.00"
                />
              </Form.Item>

              <Form.Item
                name="effective_from"
                label="Effective From"
                rules={[{ required: true, message: 'Required' }]}
                extra="The new price applies to bills generated on or after this date."
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