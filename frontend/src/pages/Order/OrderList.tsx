import { useState, useEffect, useCallback } from 'react'
import { Table, Space, Button, Input, Select, DatePicker, Tag, Modal, Form, InputNumber, message, Card, Descriptions, Result } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Order, OrderStatus, TemperatureZone, OrderSearchParams } from '@/types'
import { getOrderList, createOrder, assignVehicle, getOrderById } from '@/api/order'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const OrderList = () => {
  const [data, setData] = useState<Order[]>([])
  const [searchForm] = Form.useForm()
  const [modalForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [assignResult, setAssignResult] = useState<{ vehicleId: number; plateNo: string } | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchParams, setSearchParams] = useState<OrderSearchParams>({})

  const statusMap: Record<OrderStatus, { text: string; color: string }> = {
    PENDING: { text: '待分配', color: 'orange' },
    ASSIGNED: { text: '已分配', color: 'blue' },
    IN_TRANSIT: { text: '运输中', color: 'processing' },
    DELIVERED: { text: '已送达', color: 'cyan' },
    SIGNED: { text: '已签收', color: 'success' },
    CANCELLED: { text: '已取消', color: 'default' },
    EXCEPTION: { text: '异常', color: 'error' },
  }

  const temperatureZoneMap: Record<TemperatureZone, string> = {
    FROZEN: '冷冻',
    REFRIGERATED: '冷藏',
    AMBIENT: '常温',
    DUAL_ZONE: '双温区',
    MULTI_TEMP: '多温区',
  }

  const fetchData = useCallback(async (params?: OrderSearchParams) => {
    setLoading(true)
    try {
      const finalParams: OrderSearchParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchParams,
        ...params,
      }
      const res = await getOrderList(finalParams)
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
      console.error('获取订单列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize, searchParams])

  useEffect(() => {
    fetchData()
  }, [])

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
    },
    {
      title: '客户',
      key: 'customer',
      width: 120,
      render: (_, record) => record.customer?.name || record.customerName || '-',
    },
    {
      title: '货物',
      dataIndex: 'goods',
      key: 'goods',
      width: 120,
    },
    {
      title: '温区',
      dataIndex: 'temperatureZone',
      key: 'temperatureZone',
      width: 100,
      render: (zone: TemperatureZone) => temperatureZoneMap[zone] || zone,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrderStatus) => (
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: '车辆',
      key: 'vehicle',
      width: 100,
      render: (_, record) => record.vehicle?.plateNo || record.vehiclePlate || '-',
    },
    {
      title: '司机',
      key: 'driver',
      width: 100,
      render: (_, record) => record.driver?.name || record.driverName || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button type="link" size="small" icon={<ThunderboltOutlined />} onClick={() => handleSmartAssign(record)}>
              智能分配
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleDetail = async (record: Order) => {
    try {
      const res = await getOrderById(record.id)
      if (res.code === 0 || res.code === 200) {
        setCurrentOrder(res.data)
      } else {
        setCurrentOrder(record)
      }
    } catch (error) {
      setCurrentOrder(record)
    }
    setDetailModalVisible(true)
  }

  const handleSmartAssign = (record: Order) => {
    setCurrentOrder(record)
    setAssignResult(null)
    setAssignModalVisible(true)
  }

  const doSmartAssign = async () => {
    if (!currentOrder) return
    setAssignLoading(true)
    try {
      const res = await assignVehicle({ orderId: currentOrder.id })
      if (res.code === 0 || res.code === 200) {
        setAssignResult(res.data)
        message.success('智能匹配成功')
      }
    } catch (error) {
      console.error('智能分配失败:', error)
    } finally {
      setAssignLoading(false)
    }
  }

  const confirmAssign = () => {
    message.success('车辆分配成功')
    setAssignModalVisible(false)
    fetchData()
  }

  const handleCreate = () => {
    modalForm.resetFields()
    setCreateModalVisible(true)
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params: OrderSearchParams = {}
    if (values.orderNo) params.orderNo = values.orderNo
    if (values.status) params.status = values.status
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

  const handleSubmitCreate = async () => {
    try {
      const values = await modalForm.validateFields()
      const submitData: Partial<Order> = {
        ...values,
        planDepartureTime: values.planDepartureTime ? dayjs(values.planDepartureTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
        planArrivalTime: values.planArrivalTime ? dayjs(values.planArrivalTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
      }
      const res = await createOrder(submitData)
      if (res.code === 0 || res.code === 200) {
        message.success('订单创建成功')
        setCreateModalVisible(false)
        fetchData()
      }
    } catch (error) {
      if (error !== false) {
        console.error('创建订单失败:', error)
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
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 150 }} allowClear>
              <Select.Option value="PENDING">待分配</Select.Option>
              <Select.Option value="ASSIGNED">已分配</Select.Option>
              <Select.Option value="IN_TRANSIT">运输中</Select.Option>
              <Select.Option value="DELIVERED">已送达</Select.Option>
              <Select.Option value="SIGNED">已签收</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
              <Select.Option value="EXCEPTION">异常</Select.Option>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建订单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          onChange: handleTableChange,
        }}
      />

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {currentOrder && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="订单号">{currentOrder.orderNo}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentOrder.status]?.color || 'default'}>
                {statusMap[currentOrder.status]?.text || currentOrder.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户">{currentOrder.customer?.name || currentOrder.customerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="货物">{currentOrder.goods}</Descriptions.Item>
            <Descriptions.Item label="温区">{temperatureZoneMap[currentOrder.temperatureZone] || currentOrder.temperatureZone}</Descriptions.Item>
            <Descriptions.Item label="车辆">{currentOrder.vehicle?.plateNo || currentOrder.vehiclePlate || '-'}</Descriptions.Item>
            <Descriptions.Item label="司机">{currentOrder.driver?.name || currentOrder.driverName || '-'}</Descriptions.Item>
            <Descriptions.Item label="司机电话">{currentOrder.driver?.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="重量">{currentOrder.weight} kg</Descriptions.Item>
            <Descriptions.Item label="体积">{currentOrder.volume} m³</Descriptions.Item>
            <Descriptions.Item label="起始地址" span={2}>{currentOrder.startAddress}</Descriptions.Item>
            <Descriptions.Item label="目的地址" span={2}>{currentOrder.endAddress}</Descriptions.Item>
            <Descriptions.Item label="计划出发">{currentOrder.planDepartureTime}</Descriptions.Item>
            <Descriptions.Item label="计划到达">{currentOrder.planArrivalTime}</Descriptions.Item>
            <Descriptions.Item label="实际出发">{currentOrder.actualDepartureTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="实际到达">{currentOrder.actualArrivalTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="温度范围" span={2}>
              {currentOrder.temperatureMin !== undefined && currentOrder.temperatureMax !== undefined
                ? `${currentOrder.temperatureMin}℃ ~ ${currentOrder.temperatureMax}℃`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{currentOrder.createdAt}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{currentOrder.updatedAt}</Descriptions.Item>
            {currentOrder.remark && (
              <Descriptions.Item label="备注" span={2}>{currentOrder.remark}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="新建订单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmitCreate}>确定</Button>,
        ]}
        width={600}
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item name="customerName" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="goods" label="货物名称" rules={[{ required: true, message: '请输入货物名称' }]}>
            <Input placeholder="请输入货物名称" />
          </Form.Item>
          <Form.Item name="temperatureZone" label="温区" rules={[{ required: true, message: '请选择温区' }]}>
            <Select placeholder="请选择温区">
              <Select.Option value="FROZEN">冷冻</Select.Option>
              <Select.Option value="REFRIGERATED">冷藏</Select.Option>
              <Select.Option value="AMBIENT">常温</Select.Option>
              <Select.Option value="DUAL_ZONE">双温区</Select.Option>
              <Select.Option value="MULTI_TEMP">多温区</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="重量(kg)" name="weight" rules={[{ required: true, message: '请输入重量' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="体积(m³)" name="volume" rules={[{ required: true, message: '请输入体积' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="startAddress" label="起始地址" rules={[{ required: true, message: '请输入起始地址' }]}>
            <Input placeholder="请输入起始地址" />
          </Form.Item>
          <Form.Item name="endAddress" label="目的地址" rules={[{ required: true, message: '请输入目的地址' }]}>
            <Input placeholder="请输入目的地址" />
          </Form.Item>
          <Form.Item label="计划出发时间" name="planDepartureTime" rules={[{ required: true, message: '请选择计划出发时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="计划到达时间" name="planArrivalTime" rules={[{ required: true, message: '请选择计划到达时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="温度下限(℃)" name="temperatureMin">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="温度上限(℃)" name="temperatureMax">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="智能分配车辆"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={assignResult ? [
          <Button key="cancel" onClick={() => setAssignModalVisible(false)}>取消</Button>,
          <Button key="confirm" type="primary" onClick={confirmAssign}>确认分配</Button>,
        ] : [
          <Button key="cancel" onClick={() => setAssignModalVisible(false)}>取消</Button>,
        ]}
        width={500}
      >
        {!assignResult ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ marginBottom: 20 }}>订单：{currentOrder?.orderNo}</p>
            <Button type="primary" icon={<ThunderboltOutlined />} loading={assignLoading} onClick={doSmartAssign}>
              开始智能匹配
            </Button>
          </div>
        ) : (
          <Result
            status="success"
            title="智能匹配成功"
            subTitle="系统已为您匹配最合适的车辆"
            extra={[
              <Card key="vehicle" size="small">
                <p>推荐车辆：<strong>{assignResult.plateNo}</strong></p>
              </Card>
            ]}
          />
        )}
      </Modal>
    </div>
  )
}

export default OrderList
