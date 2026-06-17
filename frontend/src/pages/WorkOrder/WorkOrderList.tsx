import { useState } from 'react'
import { Table, Space, Button, Select, Tag, Modal, Form, Input, message, Card, Descriptions, Timeline, Divider } from 'antd'
import { EyeOutlined, CheckCircleOutlined, ArrowUpOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { WorkOrder, WorkOrderType, WorkOrderPriority, WorkOrderStatus } from '@/types'
import dayjs from 'dayjs'

const WorkOrderList = () => {
  const [data] = useState<WorkOrder[]>([
    { id: 1, orderNo: 'WO20240115001', type: 'maintenance', priority: 'high', status: 'pending', title: '车辆空调故障', description: '京A12345号车辆制冷设备异常，需要紧急检修', vehicleId: 1, vehiclePlate: '京A12345', creator: '调度员小王', createdAt: '2024-01-15 08:30:00', deadline: '2024-01-15 18:00:00', escalationLevel: 1 },
    { id: 2, orderNo: 'WO20240115002', type: 'quality', priority: 'urgent', status: 'processing', title: '货物温度异常', description: '订单ORD20240101001的货物温度超标，需要核查原因', relatedOrderId: 1, relatedOrderNo: 'ORD20240101001', handler: '质检小李', creator: '客户服务', createdAt: '2024-01-15 09:15:00', deadline: '2024-01-15 12:00:00', escalationLevel: 2 },
    { id: 3, orderNo: 'WO20240115003', type: 'customer_service', priority: 'medium', status: 'resolved', title: '客户投诉送达延迟', description: '客户反映订单送达时间比预计晚了2小时', relatedOrderId: 4, relatedOrderNo: 'ORD20240101004', handler: '客服小张', creator: '客户服务', createdAt: '2024-01-14 16:00:00', deadline: '2024-01-15 12:00:00', resolvedAt: '2024-01-15 10:30:00', escalationLevel: 1 },
    { id: 4, orderNo: 'WO20240114004', type: 'maintenance', priority: 'low', status: 'closed', title: '车辆常规保养', description: '京B67890号车辆例行保养', vehicleId: 2, vehiclePlate: '京B67890', handler: '维修组', creator: '车管部', createdAt: '2024-01-14 09:00:00', deadline: '2024-01-16 18:00:00', resolvedAt: '2024-01-14 17:00:00', closedAt: '2024-01-14 17:30:00', escalationLevel: 0 },
    { id: 5, orderNo: 'WO20240115005', type: 'other', priority: 'medium', status: 'pending', title: '系统功能建议', description: '希望增加批量导出功能', creator: '操作员小赵', createdAt: '2024-01-15 10:00:00', deadline: '2024-01-22 18:00:00', escalationLevel: 0 },
  ])

  const [searchForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [processModalVisible, setProcessModalVisible] = useState(false)
  const [escalateModalVisible, setEscalateModalVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<WorkOrder | null>(null)
  const [processForm] = Form.useForm()
  const [escalateForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 5 })

  const typeMap: Record<WorkOrderType, string> = {
    maintenance: '设备维护',
    quality: '质量问题',
    customer_service: '客服工单',
    other: '其他',
  }

  const priorityMap: Record<WorkOrderPriority, { text: string; color: string }> = {
    low: { text: '低', color: 'default' },
    medium: { text: '中', color: 'blue' },
    high: { text: '高', color: 'orange' },
    urgent: { text: '紧急', color: 'red' },
  }

  const statusMap: Record<WorkOrderStatus, { text: string; color: string }> = {
    pending: { text: '待处理', color: 'orange' },
    processing: { text: '处理中', color: 'processing' },
    resolved: { text: '已解决', color: 'success' },
    closed: { text: '已关闭', color: 'default' },
  }

  const mockLogs = [
    { time: '2024-01-15 08:30:00', action: '创建工单', operator: '调度员小王', remark: '车辆制冷设备异常，需要紧急检修' },
    { time: '2024-01-15 08:45:00', action: '分配工单', operator: '工单管理员', remark: '分配给维修组处理' },
    { time: '2024-01-15 09:00:00', action: '开始处理', operator: '维修组', remark: '已联系司机，前往现场检修' },
  ]

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: WorkOrderType) => typeMap[type],
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: WorkOrderPriority) => (
        <Tag color={priorityMap[priority].color}>
          {priorityMap[priority].text}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: WorkOrderStatus) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      render: (handler) => handler || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 160,
      render: (deadline, record) => {
        const isOverdue = dayjs().isAfter(dayjs(deadline)) && record.status !== 'closed' && record.status !== 'resolved'
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {deadline}
          </span>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {(record.status === 'pending' || record.status === 'processing') && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleProcess(record)}>
                处理
              </Button>
              <Button type="link" size="small" icon={<ArrowUpOutlined />} onClick={() => handleEscalate(record)}>
                升级
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const handleDetail = (record: WorkOrder) => {
    setCurrentOrder(record)
    setDetailModalVisible(true)
  }

  const handleProcess = (record: WorkOrder) => {
    setCurrentOrder(record)
    processForm.resetFields()
    setProcessModalVisible(true)
  }

  const handleEscalate = (record: WorkOrder) => {
    setCurrentOrder(record)
    escalateForm.resetFields()
    setEscalateModalVisible(true)
  }

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  const handleReset = () => {
    searchForm.resetFields()
  }

  const submitProcess = () => {
    processForm.validateFields().then(() => {
      message.success('提交成功')
      setProcessModalVisible(false)
    })
  }

  const submitEscalate = () => {
    escalateForm.validateFields().then(() => {
      message.success('工单已升级')
      setEscalateModalVisible(false)
    })
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="type" label="类型">
            <Select placeholder="请选择类型" style={{ width: 130 }} allowClear>
              <Select.Option value="maintenance">设备维护</Select.Option>
              <Select.Option value="quality">质量问题</Select.Option>
              <Select.Option value="customer_service">客服工单</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="processing">处理中</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
              <Select.Option value="closed">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="请选择优先级" style={{ width: 120 }} allowClear>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
      />

      <Modal
        title="工单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {currentOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="工单号">{currentOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentOrder.status].color}>
                  {statusMap[currentOrder.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="类型">{typeMap[currentOrder.type]}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityMap[currentOrder.priority].color}>
                  {priorityMap[currentOrder.priority].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{currentOrder.title}</Descriptions.Item>
              <Descriptions.Item label="关联订单">{currentOrder.relatedOrderNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联车辆">{currentOrder.vehiclePlate || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{currentOrder.creator}</Descriptions.Item>
              <Descriptions.Item label="处理人">{currentOrder.handler || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentOrder.createdAt}</Descriptions.Item>
              <Descriptions.Item label="截止时间">{currentOrder.deadline}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{currentOrder.description}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ marginTop: 20 }}>处理记录</Divider>
            <Timeline
              items={mockLogs.map(log => ({
                color: 'blue',
                children: (
                  <div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{log.action}</p>
                    <p style={{ margin: '4px 0', fontSize: 12, color: '#999' }}>操作人：{log.operator} | {log.time}</p>
                    {log.remark && <p style={{ margin: 0, fontSize: 13 }}>{log.remark}</p>}
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="处理工单"
        open={processModalVisible}
        onCancel={() => setProcessModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setProcessModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={submitProcess}>提交</Button>,
        ]}
      >
        {currentOrder && (
          <p style={{ marginBottom: 16 }}>
            工单：<strong>{currentOrder.title}</strong>（{currentOrder.orderNo}）
          </p>
        )}
        <Form form={processForm} layout="vertical">
          <Form.Item name="remark" label="处理说明" rules={[{ required: true, message: '请输入处理说明' }]}>
            <Input.TextArea rows={4} placeholder="请输入处理说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="升级工单"
        open={escalateModalVisible}
        onCancel={() => setEscalateModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEscalateModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" danger onClick={submitEscalate}>确认升级</Button>,
        ]}
      >
        {currentOrder && (
          <p style={{ marginBottom: 16 }}>
            工单：<strong>{currentOrder.title}</strong>（{currentOrder.orderNo}）
          </p>
        )}
        <Form form={escalateForm} layout="vertical">
          <Form.Item name="reason" label="升级原因" rules={[{ required: true, message: '请输入升级原因' }]}>
            <Input.TextArea rows={4} placeholder="请输入升级原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WorkOrderList
