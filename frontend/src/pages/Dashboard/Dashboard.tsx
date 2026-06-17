import { Card, Row, Col, Statistic, List, Tag } from 'antd'
import {
  ShoppingCartOutlined,
  CarOutlined,
  BellOutlined,
  DashboardOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import type { DashboardStats, RecentAlarm, OrderStatusDistribution } from '@/types'

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    vehiclesInTransit: 0,
    pendingAlarms: 0,
    vehicleUtilization: 0,
  })
  const [recentAlarms, setRecentAlarms] = useState<RecentAlarm[]>([])
  const [statusDistribution, setStatusDistribution] = useState<OrderStatusDistribution[]>([])

  useEffect(() => {
    setStats({
      todayOrders: 128,
      vehiclesInTransit: 35,
      pendingAlarms: 12,
      vehicleUtilization: 78.5,
    })

    setRecentAlarms([
      { id: 1, vehiclePlate: '京A12345', level: 'danger', message: '温度超限，当前-12℃', time: dayjs().subtract(10, 'minute').format('HH:mm') },
      { id: 2, vehiclePlate: '京B67890', level: 'warning', message: '温度接近上限', time: dayjs().subtract(25, 'minute').format('HH:mm') },
      { id: 3, vehiclePlate: '京C11111', level: 'warning', message: '湿度偏高', time: dayjs().subtract(40, 'minute').format('HH:mm') },
      { id: 4, vehiclePlate: '京D22222', level: 'info', message: '车辆已启动', time: dayjs().subtract(55, 'minute').format('HH:mm') },
      { id: 5, vehiclePlate: '京E33333', level: 'danger', message: '设备离线', time: dayjs().subtract(60, 'minute').format('HH:mm') },
    ])

    setStatusDistribution([
      { status: '待分配', count: 15, value: 15 },
      { status: '运输中', count: 35, value: 35 },
      { status: '已送达', count: 68, value: 68 },
      { status: '已取消', count: 10, value: 10 },
    ])
  }, [])

  const temperatureChartOption = {
    title: {
      text: '温度趋势（近24小时）',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['平均温度', '最高温度', '最低温度'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    },
    yAxis: {
      type: 'value',
      name: '温度(℃)',
    },
    series: [
      {
        name: '平均温度',
        type: 'line',
        smooth: true,
        data: [-5, -4.5, -5.2, -5.8, -6, -5.5, -4.8, -4.2, -4.5, -5, -5.5, -6, -6.2, -5.8, -5.2, -4.8, -4.5, -5, -5.5, -6, -5.8, -5.2, -4.8, -5],
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
      },
      {
        name: '最高温度',
        type: 'line',
        smooth: true,
        data: [-2, -1.5, -2.2, -2.8, -3, -2.5, -1.8, -1.2, -1.5, -2, -2.5, -3, -3.2, -2.8, -2.2, -1.8, -1.5, -2, -2.5, -3, -2.8, -2.2, -1.8, -2],
        itemStyle: { color: '#fa8c16' },
      },
      {
        name: '最低温度',
        type: 'line',
        smooth: true,
        data: [-8, -7.5, -8.2, -8.8, -9, -8.5, -7.8, -7.2, -7.5, -8, -8.5, -9, -9.2, -8.8, -8.2, -7.8, -7.5, -8, -8.5, -9, -8.8, -8.2, -7.8, -8],
        itemStyle: { color: '#13c2c2' },
      },
    ],
  }

  const pieChartOption = {
    title: {
      text: '订单状态分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
    },
    series: [
      {
        name: '订单数',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: statusDistribution.map((item, index) => ({
          value: item.value,
          name: item.status,
          itemStyle: {
            color: ['#faad14', '#1890ff', '#52c41a', '#ff4d4f'][index],
          },
        })),
      },
    ],
  }

  const getAlarmTagColor = (level: string) => {
    switch (level) {
      case 'danger': return 'red'
      case 'warning': return 'orange'
      case 'info': return 'blue'
      default: return 'default'
    }
  }

  const getAlarmLevelText = (level: string) => {
    switch (level) {
      case 'danger': return '严重'
      case 'warning': return '警告'
      case 'info': return '提示'
      default: return '未知'
    }
  }

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日订单数"
              value={stats.todayOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运输中车辆"
              value={stats.vehiclesInTransit}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={stats.pendingAlarms}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="车辆利用率"
              value={stats.vehicleUtilization}
              suffix="%"
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card>
            <ReactECharts option={temperatureChartOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="最近告警"
            extra={<a href="#/temperature">更多</a>}
          >
            <List
              dataSource={recentAlarms}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Tag color={getAlarmTagColor(item.level)}>{getAlarmLevelText(item.level)}</Tag>}
                    title={<span style={{ fontSize: 13 }}>{item.vehiclePlate} - {item.message}</span>}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card>
            <ReactECharts option={pieChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
