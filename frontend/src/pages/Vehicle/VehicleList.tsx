import { useState, useEffect, useCallback } from 'react'
import { Table, Space, Button, Input, Select, Tag, Modal, Form, message, Card, Descriptions, List, Badge, Divider } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Vehicle, VehicleStatus, TemperatureZone, InsulationLevel, Sensor, VehicleSearchParams } from '@/types'
import { getVehicleList, createVehicle, updateVehicle, deleteVehicle, getVehicleById, getVehicleSensors } from '@/api/vehicle'

const VehicleList = () => {
  const [data, setData] = useState<Vehicle[]>([])
  const [searchForm] = Form.useForm()
  const [modalForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null)
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchParams, setSearchParams] = useState<VehicleSearchParams>({})

  const statusMap: Record<VehicleStatus, { text: string; color: string }> = {
    IDLE: { text: '空闲', color: 'default' },
    IN_TRANSIT: { text: '运输中', color: 'processing' },
    MAINTENANCE: { text: '维护中', color: 'warning' },
    DISABLED: { text: '停用', color: 'error' },
  }

  const temperatureZoneMap: Record<TemperatureZone, string> = {
    FROZEN: '冷冻',
    REFRIGERATED: '冷藏',
    AMBIENT: '常温',
    DUAL_ZONE: '双温区',
    MULTI_TEMP: '多温区',
  }

  const insulationLevelMap: Record<InsulationLevel, { text: string; color: string }> = {
    A: { text: 'A级', color: 'green' },
    B: { text: 'B级', color: 'blue' },
    C: { text: 'C级', color: 'orange' },
  }

  const fetchData = useCallback(async (params?: VehicleSearchParams) => {
    setLoading(true)
    try {
      const finalParams: VehicleSearchParams = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchParams,
        ...params,
      }
      const res = await getVehicleList(finalParams)
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
      console.error('获取车辆列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize, searchParams])

  useEffect(() => {
    fetchData()
  }, [])

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
      width: 100,
      render: (zone: TemperatureZone) => temperatureZoneMap[zone] || zone,
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
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || status}
        </Tag>
      ),
    },
    {
      title: '保温等级',
      dataIndex: 'insulationLevel',
      key: 'insulationLevel',
      width: 90,
      render: (level: InsulationLevel) => (
        <Tag color={insulationLevelMap[level]?.color || 'default'}>
          {insulationLevelMap[level]?.text || level}
        </Tag>
      ),
    },
    {
      title: '驾驶员',
      key: 'driver',
      width: 100,
      render: (_, record) => record.driverName || '-',
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

  const handleDetail = async (record: Vehicle) => {
    try {
      const res = await getVehicleById(record.id)
      if (res.code === 0 || res.code === 200) {
        setCurrentVehicle(res.data)
      } else {
        setCurrentVehicle(record)
      }
    } catch (error) {
      setCurrentVehicle(record)
    }
    try {
      const sensorRes = await getVehicleSensors(record.id)
      if (sensorRes.code === 0 || sensorRes.code === 200) {
        setSensors(sensorRes.data)
      } else {
        setSensors([])
      }
    } catch (error) {
      setSensors([])
    }
    setDetailModalVisible(true)
  }

  const handleEdit = (record: Vehicle) => {
    setCurrentVehicle(record)
    modalForm.setFieldsValue({
      plateNo: record.plateNo,
      model: record.model,
      temperatureZone: record.temperatureZone,
      loadCapacity: record.loadCapacity,
      status: record.status,
      insulationLevel: record.insulationLevel,
      currentLocation: record.currentLocation,
      driverName: record.driverName,
      driverPhone: record.driverPhone,
      temperatureMin: record.temperatureMin,
      temperatureMax: record.temperatureMax,
      remark: record.remark,
    })
    setEditModalVisible(true)
  }

  const handleDelete = (record: Vehicle) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除车辆 ${record.plateNo} 吗？`,
      onOk: async () => {
        try {
          const res = await deleteVehicle(record.id)
          if (res.code === 0 || res.code === 200) {
            message.success('删除成功')
            fetchData()
          }
        } catch (error) {
          console.error('删除车辆失败:', error)
        }
      },
    })
  }

  const handleCreate = () => {
    setCurrentVehicle(null)
    modalForm.resetFields()
    setEditModalVisible(true)
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params: VehicleSearchParams = {}
    if (values.plateNo) params.plateNo = values.plateNo
    if (values.status) params.status = values.status
    if (values.temperatureZone) params.temperatureZone = values.temperatureZone
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

  const handleSubmit = async () => {
    try {
      const values = await modalForm.validateFields()
      if (currentVehicle) {
        const res = await updateVehicle(currentVehicle.id, values)
        if (res.code === 0 || res.code === 200) {
          message.success('更新成功')
          setEditModalVisible(false)
          fetchData()
        }
      } else {
        const res = await createVehicle(values)
        if (res.code === 0 || res.code === 200) {
          message.success('创建成功')
          setEditModalVisible(false)
          fetchData()
        }
      }
    } catch (error) {
      if (error !== false) {
        console.error('提交失败:', error)
      }
    }
  }

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success'
      case 'warning': return 'warning'
      case 'alarm': return 'error'
      default: return 'default'
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
          <Form.Item name="plateNo" label="车牌号">
            <Input placeholder="请输入车牌号" prefix={<SearchOutlined />} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 130 }} allowClear>
              <Select.Option value="IDLE">空闲</Select.Option>
              <Select.Option value="IN_TRANSIT">运输中</Select.Option>
              <Select.Option value="MAINTENANCE">维护中</Select.Option>
              <Select.Option value="DISABLED">停用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="temperatureZone" label="温区">
            <Select placeholder="请选择温区" style={{ width: 120 }} allowClear>
              <Select.Option value="FROZEN">冷冻</Select.Option>
              <Select.Option value="REFRIGERATED">冷藏</Select.Option>
              <Select.Option value="AMBIENT">常温</Select.Option>
              <Select.Option value="DUAL_ZONE">双温区</Select.Option>
              <Select.Option value="MULTI_TEMP">多温区</Select.Option>
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
        scroll={{ x: 1100 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          onChange: handleTableChange,
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
                <Tag color={statusMap[currentVehicle.status]?.color || 'default'}>
                  {statusMap[currentVehicle.status]?.text || currentVehicle.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="车型">{currentVehicle.model}</Descriptions.Item>
              <Descriptions.Item label="温区">{temperatureZoneMap[currentVehicle.temperatureZone] || currentVehicle.temperatureZone}</Descriptions.Item>
              <Descriptions.Item label="载重">{currentVehicle.loadCapacity} kg</Descriptions.Item>
              <Descriptions.Item label="保温等级">
                <Tag color={insulationLevelMap[currentVehicle.insulationLevel]?.color || 'default'}>
                  {insulationLevelMap[currentVehicle.insulationLevel]?.text || currentVehicle.insulationLevel}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="驾驶员">{currentVehicle.driverName || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentVehicle.driverPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前位置" span={2}>{currentVehicle.currentLocation}</Descriptions.Item>
              <Descriptions.Item label="温度范围">
                {currentVehicle.temperatureMin !== undefined && currentVehicle.temperatureMax !== undefined
                  ? `${currentVehicle.temperatureMin}℃ ~ ${currentVehicle.temperatureMax}℃`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentVehicle.createdAt}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{currentVehicle.updatedAt}</Descriptions.Item>
              {currentVehicle.remark && (
                <Descriptions.Item label="备注" span={2}>{currentVehicle.remark}</Descriptions.Item>
              )}
            </Descriptions>

            {sensors.length > 0 && (
              <>
                <Divider orientation="left" style={{ marginTop: 20 }}>传感器列表</Divider>
                <List
                  size="small"
                  bordered
                  dataSource={sensors}
                  renderItem={(item) => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        avatar={<Badge status={getSensorStatusColor(item.status) as any} />}
                        title={item.name}
                        description={`编号：${item.sensorNo} | 类型：${item.type === 'temperature' ? '温度' : item.type === 'humidity' ? '湿度' : item.type}`}
                      />
                      <div>
                        {item.currentValue !== undefined && (
                          <span style={{ marginRight: 16 }}>
                            当前值：<strong>{item.currentValue}{item.unit}</strong>
                          </span>
                        )}
                        {item.lastUpdate && (
                          <span style={{ color: '#999', fontSize: 12 }}>更新于 {item.lastUpdate}</span>
                        )}
                      </div>
                    </List.Item>
                  )}
                />
              </>
            )}
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
              <Select.Option value="FROZEN">冷冻</Select.Option>
              <Select.Option value="REFRIGERATED">冷藏</Select.Option>
              <Select.Option value="AMBIENT">常温</Select.Option>
              <Select.Option value="DUAL_ZONE">双温区</Select.Option>
              <Select.Option value="MULTI_TEMP">多温区</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="载重(kg)" name="loadCapacity" rules={[{ required: true, message: '请输入载重' }]}>
            <Input style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Select.Option value="IDLE">空闲</Select.Option>
              <Select.Option value="IN_TRANSIT">运输中</Select.Option>
              <Select.Option value="MAINTENANCE">维护中</Select.Option>
              <Select.Option value="DISABLED">停用</Select.Option>
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
          <Form.Item name="driverName" label="驾驶员">
            <Input placeholder="请输入驾驶员姓名" />
          </Form.Item>
          <Form.Item name="driverPhone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item label="温度下限(℃)" name="temperatureMin">
            <Input style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="温度上限(℃)" name="temperatureMax">
            <Input style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default VehicleList
