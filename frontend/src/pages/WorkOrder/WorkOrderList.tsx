import { useState, useEffect, useCallback } from 'react'
import { Table, Space, Button, Select, Tag, Modal, Form, Input, message, Card, Descriptions, Timeline, Divider } from 'antd'
import { EyeOutlined, CheckCircleOutlined, ArrowUpOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { WorkOrder, WorkOrderType, WorkOrderPriority, WorkOrderStatus, WorkOrderSearchParams, WorkOrderLog } from '@/types'
import { getWorkOrderList, getWorkOrderById, getWorkOrderLogs, processWorkOrder, escalateWorkOrder } from '@/api/workOrder'
import dayjs from 'dayjs'

const WorkOrderList = () => {
  const [data, setData] = useState<WorkOrder[]>([])
  const [searchForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [processModalVisible, setProcessModalVisible] = useState(false)
  const [escalateModalVisible, setEscalateModalVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<WorkOrder | null>(null)
  const [workOrderLogs, setWorkOrderLogs] = useState<WorkOrderLog[]>([])
  const [processForm] = Form.useForm()
  const [escalateForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchParams, setSearchParams] = useState<WorkOrderSearchParams>({})

  const typeMap: Record<WorkOrderType, string> = {
    TEMPERATURE_ALERT: '温度告警',
    REVIEW: '复核工单',
    AUDIT: '审核工单',
  }

  const priorityMap: Record<WorkOrderPriority, { text: string; color: string }> = {
    INFO: { text: '提示', color: 'default' },
    WARNING: { text: '警告', color: 'blue' },
    CRITICAL: { text: '严重', color: 'orange' },
    EMERGENCY: { text: '紧急', color: 'red' },
  }

  const statusMap: Record<WorkOrderStatus, { text: string; color: string }> = {
    PENDING: { text: '待处理', color: 'orange' },
    ASSIGNED: { text: '已分配', color: 'blue' },
    PROCESSING: { text: '处理中', color: 'processing' },
    RESOLVED: { text: '已解决', color: 'success' },
    ESCALATED: { text: '已升级', color: 'warning' },
    CLOSED: { text: '已关闭', color: 'default' },
  }

  const fetchData = useCallback(async (params?: WorkOrderSearchParams) => {
    setLoading(true)
    try {
      const finalParams: WorkOrderSearchParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchParams,
        ...params,
      }
      const res = await getWorkOrderList(finalParams)
      if (res.code === 0 || res.code === 200) {
        setData(res.data.data)
        setPagination(prev => ({
          ...prev,
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        }))
      }
    } catch (error) {
      console.error('获取工单列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize, searchParams])

  useEffect(() => {
    fetchData()
  }, [])

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      key: 'workOrderNo',
      width: 160,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: WorkOrderType) => typeMap[type] || type,
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
      width: 90,
      render: (priority: WorkOrderPriority) => (
        <Tag color={priorityMap[priority]?.color || 'default'}>
          {priorityMap[priority]?.text || priority}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WorkOrderStatus) => (
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: '处理人',
      key: 'assignee',
      width: 100,
      render: (_, record) => record.assigneeName || '-',
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 170,
      render: (deadline, record) => {
        if (!deadline) return '-'
        const isOverdue = dayjs().isAfter(dayjs(deadline)) && record.status !== 'CLOSED' && record.status !== 'RESOLVED'
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
          {(record.status === 'PENDING' || record.status === 'ASSIGNED' || record.status === 'PROCESSING') && (
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

  const handleDetail = async (record: WorkOrder) => {
    try {
      const res = await getWorkOrderById(record.id)
      if (res.code === 0 || res.code === 200) {
        setCurrentOrder(res.data)
      } else {
        setCurrentOrder(record)
      }
    } catch (error) {
      setCurrentOrder(record)
    }
    try {
      const logRes = await getWorkOrderLogs(record.id)
      if (logRes.code === 0 || logRes.code === 200) {
        setWorkOrderLogs(logRes.data)
      } else {
        setWorkOrderLogs([])
      }
    } catch (error) {
      setWorkOrderLogs([])
    }
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
    const values = searchForm.getFieldsValue()
    const params: WorkOrderSearchParams = {}
    if (values.type) params.type = values.type
    if (values.status) params.status = values.status
    if (values.priority) params.priority = values.priority
    setSearchParams(params)
    setPagination(prev => ({ ...prev, current: 1 }))
    fetchData({ ...params, page: 1 })
  }

  const handleReset = () => {
    searchForm.resetFields()
    setSearchParams({})
    setPagination(prev => ({ ...prev, current: 1 }))
    fetchData({ page: 1 })
  }

  const submitProcess = async () => {
    if (!currentOrder) return
    try {
      const values = await processForm.validateFields()
      const res = await processWorkOrder(currentOrder.id, { remark: values.remark, status: 'RESOLVED' })
      if (res.code === 0 || res.code === 200) {
        message.success('提交成功')
        setProcessModalVisible(false)
        fetchData()
      }
    } catch (error) {
      if (error !== false) {
        console.error('处理工单失败:', error)
      }
    }
  }

  const submitEscalate = async () => {
    if (!currentOrder) return
    try {
      const values = await escalateForm.validateFields()
      const res = await escalateWorkOrder(currentOrder.id, { remark: values.reason })
      if (res.code === 0 || res.code === 200) {
        message.success('工单已升级')
        setEscalateModalVisible(false)
        fetchData()
      }
    } catch (error) {
      if (error !== false) {
        console.error('升级工单失败:', error)
      }
    }
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }))
    fetchData({ page, pageSize })
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="type" label="类型">
            <Select placeholder="请选择类型" style={{ width: 130 }} allowClear>
              <Select.Option value="TEMPERATURE_ALERT">温度告警</Select.Option>
              <Select.Option value="REVIEW">复核工单</Select.Option>
              <Select.Option value="AUDIT">审核工单</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Select.Option value="PENDING">待处理</Select.Option>
              <Select.Option value="ASSIGNED">已分配</Select.Option>
              <Select.Option value="PROCESSING">处理中</Select.Option>
              <Select.Option value="RESOLVED">已解决</Select.Option>
              <Select.Option value="ESCALATED">已升级</Select.Option>
              <Select.Option value="CLOSED">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="请选择优先级" style={{ width: 120 }} allowClear>
              <Select.Option value="INFO">提示</Select.Option>
              <Select.Option value="WARNING">警告</Select.Option>
              <Select.Option value="CRITICAL">严重</Select.Option>
              <Select.Option value="EMERGENCY">紧急</Select.Option>
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
        scroll={{ x: 1400 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          onChange: handleTableChange,
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
              <Descriptions.Item label="工单号">{currentOrder.workOrderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentOrder.status]?.color || 'default'}>
                  {statusMap[currentOrder.status]?.text || currentOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="类型">{typeMap[currentOrder.type] || currentOrder.type}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityMap[currentOrder.priority]?.color || 'default'}>
                  {priorityMap[currentOrder.priority]?.text || currentOrder.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{currentOrder.title}</Descriptions.Item>
              <Descriptions.Item label="关联订单">{currentOrder.relatedOrderNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联车辆">{currentOrder.vehiclePlate || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{currentOrder.creatorName}</Descriptions.Item>
              <Descriptions.Item label="处理人">{currentOrder.assigneeName || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentOrder.createdAt}</Descriptions.Item>
              <Descriptions.Item label="截止时间">{currentOrder.deadline || '-'}</Descriptions.Item>
              {currentOrder.resolvedAt && (
                <Descriptions.Item label="解决时间">{currentOrder.resolvedAt}</Descriptions.Item>
              )}
              {currentOrder.closedAt && (
                <Descriptions.Item label="关闭时间">{currentOrder.closedAt}</Descriptions.Item>
              )}
              <Descriptions.Item label="升级等级">{currentOrder.escalationLevel}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{currentOrder.description}</Descriptions.Item>
              {currentOrder.remark && (
                <Descriptions.Item label="备注" span={2}>{currentOrder.remark}</Descriptions.Item>
              )}
            </Descriptions>

            {workOrderLogs.length > 0 && (
              <>
                <Divider orientation="left" style={{ marginTop: 20 }}>处理记录</Divider>
                <Timeline
                  items={workOrderLogs.map(log => ({
                    color: 'blue',
                    children: (
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>{log.action}</p>
                        <p style={{ margin: '4px 0', fontSize: 12, color: '#999' }}>操作人：{log.operatorName} | {log.timestamp}</p>
                        {log.remark && <p style={{ margin: 0, fontSize: 13 }}>{log.remark}</p>}
                      </div>
                    ),
                  }))}
                />
              </>
            )}
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
            工单：<strong>{currentOrder.title}</strong>（{currentOrder.workOrderNo}）
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
            工单：<strong>{currentOrder.title}</strong>（{currentOrder.workOrderNo}）
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
