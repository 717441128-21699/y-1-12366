import { useState } from 'react'
import { Table, Space, Button, Input, Select, DatePicker, Tag, Modal, Form, InputNumber, message, Card, Descriptions, Result } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Order, OrderStatus, TemperatureZone } from '@/types'

const { RangePicker } = DatePicker

const OrderList = () => {
  const [data] = useState<Order[]>([
    { id: 1, orderNo: 'ORD20240101001', customer: '华润万家', goods: '冷冻猪肉', temperatureZone: 'frozen', status: 'transit', vehicleId: 1, vehiclePlate: '京A12345', weight: 2000, volume: 10, startAddress: '北京市朝阳区', endAddress: '北京市海淀区', planDepartureTime: '2024-01-15 08:00:00', planArrivalTime: '2024-01-15 12:00:00', temperatureMin: -18, temperatureMax: -12, createdAt: '2024-01-15 06:00:00', updatedAt: '2024-01-15 09:00:00' },
    { id: 2, orderNo: 'ORD20240101002', customer: '永辉超市', goods: '冷藏蔬菜', temperatureZone: 'chilled', status: 'pending', weight: 500, volume: 3, startAddress: '北京市丰台区', endAddress: '北京市西城区', planDepartureTime: '2024-01-15 10:00:00', planArrivalTime: '2024-01-15 13:00:00', temperatureMin: 2, temperatureMax: 8, createdAt: '2024-01-15 07:00:00', updatedAt: '2024-01-15 07:00:00' },
    { id: 3, orderNo: 'ORD20240101003', customer: '盒马鲜生', goods: '生鲜水果', temperatureZone: 'chilled', status: 'assigned', vehicleId: 2, vehiclePlate: '京B67890', weight: 800, volume: 5, startAddress: '北京市通州区', endAddress: '北京市朝阳区', planDepartureTime: '2024-01-15 09:00:00', planArrivalTime: '2024-01-15 11:00:00', temperatureMin: 0, temperatureMax: 5, createdAt: '2024-01-15 05:00:00', updatedAt: '2024-01-15 08:30:00' },
    { id: 4, orderNo: 'ORD20240101004', customer: '物美超市', goods: '冰淇淋', temperatureZone: 'frozen', status: 'delivered', vehicleId: 3, vehiclePlate: '京C11111', weight: 300, volume: 2, startAddress: '北京市大兴区', endAddress: '北京市石景山区', planDepartureTime: '2024-01-14 14:00:00', planArrivalTime: '2024-01-14 17:00:00', actualDepartureTime: '2024-01-14 14:15:00', actualArrivalTime: '2024-01-14 16:50:00', temperatureMin: -20, temperatureMax: -15, createdAt: '2024-01-14 10:00:00', updatedAt: '2024-01-14 17:00:00' },
    { id: 5, orderNo: 'ORD20240101005', customer: '家乐福', goods: '常温饮料', temperatureZone: 'normal', status: 'cancelled', weight: 1000, volume: 8, startAddress: '北京市顺义区', endAddress: '北京市昌平区', planDepartureTime: '2024-01-15 07:00:00', planArrivalTime: '2024-01-15 10:00:00', createdAt: '2024-01-15 04:00:00', updatedAt: '2024-01-15 06:00:00' },
  ])

  const [searchForm] = Form.useForm()
  const [modalForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [assignResult, setAssignResult] = useState<{ vehicleId: number; plateNo: string; score: number; reason: string } | null>(null)
  const [assignLoading, setAssignLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 5 })

  const statusMap: Record<OrderStatus, { text: string; color: string }> = {
    pending: { text: '待分配', color: 'orange' },
    assigned: { text: '已分配', color: 'blue' },
    transit: { text: '运输中', color: 'processing' },
    delivered: { text: '已送达', color: 'success' },
    cancelled: { text: '已取消', color: 'default' },
  }

  const temperatureZoneMap: Record<TemperatureZone, string> = {
    frozen: '冷冻',
    chilled: '冷藏',
    normal: '常温',
  }

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
      width: 120,
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
      width: 80,
      render: (zone: TemperatureZone) => temperatureZoneMap[zone],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrderStatus) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
    },
    {
      title: '车辆',
      dataIndex: 'vehiclePlate',
      key: 'vehiclePlate',
      width: 100,
      render: (plate) => plate || '-',
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
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<ThunderboltOutlined />} onClick={() => handleSmartAssign(record)}>
              智能分配
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleDetail = (record: Order) => {
    setCurrentOrder(record)
    setDetailModalVisible(true)
  }

  const handleSmartAssign = (record: Order) => {
    setCurrentOrder(record)
    setAssignResult(null)
    setAssignModalVisible(true)
  }

  const doSmartAssign = () => {
    setAssignLoading(true)
    setTimeout(() => {
      setAssignResult({
        vehicleId: 5,
        plateNo: '京E55555',
        score: 92,
        reason: '该车辆温区匹配、载重充足、距离取货点最近',
      })
      setAssignLoading(false)
    }, 1500)
  }

  const confirmAssign = () => {
    message.success('车辆分配成功')
    setAssignModalVisible(false)
  }

  const handleCreate = () => {
    modalForm.resetFields()
    setCreateModalVisible(true)
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

  const handleSubmitCreate = () => {
    modalForm.validateFields().then(() => {
      message.success('订单创建成功')
      setCreateModalVisible(false)
    })
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
              <Select.Option value="pending">待分配</Select.Option>
              <Select.Option value="assigned">已分配</Select.Option>
              <Select.Option value="transit">运输中</Select.Option>
              <Select.Option value="delivered">已送达</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
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
        scroll={{ x: 1000 }}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
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
              <Tag color={statusMap[currentOrder.status].color}>
                {statusMap[currentOrder.status].text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="客户">{currentOrder.customer}</Descriptions.Item>
            <Descriptions.Item label="货物">{currentOrder.goods}</Descriptions.Item>
            <Descriptions.Item label="温区">{temperatureZoneMap[currentOrder.temperatureZone]}</Descriptions.Item>
            <Descriptions.Item label="车辆">{currentOrder.vehiclePlate || '-'}</Descriptions.Item>
            <Descriptions.Item label="重量">{currentOrder.weight} kg</Descriptions.Item>
            <Descriptions.Item label="体积">{currentOrder.volume} m³</Descriptions.Item>
            <Descriptions.Item label="起始地址">{currentOrder.startAddress}</Descriptions.Item>
            <Descriptions.Item label="目的地址">{currentOrder.endAddress}</Descriptions.Item>
            <Descriptions.Item label="计划出发">{currentOrder.planDepartureTime}</Descriptions.Item>
            <Descriptions.Item label="计划到达">{currentOrder.planArrivalTime}</Descriptions.Item>
            <Descriptions.Item label="温度范围">
              {currentOrder.temperatureMin !== undefined && currentOrder.temperatureMax !== undefined
                ? `${currentOrder.temperatureMin}℃ ~ ${currentOrder.temperatureMax}℃`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{currentOrder.createdAt}</Descriptions.Item>
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
          <Form.Item name="customer" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="goods" label="货物名称" rules={[{ required: true, message: '请输入货物名称' }]}>
            <Input placeholder="请输入货物名称" />
          </Form.Item>
          <Form.Item name="temperatureZone" label="温区" rules={[{ required: true, message: '请选择温区' }]}>
            <Select placeholder="请选择温区">
              <Select.Option value="frozen">冷冻</Select.Option>
              <Select.Option value="chilled">冷藏</Select.Option>
              <Select.Option value="normal">常温</Select.Option>
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
            subTitle={assignResult.reason}
            extra={[
              <Card key="vehicle" size="small">
                <p>推荐车辆：<strong>{assignResult.plateNo}</strong></p>
                <p>匹配评分：<strong style={{ color: '#52c41a' }}>{assignResult.score}分</strong></p>
              </Card>
            ]}
          />
        )}
      </Modal>
    </div>
  )
}

export default OrderList
