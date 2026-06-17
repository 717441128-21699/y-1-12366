import { useState } from 'react'
import { Card, Row, Col, DatePicker, Select, Button, Statistic, message, Progress, Tabs } from 'antd'
import { DownloadOutlined, BarChartOutlined, ClockCircleOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ReportStats, RouteOption } from '@/types'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const ReportCenter = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [stats] = useState<ReportStats>({
    onTimeRate: 94.5,
    temperaturePassRate: 97.2,
    vehicleUtilization: 78.5,
    totalOrders: 1256,
    totalDistance: 45680,
    averageDeliveryTime: 3.5,
  })

  const routeOptions: RouteOption[] = [
    { id: 1, name: '北京城区配送线', code: 'BJ001' },
    { id: 2, name: '北京-天津干线', code: 'BJ002' },
    { id: 3, name: '北京-上海干线', code: 'BJ003' },
    { id: 4, name: '北京-广州干线', code: 'BJ004' },
    { id: 5, name: '华北区域覆盖', code: 'HB001' },
  ]

  const onTimeChartOption = {
    title: {
      text: '准时率趋势（近30天）',
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
      data: Array.from({ length: 30 }, (_, i) => dayjs().subtract(29 - i, 'day').format('MM-DD')),
    },
    yAxis: {
      type: 'value',
      max: 100,
      name: '准时率(%)',
    },
    series: [
      {
        name: '准时率',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 30 }, () => +(90 + Math.random() * 9).toFixed(1)),
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
            ],
          },
        },
      },
    ],
  }

  const temperatureChartOption = {
    title: {
      text: '温度合格率趋势（近30天）',
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
      data: Array.from({ length: 30 }, (_, i) => dayjs().subtract(29 - i, 'day').format('MM-DD')),
    },
    yAxis: {
      type: 'value',
      max: 100,
      name: '合格率(%)',
    },
    series: [
      {
        name: '温度合格率',
        type: 'line',
        smooth: true,
        data: Array.from({ length: 30 }, () => +(94 + Math.random() * 5).toFixed(1)),
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
    ],
  }

  const routeChartOption = {
    title: {
      text: '各线路运输量统计',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
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
      data: routeOptions.map(r => r.name),
    },
    yAxis: {
      type: 'value',
      name: '订单数',
    },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: [456, 320, 210, 150, 120],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#69c0ff' },
            ],
          },
        },
      },
    ],
  }

  const handleExport = () => {
    message.success('报表导出中，请稍候...')
    setTimeout(() => {
      message.success('报表导出成功')
    }, 1500)
  }

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates)
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            style={{ width: 280 }}
          />
          <span>线路：</span>
          <Select
            placeholder="全部线路"
            style={{ width: 200 }}
            allowClear
            value={selectedRoute || undefined}
            onChange={(value) => setSelectedRoute(value || '')}
          >
            {routeOptions.map(route => (
              <Option key={route.id} value={route.code}>
                {route.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<BarChartOutlined />}>
            生成报表
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </div>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="准时率"
              value={stats.onTimeRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ClockCircleOutlined />}
            />
            <Progress
              percent={stats.onTimeRate}
              strokeColor="#52c41a"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="温度合格率"
              value={stats.temperaturePassRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress
              percent={stats.temperaturePassRate}
              strokeColor="#1890ff"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="车辆利用率"
              value={stats.vehicleUtilization}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<CarOutlined />}
            />
            <Progress
              percent={stats.vehicleUtilization}
              strokeColor="#fa8c16"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总订单数"
              value={stats.totalOrders}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总运输里程"
              value={stats.totalDistance}
              suffix="km"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均配送时长"
              value={stats.averageDeliveryTime}
              suffix="小时"
              precision={1}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="onTime">
          <TabPane tab="准时率趋势" key="onTime">
            <ReactECharts option={onTimeChartOption} style={{ height: 350 }} />
          </TabPane>
          <TabPane tab="温度合格率" key="temperature">
            <ReactECharts option={temperatureChartOption} style={{ height: 350 }} />
          </TabPane>
          <TabPane tab="线路统计" key="route">
            <ReactECharts option={routeChartOption} style={{ height: 350 }} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default ReportCenter
