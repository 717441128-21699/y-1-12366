import { useState, useEffect, useCallback } from 'react'
import { Table, Space, Button, Input, Select, Tag, Modal, Descriptions, Card, DatePicker, Form, Badge, Alert, InputNumber, message } from 'antd'
import { SearchOutlined, EyeOutlined, WarningOutlined, QrcodeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { SignRecord, SignStatus, SignSearchParams, SignCreateData, Order } from '@/types'
import { getSignList, getSignById, createSign } from '@/api/sign'
import { getOrderList, getOrderById } from '@/api/order'

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
    NORMAL: { text: '正常', color: 'success' },
    ABNORMAL: { text: '异常', color: 'error' },
    DELAYED: { text: '延迟', color: 'warning' },
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
      title: '签收单号',
      dataIndex: 'signNo',
      key: 'signNo',
      width: 160,
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
    },
    {
      title: '客户',
      key: 'customer',
      width: 120,
      render: (_, record) => record.customerName || '-',
    },
    {
      title: '货物',
      dataIndex: 'goods',
      key: 'goods',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'signStatus',
      key: 'signStatus',
      width: 90,
      render: (status: SignStatus) => (
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: '差异预警',
      key: 'warning',
      width: 100,
      render: (_, record) => (
        record.signStatus === 'ABNORMAL' || record.hasDamage || (record.weightDiff !== undefined && record.weightDiff !== 0)
          ? <Badge status="error" text={<span style={{ color: '#ff4d4f' }}><WarningOutlined /> 有差异</span>} />
          : <Badge status="success" text="正常" />
      ),
    },
    {
      title: '签收人',
      dataIndex: 'signerName',
      key: 'signerName',
      width: 100,
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
      width: 160,
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
        if (res.data.customerName) {
          signForm.setFieldsValue({ customerName: res.data.customerName })
        }
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

      const submitData = {
        orderId: values.orderId,
        actualQuantity: actualQty,
        signedBy: values.signedBy,
        remark: values.remark,
      }

      const res = await createSign(submitData as unknown as SignCreateData)
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
              <Select.Option value="NORMAL">正常</Select.Option>
              <Select.Option value="ABNORMAL">异常</Select.Option>
              <Select.Option value="DELAYED">延迟</Select.Option>
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
            {currentRecord.signStatus === 'ABNORMAL' && (
              <Alert
                message="存在差异，请关注"
                description={currentRecord.damageDescription || '货物存在数量/重量/质量差异'}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="签收单号">{currentRecord.signNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentRecord.signStatus]?.color || 'default'}>
                  {statusMap[currentRecord.signStatus]?.text || currentRecord.signStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单号">{currentRecord.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{currentRecord.customerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="货物">{currentRecord.goods}</Descriptions.Item>
              <Descriptions.Item label="签收人">{currentRecord.signerName}</Descriptions.Item>
              <Descriptions.Item label="签收时间">{currentRecord.signTime}</Descriptions.Item>
              <Descriptions.Item label="联系人">{currentRecord.receiverName}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentRecord.receiverPhone}</Descriptions.Item>
              <Descriptions.Item label="签收地址" span={2}>{currentRecord.signAddress}</Descriptions.Item>
              <Descriptions.Item label="签收时温度">{currentRecord.temperature !== undefined ? `${currentRecord.temperature}℃` : '-'}</Descriptions.Item>
              <Descriptions.Item label="签收时湿度">{currentRecord.humidity !== undefined ? `${currentRecord.humidity}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="重量差异">
                <span style={{ color: currentRecord.weightDiff !== undefined && currentRecord.weightDiff !== 0 ? '#ff4d4f' : undefined }}>
                  {currentRecord.weightDiff !== undefined ? `${currentRecord.weightDiff} kg` : '-'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="数量差异">
                <span style={{ color: currentRecord.quantityDiff !== undefined && currentRecord.quantityDiff !== 0 ? '#ff4d4f' : undefined }}>
                  {currentRecord.quantityDiff !== undefined ? `${currentRecord.quantityDiff} 件` : '-'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="是否有损坏">
                {currentRecord.hasDamage ? <span style={{ color: '#ff4d4f' }}>是</span> : '否'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentRecord.createdAt}</Descriptions.Item>
              {currentRecord.damageDescription && (
                <Descriptions.Item label="损坏描述" span={2}>{currentRecord.damageDescription}</Descriptions.Item>
              )}
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
