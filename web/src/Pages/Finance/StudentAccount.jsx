import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Tag, Spin, Empty, Button,
  Descriptions, Divider, Alert, Tooltip, Modal, Form, 
  InputNumber, Select, DatePicker, Input, message,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, MailOutlined, BookOutlined,
  CalendarOutlined, IdcardOutlined, BankOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  DollarOutlined, PercentageOutlined, FileTextOutlined,
  GiftOutlined, EnvironmentOutlined, UpOutlined, DownOutlined,
  PhoneOutlined, CreditCardOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import FinanceLayout from '../../Components/FinanceLayout';
import api from '../../config/api';

const { Text, Title } = Typography;

const STATUS_STYLES = {
  paid:    { color: 'green',  label: 'Paid' },
  pending: { color: 'orange', label: 'Pending' },
  overdue: { color: 'red',    label: 'Overdue' },
  partial: { color: 'blue',   label: 'Partial' },
};

export default function StudentAccount() {
  const navigate = useNavigate();
  const { student_id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    fetchAccount();
  }, [student_id]);

  const fetchAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/finance/students/${student_id}/account`);
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load account');
      }
    } catch (err) {
      console.error('Failed to load student account:', err);
      setError(err.response?.data?.message || 'Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tuition': return <BookOutlined />;
      case 'tuition_installment': return <BookOutlined />;
      case 'registration': return <FileTextOutlined />;
      case 'insurance': return <CheckCircleOutlined />;
      case 'lost_id': return <IdcardOutlined />;
      case 'late_payment': return <WarningOutlined />;
      default: return <DollarOutlined />;
    }
  };

  const StatusTag = ({ status }) => {
    const config = STATUS_STYLES[status] || STATUS_STYLES.pending;
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const openPaymentModal = (transaction) => {
    setSelectedTransaction(transaction);
    paymentForm.setFieldsValue({
      amount: transaction.amount_remaining,
      payment_method: 'cash',
      payment_date: dayjs(),
      notes: '',
    });
    setPaymentModalOpen(true);
  };
  
  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedTransaction(null);
    paymentForm.resetFields();
  };
  
  const handlePaymentSubmit = async () => {
    try {
      const values = await paymentForm.validateFields();
      setSubmitting(true);
  
      const payload = {
        transaction_id: selectedTransaction.id,
        amount: values.amount,
        payment_method: values.payment_method,
        payment_date: values.payment_date.format('YYYY-MM-DD'),
        notes: values.notes || null,
      };
  
      const res = await api.post('/api/finance/payments/record', payload);
  
      if (res.data.success) {
        const { reference_number, new_status, remaining_balance } = res.data.data;
  
        message.success({
          content: (
            <span>
              Payment recorded as <strong>{reference_number}</strong>
              {remaining_balance > 0 && ` · ${formatCurrency(remaining_balance)} still owed`}
            </span>
          ),
          duration: 4,
        });
  
        closePaymentModal();
        fetchAccount(); // refresh the account data
      } else {
        message.error(res.data.message || 'Failed to record payment');
      }
    } catch (err) {
      if (err.errorFields) {
        // Form validation error — handled by antd already
        return;
      }
      console.error('Record payment error:', err);
      message.error(
        err.response?.data?.message || 'Failed to record payment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FinanceLayout title="Student Account">
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      </FinanceLayout>
    );
  }

  if (error || !data) {
    return (
      <FinanceLayout title="Student Account">
        <Card style={{ borderRadius: 16, border: 'none' }}>
          <Alert
            message="Could not load student account"
            description={error || 'Unknown error'}
            type="error"
            showIcon
            action={
              <Button onClick={() => navigate('/finance/student-summary')}>
                Back to Search
              </Button>
            }
          />
        </Card>
      </FinanceLayout>
    );
  }

  const { student, discounts, semesters, grand_totals } = data;
  const activeDiscounts = (discounts || []).filter(d => d.status === 'active');

  return (
    <FinanceLayout title="Student Account">

      {/* Back button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/finance/student-summary')}
        style={{ marginBottom: 16, color: '#64748B' }}
      >
        Back to Search
      </Button>

      {/* Student header card */}
      <Card style={{
        borderRadius: 16,
        border: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: 20,
        background: 'linear-gradient(135deg, #1a365d 0%, #276749 100%)',
      }}>
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, color: '#fff', fontWeight: 800,
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                {student.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                  Student Account
                </div>
                <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
                  {student.name}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Tag color="blue" style={{ margin: 0 }}>{student.id}</Tag>
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                    {student.major_name}
                  </Text>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, textTransform: 'uppercase' }}>
              Outstanding Balance
            </div>
            <div style={{ 
              color: grand_totals.total_outstanding > 0 ? '#FED7D7' : '#C6F6D5', 
              fontSize: 28, 
              fontWeight: 800, 
            }}>
              {formatCurrency(grand_totals.total_outstanding)}
            </div>
            {grand_totals.total_overdue > 0 && (
              <Tag color="red" icon={<WarningOutlined />} style={{ marginTop: 4 }}>
                {formatCurrency(grand_totals.total_overdue)} overdue
              </Tag>
            )}
          </Col>
        </Row>
      </Card>

      {/* Student details + Summary stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Student details */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <span style={{ color: '#1a365d', fontWeight: 700, fontSize: 14 }}>
                <UserOutlined style={{ marginRight: 8 }} /> Student Details
              </span>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" labelStyle={{ color: '#64748B' }}>
              <Descriptions.Item label={<><MailOutlined /> Email</>}>
                {student.email || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                {student.phone || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<><BookOutlined /> Major</>}>
                {student.major_name || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<><BankOutlined /> Department</>}>
                {student.department_name || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> Enrolled</>}>
                {formatDate(student.enrollment_date)}
              </Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> Campus</>}>
                {student.campus || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<><PercentageOutlined /> GPA</>}>
                <Tag color="blue">{Number(student.gpa || 0).toFixed(2)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Completed Credits">
                <Tag color="green">{student.completed_credits || 0}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Account summary */}
        <Col xs={24} lg={10}>
          <Card 
            title={
              <span style={{ color: '#1a365d', fontWeight: 700, fontSize: 14 }}>
                <DollarOutlined style={{ marginRight: 8 }} /> Account Summary
              </span>
            }
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SummaryRow 
                label="Total Charged" 
                value={formatCurrency(grand_totals.total_charged)} 
                color="#1a365d"
              />
              {grand_totals.total_discount > 0 && (
                <SummaryRow 
                  label="Discounts Applied" 
                  value={`-${formatCurrency(grand_totals.total_discount)}`} 
                  color="#2f855a"
                  icon={<GiftOutlined />}
                />
              )}
              <SummaryRow 
                label="Total Paid" 
                value={formatCurrency(grand_totals.total_paid)} 
                color="#2f855a"
                icon={<CheckCircleOutlined />}
              />
              <Divider style={{ margin: '4px 0' }} />
              <SummaryRow 
                label="Outstanding" 
                value={formatCurrency(grand_totals.total_outstanding)} 
                color={grand_totals.total_outstanding > 0 ? '#c53030' : '#2f855a'}
                bold
                large
              />
              {grand_totals.total_overdue > 0 && (
                <div style={{
                  background: '#FED7D7', borderRadius: 8, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <WarningOutlined style={{ color: '#C53030' }} />
                  <Text style={{ color: '#742A2A', fontSize: 12, fontWeight: 600 }}>
                    {formatCurrency(grand_totals.total_overdue)} overdue
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Active discounts */}
      {activeDiscounts.length > 0 && (
        <Card
          title={
            <span style={{ color: '#1a365d', fontWeight: 700, fontSize: 14 }}>
              <GiftOutlined style={{ marginRight: 8 }} /> Active Discounts
            </span>
          }
          style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}
        >
          <Row gutter={[12, 12]}>
            {activeDiscounts.map((d) => (
              <Col xs={24} sm={12} lg={8} key={d.id}>
                <div style={{
                  padding: 14, borderRadius: 12,
                  background: '#F0FFF4', border: '1px solid #C6F6D5',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text strong style={{ color: '#22543D', fontSize: 13 }}>
                      {d.type_name}
                    </Text>
                    <Tag color="green" style={{ margin: 0 }}>
                      {d.calculation === 'percentage' 
                        ? `${Number(d.percentage).toFixed(0)}%`
                        : formatCurrency(d.fixed_amount)
                      }
                    </Tag>
                  </div>
                  <div style={{ color: '#276749', fontSize: 11, marginTop: 6 }}>
                    {d.scope === 'semester' 
                      ? (d.semester_name || 'Semester')
                      : `Academic Year ${d.academic_year}`
                    }
                  </div>
                  {d.reason && (
                    <Tooltip title={d.reason}>
                      <div style={{ color: '#4A5568', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                        "{d.reason.length > 40 ? d.reason.substring(0, 40) + '...' : d.reason}"
                      </div>
                    </Tooltip>
                  )}
                  {d.approver_name && (
                    <div style={{ color: '#A0AEC0', fontSize: 10, marginTop: 4 }}>
                      Approved by {d.approver_name}
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Transactions by semester */}
      {semesters.length === 0 ? (
        <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Empty description={
            <Text style={{ color: '#94A3B8' }}>
              No financial transactions recorded for this student
            </Text>
          } />
        </Card>
      ) : (
        semesters.map((semester) => (
          <Card
            key={semester.semester_id || 'general'}
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#1a365d', fontWeight: 700, fontSize: 14 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  {semester.semester_name}
                </span>
                {semester.academic_year && (
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600 }}>
                    {semester.academic_year}
                  </Text>
                )}
              </div>
            }
          >
            {/* Per-semester totals strip */}
            <div style={{ 
              display: 'flex', gap: 16, padding: '10px 14px', 
              background: '#F8FAFC', borderRadius: 10, marginBottom: 14,
              flexWrap: 'wrap',
            }}>
              <MiniStat label="Charged" value={formatCurrency(semester.totals.total_charged)} />
              {semester.totals.total_discount > 0 && (
                <MiniStat 
                  label="Discount" 
                  value={`-${formatCurrency(semester.totals.total_discount)}`} 
                  color="#2f855a" 
                />
              )}
              <MiniStat 
                label="Paid" 
                value={formatCurrency(semester.totals.total_paid)} 
                color="#2f855a"
              />
              <MiniStat 
                label="Outstanding" 
                value={formatCurrency(semester.totals.total_outstanding)} 
                color={semester.totals.total_outstanding > 0 ? '#c53030' : '#2f855a'}
                bold
              />
              {semester.totals.total_overdue > 0 && (
                <MiniStat 
                  label="Overdue" 
                  value={formatCurrency(semester.totals.total_overdue)} 
                  color="#c53030"
                  bold
                />
              )}
            </div>

            {/* Items list */}
            {semester.items.map((item) => {
              const isExpanded = expandedItems[item.id] || false;
              const hasDiscount = item.discount_amount > 0;

              return (
                <div 
                  key={item.id} 
                  style={{
                    border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 10,
                  }}
                >
                  <div 
                    onClick={() => item.has_installments && toggleExpand(item.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', cursor: item.has_installments ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: '#EFF6FF', color: '#2b6cb0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                      }}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ color: '#1a365d', fontSize: 14 }}>
                          {item.description}
                        </Text>
                        <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>
                          {item.has_installments
                            ? `${item.installments.length} installments`
                            : `Due ${formatDate(item.due_date)}`
                          }
                        </div>
                        {hasDiscount && (
                          <div style={{ color: '#2f855a', fontSize: 11, marginTop: 4 }}>
                            <GiftOutlined style={{ marginRight: 4 }} />
                            Original {formatCurrency(item.original_amount)} · Saved {formatCurrency(item.discount_amount)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#2b6cb0' }}>
                        {formatCurrency(item.amount)}
                      </div>
                      {!item.has_installments && <StatusTag status={item.status} />}
                      {item.has_installments && (
                        <div style={{ marginTop: 4, color: '#64748B', fontSize: 12 }}>
                          {isExpanded ? <UpOutlined /> : <DownOutlined />}
                        </div>
                      )}
                      {!item.has_installments && item.status !== 'paid' && item.amount_remaining > 0 && (
                        <Button 
                          type="primary" 
                          size="small"
                          icon={<CreditCardOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openPaymentModal(item);
                          }}
                          style={{ marginTop: 8, background: '#276749', borderColor: '#276749' }}
                        >
                          Record Payment
                        </Button>
                      )}
                    </div>

                  {/* Expanded installments */}
                  {item.has_installments && isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #E2E8F0' }}>
                      {item.installments.map((inst) => (
                        <div 
                          key={inst.id}
                          style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', padding: '10px 0',
                            borderBottom: '1px solid #F7FAFC',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 14,
                              background: '#EBF8FF', color: '#2b6cb0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: 12,
                            }}>
                              {inst.installment_number}
                            </div>
                            <div>
                              <Text style={{ fontSize: 13, fontWeight: 600, color: '#1a365d' }}>
                                Installment {inst.installment_number} of {inst.total_installments}
                              </Text>
                              <div style={{ color: '#64748B', fontSize: 11 }}>
                                Due {formatDate(inst.due_date)}
                                {inst.payment_date && ` · Paid ${formatDate(inst.payment_date)}`}
                              </div>
                              {inst.amount_paid > 0 && inst.status !== 'paid' && (
                                <div style={{ color: '#2c5282', fontSize: 11, fontStyle: 'italic' }}>
                                  {formatCurrency(inst.amount_paid)} of {formatCurrency(inst.amount)} paid
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 130 }}>
                            <div style={{ fontWeight: 700, color: '#1a365d' }}>
                              {formatCurrency(inst.amount)}
                            </div>
                            <StatusTag status={inst.status} />
                            {inst.status !== 'paid' && inst.amount_remaining > 0 && (
                              <Button 
                                type="primary" 
                                size="small"
                                icon={<CreditCardOutlined />}
                                onClick={() => openPaymentModal(inst)}
                                style={{ marginTop: 6, background: '#276749', borderColor: '#276749' }}
                              >
                                Pay
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </div>
              );
            })}
          </Card>
        ))
      )}

    {/* RECORD PAYMENT MODAL */}
    <Modal
      title={
        <span style={{ color: '#1a365d', fontWeight: 700 }}>
          <CreditCardOutlined style={{ marginRight: 8 }} />
          Record Payment
        </span>
      }
      open={paymentModalOpen}
      onCancel={closePaymentModal}
      onOk={handlePaymentSubmit}
      okText="Confirm Payment"
      okButtonProps={{ 
        loading: submitting, 
        style: { background: '#276749', borderColor: '#276749' } 
      }}
      width={520}
      destroyOnClose
    >
      {selectedTransaction && (
        <>
          {/* Transaction summary box */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: 10,
            padding: 14,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Student</Text>
              <Text strong style={{ fontSize: 12 }}>
                {student?.name} ({student?.id})
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Description</Text>
              <Text strong style={{ fontSize: 12 }}>
                {selectedTransaction.installment_number
                  ? `Installment ${selectedTransaction.installment_number} of ${selectedTransaction.total_installments}`
                  : selectedTransaction.description}
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Total Amount</Text>
              <Text strong style={{ fontSize: 12 }}>
                {formatCurrency(selectedTransaction.amount)}
              </Text>
            </div>
            {selectedTransaction.amount_paid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Already Paid</Text>
                <Text strong style={{ fontSize: 12, color: '#2f855a' }}>
                  {formatCurrency(selectedTransaction.amount_paid)}
                </Text>
              </div>
            )}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong style={{ color: '#c53030', fontSize: 13 }}>Remaining Balance</Text>
              <Text strong style={{ color: '#c53030', fontSize: 15 }}>
                {formatCurrency(selectedTransaction.amount_remaining)}
              </Text>
            </div>
          </div>

          {/* Payment form */}
          <Form
            form={paymentForm}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="amount"
              label="Amount Paid"
              rules={[
                { required: true, message: 'Please enter an amount' },
                { 
                  validator: (_, value) => {
                    if (value <= 0) return Promise.reject('Amount must be positive');
                    if (value > selectedTransaction.amount_remaining) {
                      return Promise.reject(
                        `Cannot exceed remaining balance (${formatCurrency(selectedTransaction.amount_remaining)})`
                      );
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0.01}
                max={selectedTransaction.amount_remaining}
                step={0.01}
                precision={2}
                prefix="$"
                size="large"
                placeholder="0.00"
              />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="payment_method"
                  label="Payment Method"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select size="large">
                    <Select.Option value="cash">Cash</Select.Option>
                    <Select.Option value="card">Card</Select.Option>
                    <Select.Option value="check">Check</Select.Option>
                    <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
                    <Select.Option value="other">Other</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="payment_date"
                  label="Payment Date"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    size="large"
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label="Notes (optional)"
            >
              <Input.TextArea 
                rows={2} 
                placeholder="e.g., Check #1234, transaction reference, etc."
              />
            </Form.Item>

            <Alert
              message="A unique reference number will be generated automatically"
              type="info"
              showIcon
              style={{ marginTop: 8 }}
            />
          </Form>
        </>
      )}
    </Modal>
    </FinanceLayout>
  );
}

// Small reusable summary row component
function SummaryRow({ label, value, color, bold, large, icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: '#64748B', fontSize: bold ? 14 : 13 }}>
        {icon && <span style={{ marginRight: 6, color }}>{icon}</span>}
        {label}
      </Text>
      <Text style={{ 
        color: color || '#1a365d', 
        fontSize: large ? 18 : 14, 
        fontWeight: bold ? 800 : 600 
      }}>
        {value}
      </Text>
    </div>
  );
}

// Small reusable stat for the semester totals strip
function MiniStat({ label, value, color = '#1a365d', bold }) {
  return (
    <div>
      <div style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ color, fontSize: 14, fontWeight: bold ? 800 : 600 }}>
        {value}
      </div>
    </div>
  );
}