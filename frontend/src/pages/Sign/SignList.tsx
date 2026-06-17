import { useState, useEffect, useCallback } from 'react'
import { Table, Space, Button, Input, Select, Tag, Modal, Descriptions, Card, DatePicker, Form, Alert, InputNumber, message } from 'antd'
import { SearchOutlined, EyeOutlined, QrcodeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { SignRecord, SignStatus, SignSearchParams, SignCreateData } from '@/types'
import { getSignList, getSignById, createSign } from '@/api/sign'
import { getOrderList, getOrderById } from '@/api/order'
import type { Order } from '@/types'

const { RangePicker } = DatePicker

const SignList = () => {
  const [data, setData] = useState<SignRecord[]>([])
  const [searchForm] = Form.useForm()
  const [signForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [signModalVisible, setSignModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<SignRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchParams, setSearchParams] = useState<SignSearchParams>({})
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [expectedQuantity, setExpectedQuantity] = useState<number | null>(null)

  const statusMap: Record<SignStatus, { text: string; color: string }> = {
    PENDING: { text: '待签收', color: 'orange' },
    SIGNED: { text: '已签收', color: 'green' },
    DISPUTED: { text: '有争议', color: 'red' },
  }

  const fetchData = useCallback(async (params?: SignSearchParams) => {
    setLoading(true)
    try {
      const finalParams: SignSearchParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchParams,
        ...params,
      }
      const res = await getSignList(finalParams)
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
      console.error('获取签收列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize, searchParams])

  useEffect(() => {
    fetchData()
  }, [])

  const columns: ColumnsType<SignRecord> = [
    {
      title: '订单号',
      key: 'orderNo',
      width: 160,
      render: (_, record) => record.order?.orderNo || '-',
    },
    {
      title: '客户',
      key: 'customer',
      width: 120,
      render: (_, record) => record.order?.customer?.name || '-',
    },
    {
      title: '货物',
      key: 'goodsName',
      width: 120,
      render: (_, record) => record.order?.goodsName || '-',
    },
    {
      title: '应收数量',
      dataIndex: 'expectedQuantity',
      key: 'expectedQuantity',
      width: 100,
    },
    {
      title: '实收数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 100,
    },
    {
      title: '差异',
      key: 'difference',
      width: 120,
      render: (_, record) => {
        if (record.isOverThreshold) {
          return (
            <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              {record.difference?.toFixed(1)}% <Tag color="red">异常</Tag>
            </span>
          )
        }
        return <span>{record.difference?.toFixed(1)}%</span>
      },
    },
    {
      title: '签收人',
      key: 'signedBy',
      width: 100,
      render: (_, record) => record.signedBy || '-',
    },
    {
      title: '签收状态',
      dataIndex: 'signStatus',
      key: 'signStatus',
      width: 100,
      render: (status: SignStatus) => (
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: '签收时间',
      dataIndex: 'signTime',
      key: 'signTime',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  const handleDetail = async (record: SignRecord) => {
    try {
      const res = await getSignById(record.id)
      if (res.code === 0 || res.code === 200) {
        setCurrentRecord(res.data)
      } else {
        setCurrentRecord(record)
      }
    } catch (error) {
      setCurrentRecord(record)
    }
    setDetailModalVisible(true)
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params: SignSearchParams = {}
    if (values.orderNo) params.orderNo = values.orderNo
    if (values.signStatus) params.signStatus = values.signStatus
    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }
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

  const handleOpenSign = async () => {
    signForm.resetFields()
    setSelectedOrder(null)
    setExpectedQuantity(null)
    try {
      const res = await getOrderList({ status: 'DELIVERED', page: 1, pageSize: 100 })
      if (res.code === 0 || res.code === 200) {
        setPendingOrders(res.data.data || [])
      } else {
        setPendingOrders([])
      }
    } catch (error) {
      setPendingOrders([])
    }
    setSignModalVisible(true)
  }

  const handleOrderSelect = async (orderId: number) => {
    const order = pendingOrders.find(o => o.id === orderId) || null
    setSelectedOrder(order)
    signForm.setFieldsValue({ orderId })
    try {
      const res = await getOrderById(orderId)
      if (res.code === 0 || res.code === 200) {
        const qty = res.data.goodsQuantity
        setExpectedQuantity(qty !== undefined ? qty : null)
      } else {
        setExpectedQuantity(order?.goodsQuantity !== undefined ? order.goodsQuantity : null)
      }
    } catch (error) {
      setExpectedQuantity(order?.goodsQuantity !== undefined ? order.goodsQuantity : null)
    }
  }

  const handleSubmitSign = async () => {
    try {
      const values = await signForm.validateFields()
      const actualQty = Number(values.actualQuantity)
      const expectedQty = expectedQuantity !== null ? expectedQuantity : actualQty
      const diffPercent = expectedQty > 0 ? Math.abs(actualQty - expectedQty) / expectedQty * 100 : 0

      const submitData: SignCreateData = {
        orderId: values.orderId,
        actualQuantity: actualQty,
        signedBy: values.signedBy,
        remark: values.remark,
      }

      const res = await createSign(submitData)
      if (res.code === 0 || res.code === 200) {
        if (diffPercent > 5) {
          message.warning('签收异常，已自动触发复盘工单')
        } else {
          message.success('签收成功')
        }
        setSignModalVisible(false)
        fetchData()
      }
    } catch (error) {
      if (error !== false) {
        console.error('签收失败:', error)
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
          <Form.Item name="orderNo" label="订单号">
            <Input placeholder="请输入订单号" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="signStatus" label="状态">
            <Select placeholder="请选择状态" style={{ width: 130 }} allowClear>
              <Select.Option value="PENDING">待签收</Select.Option>
              <Select.Option value="SIGNED">已签收</Select.Option>
              <Select.Option value="DISPUTED">有争议</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker style={{ width: 280 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<QrcodeOutlined />} onClick={handleOpenSign}>
          扫码签收
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          onChange: handleTableChange,
        }}
      />

      <Modal
        title="签收详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {currentRecord && (
          <div>
            {currentRecord.isOverThreshold && (
              <Alert
                message="签收差异超过阈值，请关注"
                description={`差异率: ${currentRecord.difference?.toFixed(1)}%`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentRecord.signStatus]?.color || 'default'}>
                  {statusMap[currentRecord.signStatus]?.text || currentRecord.signStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单号">{currentRecord.order?.orderNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户">{currentRecord.order?.customer?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="货物">{currentRecord.order?.goodsName || '-'}</Descriptions.Item>
              <Descriptions.Item label="应收数量">{currentRecord.expectedQuantity}</Descriptions.Item>
              <Descriptions.Item label="实收数量">{currentRecord.actualQuantity}</Descriptions.Item>
              <Descriptions.Item label="差异">
                <span style={{ color: currentRecord.isOverThreshold ? '#ff4d4f' : undefined, fontWeight: currentRecord.isOverThreshold ? 'bold' : 'normal' }}>
                  {currentRecord.difference?.toFixed(1)}%
                  {currentRecord.isOverThreshold && <Tag color="red" style={{ marginLeft: 8 }}>异常</Tag>}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="签收人">{currentRecord.signedBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="签收时间">{currentRecord.signTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联车辆">{currentRecord.vehicle?.plateNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentRecord.createdAt}</Descriptions.Item>
              {currentRecord.remark && (
                <Descriptions.Item label="备注" span={2}>{currentRecord.remark}</Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="扫码签收"
        open={signModalVisible}
        onCancel={() => setSignModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSignModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitSign}>确认签收</Button>,
        ]}
        width={600}
      >
        <Form form={signForm} layout="vertical">
          <Form.Item label="选择订单" name="orderId" rules={[{ required: true, message: '请选择订单' }]}>
            <Select
              placeholder="请从待签收订单列表选择"
              showSearch
              optionFilterProp="label"
              onChange={(value) => handleOrderSelect(value)}
            >
              {pendingOrders.length > 0 ? pendingOrders.map(order => (
                <Select.Option key={order.id} value={order.id} label={order.orderNo}>
                  {order.orderNo} - {order.goods} ({order.customerName || '客户'})
                </Select.Option>
              )) : (
                <Select.Option value={0} disabled>暂无待签收订单</Select.Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item label="应收数量">
            <InputNumber
              style={{ width: '100%' }}
              value={expectedQuantity}
              disabled
              placeholder="选择订单后自动显示"
            />
            {selectedOrder && (
              <span style={{ fontSize: 12, color: '#999' }}>
                订单货物：{selectedOrder.goods}
                {selectedOrder.customerName && ` | 客户：${selectedOrder.customerName}`}
              </span>
            )}
          </Form.Item>
          <Form.Item label="实收数量" name="actualQuantity" rules={[{ required: true, message: '请输入实收数量' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入实收数量" />
          </Form.Item>
          <Form.Item label="签收人姓名" name="signedBy" rules={[{ required: true, message: '请输入签收人姓名' }]}>
            <Input placeholder="请输入签收人姓名" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注信息（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SignList
