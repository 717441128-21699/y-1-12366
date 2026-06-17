import { useState } from 'react'
import { Table, Space, Button, Input, Select, Tag, Modal, Form, message, Card, Descriptions, List, Badge, Divider } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Vehicle, VehicleStatus, TemperatureZone, InsulationLevel, Sensor } from '@/types'

const VehicleList = () => {
  const [data] = useState<Vehicle[]>([
    { id: 1, plateNo: '京A12345', model: '东风冷链车', temperatureZone: 'frozen', loadCapacity: 5000, status: 'transit', insulationLevel: 'A', currentLocation: '北京市朝阳区', driver: '张三', phone: '13800138001', temperatureMin: -18, temperatureMax: -12, createdAt: '2023-01-01', updatedAt: '2024-01-15' },
    { id: 2, plateNo: '京B67890', model: '福田冷藏车', temperatureZone: 'chilled', loadCapacity: 3000, status: 'idle', insulationLevel: 'A', currentLocation: '北京市海淀区', driver: '李四', phone: '13800138002', temperatureMin: 0, temperatureMax: 8, createdAt: '2023-03-15', updatedAt: '2024-01-15' },
    { id: 3, plateNo: '京C11111', model: '解放冷链车', temperatureZone: 'frozen', loadCapacity: 8000, status: 'maintenance', insulationLevel: 'B', currentLocation: '北京市丰台区维修站', driver: '王五', phone: '13800138003', temperatureMin: -20, temperatureMax: -15, createdAt: '2022-06-01', updatedAt: '2024-01-10' },
    { id: 4, plateNo: '京D22222', model: '江淮冷藏车', temperatureZone: 'chilled', loadCapacity: 4000, status: 'transit', insulationLevel: 'A', currentLocation: '北京市通州区', driver: '赵六', phone: '13800138004', temperatureMin: 2, temperatureMax: 6, createdAt: '2023-08-20', updatedAt: '2024-01-15' },
    { id: 5, plateNo: '京E33333', model: '重汽冷链车', temperatureZone: 'frozen', loadCapacity: 10000, status: 'offline', insulationLevel: 'C', currentLocation: '北京市顺义区停车场', driver: '钱七', phone: '13800138005', temperatureMin: -22, temperatureMax: -18, createdAt: '2021-12-01', updatedAt: '2024-01-01' },
  ])

  const [searchForm] = Form.useForm()
  const [modalForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 5 })

  const statusMap: Record<VehicleStatus, { text: string; color: string }> = {
    idle: { text: '空闲', color: 'default' },
    transit: { text: '运输中', color: 'processing' },
    maintenance: { text: '维护中', color: 'warning' },
    offline: { text: '离线', color: 'error' },
  }

  const temperatureZoneMap: Record<TemperatureZone, string> = {
    frozen: '冷冻',
    chilled: '冷藏',
    normal: '常温',
  }

  const insulationLevelMap: Record<InsulationLevel, { text: string; color: string }> = {
    A: { text: 'A级', color: 'green' },
    B: { text: 'B级', color: 'blue' },
    C: { text: 'C级', color: 'orange' },
  }

  const mockSensors: Sensor[] = [
    { id: 1, sensorNo: 'S001', name: '车厢前温度', type: 'temperature', currentValue: -15, unit: '℃', status: 'normal', lastUpdate: '2024-01-15 10:30:00' },
    { id: 2, sensorNo: 'S002', name: '车厢中温度', type: 'temperature', currentValue: -14.5, unit: '℃', status: 'normal', lastUpdate: '2024-01-15 10:30:00' },
    { id: 3, sensorNo: 'S003', name: '车厢后温度', type: 'temperature', currentValue: -16, unit: '℃', status: 'normal', lastUpdate: '2024-01-15 10:30:00' },
    { id: 4, sensorNo: 'S004', name: '车厢湿度', type: 'humidity', currentValue: 65, unit: '%', status: 'normal', lastUpdate: '2024-01-15 10:30:00' },
    { id: 5, sensorNo: 'S005', name: '车门状态', type: 'temperature', unit: '', status: 'normal', lastUpdate: '2024-01-15 10:00:00' },
  ]

  const columns: ColumnsType<Vehicle> = [
    {
      title: '车牌号',
      dataIndex: 'plateNo',
      key: 'plateNo',
      width: 110,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '车型',
      dataIndex: 'model',
      key: 'model',
      width: 140,
    },
    {
      title: '温区',
      dataIndex: 'temperatureZone',
      key: 'temperatureZone',
      width: 80,
      render: (zone: TemperatureZone) => temperatureZoneMap[zone],
    },
    {
      title: '载重(kg)',
      dataIndex: 'loadCapacity',
      key: 'loadCapacity',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: VehicleStatus) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
    },
    {
      title: '保温等级',
      dataIndex: 'insulationLevel',
      key: 'insulationLevel',
      width: 90,
      render: (level: InsulationLevel) => (
        <Tag color={insulationLevelMap[level].color}>
          {insulationLevelMap[level].text}
        </Tag>
      ),
    },
    {
      title: '当前位置',
      dataIndex: 'currentLocation',
      key: 'currentLocation',
      width: 180,
      ellipsis: true,
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
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleDetail = (record: Vehicle) => {
    setCurrentVehicle(record)
    setDetailModalVisible(true)
  }

  const handleEdit = (record: Vehicle) => {
    setCurrentVehicle(record)
    modalForm.setFieldsValue(record)
    setEditModalVisible(true)
  }

  const handleDelete = (record: Vehicle) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除车辆 ${record.plateNo} 吗？`,
      onOk: () => {
        message.success('删除成功')
      },
    })
  }

  const handleCreate = () => {
    setCurrentVehicle(null)
    modalForm.resetFields()
    setEditModalVisible(true)
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

  const handleSubmit = () => {
    modalForm.validateFields().then(() => {
      message.success(currentVehicle ? '更新成功' : '创建成功')
      setEditModalVisible(false)
    })
  }

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success'
      case 'warning': return 'warning'
      case 'alarm': return 'error'
      default: return 'default'
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="plateNo" label="车牌号">
            <Input placeholder="请输入车牌号" prefix={<SearchOutlined />} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 130 }} allowClear>
              <Select.Option value="idle">空闲</Select.Option>
              <Select.Option value="transit">运输中</Select.Option>
              <Select.Option value="maintenance">维护中</Select.Option>
              <Select.Option value="offline">离线</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="temperatureZone" label="温区">
            <Select placeholder="请选择温区" style={{ width: 120 }} allowClear>
              <Select.Option value="frozen">冷冻</Select.Option>
              <Select.Option value="chilled">冷藏</Select.Option>
              <Select.Option value="normal">常温</Select.Option>
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

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增车辆
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
        title="车辆详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {currentVehicle && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="车牌号"><strong>{currentVehicle.plateNo}</strong></Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentVehicle.status].color}>
                  {statusMap[currentVehicle.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="车型">{currentVehicle.model}</Descriptions.Item>
              <Descriptions.Item label="温区">{temperatureZoneMap[currentVehicle.temperatureZone]}</Descriptions.Item>
              <Descriptions.Item label="载重">{currentVehicle.loadCapacity} kg</Descriptions.Item>
              <Descriptions.Item label="保温等级">
                <Tag color={insulationLevelMap[currentVehicle.insulationLevel].color}>
                  {insulationLevelMap[currentVehicle.insulationLevel].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="驾驶员">{currentVehicle.driver || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentVehicle.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前位置" span={2}>{currentVehicle.currentLocation}</Descriptions.Item>
              <Descriptions.Item label="温度范围">
                {currentVehicle.temperatureMin !== undefined && currentVehicle.temperatureMax !== undefined
                  ? `${currentVehicle.temperatureMin}℃ ~ ${currentVehicle.temperatureMax}℃`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentVehicle.createdAt}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ marginTop: 20 }}>传感器列表</Divider>
            <List
              size="small"
              bordered
              dataSource={mockSensors}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Badge status={getSensorStatusColor(item.status) as any} />}
                    title={item.name}
                    description={`编号：${item.sensorNo} | 类型：${item.type === 'temperature' ? '温度' : '湿度'}`}
                  />
                  <div>
                    {item.currentValue !== undefined && (
                      <span style={{ marginRight: 16 }}>
                        当前值：<strong>{item.currentValue}{item.unit}</strong>
                      </span>
                    )}
                    <span style={{ color: '#999', fontSize: 12 }}>更新于 {item.lastUpdate}</span>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={currentVehicle ? '编辑车辆' : '新增车辆'}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>确定</Button>,
        ]}
        width={600}
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item name="plateNo" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item name="model" label="车型" rules={[{ required: true, message: '请输入车型' }]}>
            <Input placeholder="请输入车型" />
          </Form.Item>
          <Form.Item name="temperatureZone" label="温区" rules={[{ required: true, message: '请选择温区' }]}>
            <Select placeholder="请选择温区">
              <Select.Option value="frozen">冷冻</Select.Option>
              <Select.Option value="chilled">冷藏</Select.Option>
              <Select.Option value="normal">常温</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="载重(kg)" name="loadCapacity" rules={[{ required: true, message: '请输入载重' }]}>
            <Input style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Select.Option value="idle">空闲</Select.Option>
              <Select.Option value="transit">运输中</Select.Option>
              <Select.Option value="maintenance">维护中</Select.Option>
              <Select.Option value="offline">离线</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="insulationLevel" label="保温等级" rules={[{ required: true, message: '请选择保温等级' }]}>
            <Select placeholder="请选择保温等级">
              <Select.Option value="A">A级</Select.Option>
              <Select.Option value="B">B级</Select.Option>
              <Select.Option value="C">C级</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="currentLocation" label="当前位置">
            <Input placeholder="请输入当前位置" />
          </Form.Item>
          <Form.Item name="driver" label="驾驶员">
            <Input placeholder="请输入驾驶员姓名" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default VehicleList
