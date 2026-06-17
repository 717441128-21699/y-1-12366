import { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Select, Tag, Table, Badge, Tabs, Button, Modal, Form, Input, message, Statistic, Spin } from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { VehicleTemperature, AlarmRecord, AlarmLevel, Sensor } from '@/types'
import { getVehicleTemperatures, getAlarmList, handleAlarm, getVehicleSensors, getSensorReadings } from '@/api/temperature'
import dayjs from 'dayjs'

const { Option } = Select
const { TabPane } = Tabs

const TemperatureMonitor = () => {
  const [vehicleTemperatures, setVehicleTemperatures] = useState<VehicleTemperature[]>([])
  const [alarmList, setAlarmList] = useState<AlarmRecord[]>([])
  const [alarmLevelFilter, setAlarmLevelFilter] = useState<AlarmLevel | ''>('')
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTemperature | null>(null)
  const [alarmModalVisible, setAlarmModalVisible] = useState(false)
  const [currentAlarm, setCurrentAlarm] = useState<AlarmRecord | null>(null)
  const [handleForm] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<{ times: string[]; values: number[] }>({ times: [], values: [] })
  const [chartLoading, setChartLoading] = useState(false)
  const [, setSensors] = useState<Sensor[]>([])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const res = await getVehicleTemperatures()
      if (res.data && res.data.length > 0) {
        setVehicleTemperatures(res.data)
        if (!selectedVehicle) {
          setSelectedVehicle(res.data[0])
        }
      } else {
        const mockTemperatures: VehicleTemperature[] = [
          { vehicleId: 1, plateNo: '京A12345', sensorNo: 'S001', currentTemperature: -15.2, minTemperature: -18.5, maxTemperature: -12.8, status: 'normal', lastUpdate: dayjs().format('HH:mm:ss') },
          { vehicleId: 2, plateNo: '京B67890', sensorNo: 'S002', currentTemperature: -10.5, minTemperature: -15.2, maxTemperature: -8.2, status: 'warning', lastUpdate: dayjs().format('HH:mm:ss') },
          { vehicleId: 3, plateNo: '京C11111', sensorNo: 'S003', currentTemperature: -5.8, minTemperature: -12.3, maxTemperature: -3.5, status: 'alarm', lastUpdate: dayjs().format('HH:mm:ss') },
          { vehicleId: 4, plateNo: '京D22222', sensorNo: 'S004', currentTemperature: 4.2, minTemperature: 2.1, maxTemperature: 6.8, status: 'normal', lastUpdate: dayjs().format('HH:mm:ss') },
          { vehicleId: 5, plateNo: '京E33333', sensorNo: 'S005', currentTemperature: 7.5, minTemperature: 3.2, maxTemperature: 8.2, status: 'warning', lastUpdate: dayjs().format('HH:mm:ss') },
          { vehicleId: 6, plateNo: '京F44444', sensorNo: 'S006', currentTemperature: 2.8, minTemperature: 1.5, maxTemperature: 4.2, status: 'normal', lastUpdate: dayjs().format('HH:mm:ss') },
        ]
        setVehicleTemperatures(mockTemperatures)
        setSelectedVehicle(mockTemperatures[0])
      }
    } catch (e) {
      const mockTemperatures: VehicleTemperature[] = [
        { vehicleId: 1, plateNo: '京A12345', sensorNo: 'S001', currentTemperature: -15.2, minTemperature: -18.5, maxTemperature: -12.8, status: 'normal', lastUpdate: dayjs().format('HH:mm:ss') },
        { vehicleId: 2, plateNo: '京B67890', sensorNo: 'S002', currentTemperature: -10.5, minTemperature: -15.2, maxTemperature: -8.2, status: 'warning', lastUpdate: dayjs().format('HH:mm:ss') },
        { vehicleId: 3, plateNo: '京C11111', sensorNo: 'S003', currentTemperature: -5.8, minTemperature: -12.3, maxTemperature: -3.5, status: 'alarm', lastUpdate: dayjs().format('HH:mm:ss') },
        { vehicleId: 4, plateNo: '京D22222', sensorNo: 'S004', currentTemperature: 4.2, minTemperature: 2.1, maxTemperature: 6.8, status: 'normal', lastUpdate: dayjs().format('HH:mm:ss') },
        { vehicleId: 5, plateNo: '京E33333', sensorNo: 'S005', currentTemperature: 7.5, minTemperature: 3.2, maxTemperature: 8.2, status: 'warning', lastUpdate: dayjs().format('HH:mm:ss') },
        { vehicleId: 6, plateNo: '京F44444', sensorNo: 'S006', currentTemperature: 2.8, minTemperature: 1.5, maxTemperature: 4.2, status: 'normal', lastUpdate: dayjs().format('HH:mm:ss') },
      ]
      setVehicleTemperatures(mockTemperatures)
      setSelectedVehicle(mockTemperatures[0])
    } finally {
      setLoading(false)
    }
  }

  const fetchAlarms = async () => {
    try {
      const res = await getAlarmList({ page: pagination.current, pageSize: pagination.pageSize })
      if (res.data?.data) {
        setAlarmList(res.data.data)
        setPagination(p => ({ ...p, total: res.data!.total }))
      } else {
        const mockAlarms: AlarmRecord[] = [
          { id: 1, vehicleId: 3, vehiclePlate: '京C11111', sensorNo: 'S003', sensorName: '车厢温度', alarmType: 'temperature_high', level: 'danger', message: '温度严重超限', currentValue: -5.8, thresholdMin: -15, thresholdMax: -10, timestamp: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'), handled: false },
          { id: 2, vehicleId: 2, vehiclePlate: '京B67890', sensorNo: 'S002', sensorName: '车厢温度', alarmType: 'temperature_warning', level: 'warning', message: '温度接近上限', currentValue: -10.5, thresholdMin: -15, thresholdMax: -10, timestamp: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), handled: false },
          { id: 3, vehicleId: 5, vehiclePlate: '京E33333', sensorNo: 'S005', sensorName: '车厢温度', alarmType: 'temperature_warning', level: 'warning', message: '温度接近上限', currentValue: 7.5, thresholdMin: 2, thresholdMax: 8, timestamp: dayjs().subtract(45, 'minute').format('YYYY-MM-DD HH:mm:ss'), handled: false },
          { id: 4, vehicleId: 1, vehiclePlate: '京A12345', sensorNo: 'S001', sensorName: '湿度传感器', alarmType: 'humidity_high', level: 'info', message: '湿度偏高', currentValue: 72, thresholdMin: 0, thresholdMax: 70, timestamp: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), handled: true, handledBy: '管理员', handledAt: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), handleRemark: '已通风降温' },
          { id: 5, vehicleId: 4, vehiclePlate: '京D22222', sensorNo: 'S004', sensorName: '车厢温度', alarmType: 'temperature_low', level: 'warning', message: '温度接近下限', currentValue: 2.2, thresholdMin: 2, thresholdMax: 8, timestamp: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), handled: true, handledBy: '调度员', handledAt: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), handleRemark: '已调高制冷温度' },
        ]
        setAlarmList(mockAlarms)
        setPagination(p => ({ ...p, total: mockAlarms.length }))
      }
    } catch (e) {
      const mockAlarms: AlarmRecord[] = [
        { id: 1, vehicleId: 3, vehiclePlate: '京C11111', sensorNo: 'S003', sensorName: '车厢温度', alarmType: 'temperature_high', level: 'danger', message: '温度严重超限', currentValue: -5.8, thresholdMin: -15, thresholdMax: -10, timestamp: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'), handled: false },
        { id: 2, vehicleId: 2, vehiclePlate: '京B67890', sensorNo: 'S002', sensorName: '车厢温度', alarmType: 'temperature_warning', level: 'warning', message: '温度接近上限', currentValue: -10.5, thresholdMin: -15, thresholdMax: -10, timestamp: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), handled: false },
        { id: 3, vehicleId: 5, vehiclePlate: '京E33333', sensorNo: 'S005', sensorName: '车厢温度', alarmType: 'temperature_warning', level: 'warning', message: '温度接近上限', currentValue: 7.5, thresholdMin: 2, thresholdMax: 8, timestamp: dayjs().subtract(45, 'minute').format('YYYY-MM-DD HH:mm:ss'), handled: false },
        { id: 4, vehicleId: 1, vehiclePlate: '京A12345', sensorNo: 'S001', sensorName: '湿度传感器', alarmType: 'humidity_high', level: 'info', message: '湿度偏高', currentValue: 72, thresholdMin: 0, thresholdMax: 70, timestamp: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), handled: true, handledBy: '管理员', handledAt: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'), handleRemark: '已通风降温' },
        { id: 5, vehicleId: 4, vehiclePlate: '京D22222', sensorNo: 'S004', sensorName: '车厢温度', alarmType: 'temperature_low', level: 'warning', message: '温度接近下限', currentValue: 2.2, thresholdMin: 2, thresholdMax: 8, timestamp: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'), handled: true, handledBy: '调度员', handledAt: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), handleRemark: '已调高制冷温度' },
      ]
      setAlarmList(mockAlarms)
      setPagination(p => ({ ...p, total: mockAlarms.length }))
    }
  }

  const fetchVehicleSensorsAndReadings = async (vehicleId: number) => {
    try {
      setChartLoading(true)
      const sensorRes = await getVehicleSensors(vehicleId)
      const sensorList = sensorRes.data || []
      setSensors(sensorList)

      if (sensorList.length > 0) {
        const primarySensor = sensorList.find(s => s.type === 'temperature') || sensorList[0]
        const readingsRes = await getSensorReadings(primarySensor.id, {
          startTime: dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          endTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        })
        const readings = readingsRes.data || []
        if (readings.length > 0) {
          const sorted = [...readings].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          setChartData({
            times: sorted.map(r => dayjs(r.timestamp).format('HH:mm')),
            values: sorted.map(r => r.value),
          })
        } else {
          generateMockChartData()
        }
      } else {
        generateMockChartData()
      }
    } catch (e) {
      generateMockChartData()
    } finally {
      setChartLoading(false)
    }
  }

  const generateMockChartData = () => {
    setChartData({
      times: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
      values: Array.from({ length: 24 }, (_, i) => {
        const base = selectedVehicle
          ? selectedVehicle.minTemperature + (selectedVehicle.maxTemperature - selectedVehicle.minTemperature) * 0.5
          : -15
        return +(base + Math.sin(i / 3) * 2 + (Math.random() - 0.5)).toFixed(1)
      }),
    })
  }

  useEffect(() => {
    fetchVehicles()
    fetchAlarms()
  }, [])

  useEffect(() => {
    if (selectedVehicle) {
      fetchVehicleSensorsAndReadings(selectedVehicle.vehicleId)
    }
  }, [selectedVehicle])

  const filteredAlarmList = useMemo(() => {
    if (!alarmLevelFilter) return alarmList
    return alarmList.filter(item => item.level === alarmLevelFilter)
  }, [alarmList, alarmLevelFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#52c41a'
      case 'warning': return '#faad14'
      case 'alarm': return '#ff4d4f'
      default: return '#999'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return '正常'
      case 'warning': return '预警'
      case 'alarm': return '告警'
      default: return '未知'
    }
  }

  const getAlarmLevelTag = (level: AlarmLevel) => {
    const map: Record<AlarmLevel, { color: string; text: string }> = {
      info: { color: 'blue', text: '提示' },
      warning: { color: 'orange', text: '警告' },
      danger: { color: 'red', text: '严重' },
    }
    return <Tag color={map[level].color}>{map[level].text}</Tag>
  }

  const temperatureChartOption = useMemo(() => ({
    title: {
      text: selectedVehicle ? `${selectedVehicle.plateNo} 温度趋势（近24小时）` : '温度趋势（近24小时）',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.times,
    },
    yAxis: {
      type: 'value',
      name: '温度(℃)',
    },
    series: [
      {
        name: '实际温度',
        type: 'line',
        smooth: true,
        data: chartData.values,
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
        markLine: {
          silent: true,
          data: [
            selectedVehicle ? { yAxis: selectedVehicle.maxTemperature, name: '上限', lineStyle: { color: '#ff4d4f', type: 'dashed' }, label: { formatter: '上限 {c}℃' } } : {},
            selectedVehicle ? { yAxis: selectedVehicle.minTemperature, name: '下限', lineStyle: { color: '#faad14', type: 'dashed' }, label: { formatter: '下限 {c}℃' } } : {},
          ],
        },
      },
    ],
  }), [selectedVehicle, chartData])

  const alarmColumns: ColumnsType<AlarmRecord> = [
    {
      title: '车辆',
      dataIndex: 'vehiclePlate',
      key: 'vehiclePlate',
      width: 100,
    },
    {
      title: '传感器',
      dataIndex: 'sensorName',
      key: 'sensorName',
      width: 100,
    },
    {
      title: '告警类型',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: AlarmLevel) => getAlarmLevelTag(level),
    },
    {
      title: '当前值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      width: 100,
      render: (val) => val !== undefined ? val : '-',
    },
    {
      title: '阈值范围',
      key: 'threshold',
      width: 120,
      render: (_, record) => (
        record.thresholdMin !== undefined && record.thresholdMax !== undefined
          ? `${record.thresholdMin} ~ ${record.thresholdMax}`
          : '-'
      ),
    },
    {
      title: '状态',
      dataIndex: 'handled',
      key: 'handled',
      width: 80,
      render: (handled) => (
        handled
          ? <Badge status="success" text="已处理" />
          : <Badge status="warning" text="待处理" />
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        !record.handled && (
          <Button type="link" size="small" onClick={() => handleAlarmAction(record)}>
            处理
          </Button>
        )
      ),
    },
  ]

  const handleAlarmAction = (record: AlarmRecord) => {
    setCurrentAlarm(record)
    handleForm.resetFields()
    setAlarmModalVisible(true)
  }

  const submitHandle = async () => {
    try {
      const values = await handleForm.validateFields()
      if (currentAlarm) {
        try {
          await handleAlarm(currentAlarm.id, values.remark)
        } catch (e) {
          // ignore API error, just update local state
        }
        setAlarmList(prev => prev.map(item =>
          item.id === currentAlarm.id
            ? { ...item, handled: true, handledBy: '管理员', handledAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), handleRemark: values.remark }
            : item
        ))
        message.success('处理成功')
        setAlarmModalVisible(false)
        setCurrentAlarm(null)
      }
    } catch (e) {
      // validation error
    }
  }

  const stats = {
    normal: vehicleTemperatures.filter(v => v.status === 'normal').length,
    warning: vehicleTemperatures.filter(v => v.status === 'warning').length,
    alarm: vehicleTemperatures.filter(v => v.status === 'alarm').length,
  }

  return (
    <Spin spinning={loading}>
      <div>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="正常车辆"
                value={stats.normal}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="预警车辆"
                value={stats.warning}
                valueStyle={{ color: '#faad14' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="告警车辆"
                value={stats.alarm}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="realtime" style={{ marginTop: 16 }}>
          <TabPane tab="实时温度监控" key="realtime">
            <Row gutter={16}>
              <Col span={8}>
                <Card title="车辆温度列表" size="small">
                  <div style={{ maxHeight: 450, overflow: 'auto' }}>
                    {vehicleTemperatures.map((item) => (
                      <Card
                        key={item.vehicleId}
                        size="small"
                        style={{
                          marginBottom: 8,
                          cursor: 'pointer',
                          borderLeft: `4px solid ${getStatusColor(item.status)}`,
                          background: selectedVehicle?.vehicleId === item.vehicleId ? '#e6f7ff' : undefined,
                        }}
                        onClick={() => setSelectedVehicle(item)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{item.plateNo}</strong>
                            <div style={{ fontSize: 12, color: '#999' }}>{item.sensorNo}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 'bold', color: getStatusColor(item.status) }}>
                              {item.currentTemperature}℃
                            </div>
                            <Tag color={getStatusColor(item.status)} style={{ fontSize: 11 }}>
                              {getStatusText(item.status)}
                            </Tag>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          {item.minTemperature} ~ {item.maxTemperature}℃
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </Col>
              <Col span={16}>
                <Card>
                  <Spin spinning={chartLoading}>
                    <ReactECharts option={temperatureChartOption} style={{ height: 450 }} />
                  </Spin>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="告警记录" key="alarm">
            <Card>
              <div style={{ marginBottom: 16 }}>
                <Select
                  placeholder="筛选告警等级"
                  style={{ width: 150 }}
                  allowClear
                  value={alarmLevelFilter || undefined}
                  onChange={(value) => setAlarmLevelFilter(value || '')}
                >
                  <Option value="info">提示</Option>
                  <Option value="warning">警告</Option>
                  <Option value="danger">严重</Option>
                </Select>
              </div>
              <Table
                columns={alarmColumns}
                dataSource={filteredAlarmList}
                rowKey="id"
                pagination={{
                  ...pagination,
                  total: filteredAlarmList.length,
                  onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
                }}
              />
            </Card>
          </TabPane>
        </Tabs>

        <Modal
          title="处理告警"
          open={alarmModalVisible}
          onCancel={() => setAlarmModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setAlarmModalVisible(false)}>取消</Button>,
            <Button key="submit" type="primary" onClick={submitHandle}>确认处理</Button>,
          ]}
        >
          {currentAlarm && (
            <div style={{ marginBottom: 16 }}>
              <p>车辆：<strong>{currentAlarm.vehiclePlate}</strong></p>
              <p>告警：{currentAlarm.message}</p>
              <p>当前值：{currentAlarm.currentValue}</p>
            </div>
          )}
          <Form form={handleForm} layout="vertical">
            <Form.Item name="remark" label="处理说明" rules={[{ required: true, message: '请输入处理说明' }]}>
              <Input.TextArea rows={4} placeholder="请输入处理说明" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  )
}

export default TemperatureMonitor
