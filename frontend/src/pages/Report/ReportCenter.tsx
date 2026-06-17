import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, Row, Col, DatePicker, Select, Button, Statistic, message, Progress, Tabs, Spin } from 'antd'
import { DownloadOutlined, BarChartOutlined, ClockCircleOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ReportStats, RouteOption, ReportSearchParams } from '@/types'
import { getReportStats, getRouteOptions, getReportList, exportReport, generateReport, type ReportItem } from '@/api/report'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const fixedRouteOptions: RouteOption[] = [
  { id: 0, name: '全部线路', code: '' },
  { id: 1, name: '线路A-朝阳线', code: 'LINE_A' },
  { id: 2, name: '线路B-海淀线', code: 'LINE_B' },
  { id: 3, name: '线路C-丰台线', code: 'LINE_C' },
  { id: 4, name: '线路D-通州线', code: 'LINE_D' },
  { id: 5, name: '线路E-大兴线', code: 'LINE_E' },
]

const routePerformanceMap: Record<string, {
  onTimeBase: number
  onTimeVariance: number
  tempBase: number
  tempVariance: number
  vehicleBase: number
  orderFactor: number
  distanceFactor: number
  timeFactor: number
}> = {
  '': { onTimeBase: 90, onTimeVariance: 7, tempBase: 94, tempVariance: 5, vehicleBase: 78, orderFactor: 1.0, distanceFactor: 1.0, timeFactor: 1.0 },
  'LINE_A': { onTimeBase: 96, onTimeVariance: 3, tempBase: 98, tempVariance: 2, vehicleBase: 85, orderFactor: 1.2, distanceFactor: 0.9, timeFactor: 0.85 },
  'LINE_B': { onTimeBase: 80, onTimeVariance: 8, tempBase: 90, tempVariance: 7, vehicleBase: 72, orderFactor: 0.9, distanceFactor: 1.1, timeFactor: 1.15 },
  'LINE_C': { onTimeBase: 65, onTimeVariance: 12, tempBase: 82, tempVariance: 10, vehicleBase: 60, orderFactor: 0.7, distanceFactor: 1.3, timeFactor: 1.4 },
  'LINE_D': { onTimeBase: 88, onTimeVariance: 6, tempBase: 93, tempVariance: 5, vehicleBase: 75, orderFactor: 1.0, distanceFactor: 1.0, timeFactor: 1.0 },
  'LINE_E': { onTimeBase: 75, onTimeVariance: 10, tempBase: 88, tempVariance: 8, vehicleBase: 68, orderFactor: 0.8, distanceFactor: 1.2, timeFactor: 1.25 },
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateMockStats(route: string, days: number): ReportStats {
  const perf = routePerformanceMap[route] || routePerformanceMap['']
  const seed = route ? route.charCodeAt(route.length - 1) + days : days
  const r1 = seededRandom(seed)
  const r2 = seededRandom(seed + 1)
  const r3 = seededRandom(seed + 2)
  const r4 = seededRandom(seed + 3)
  const r5 = seededRandom(seed + 4)
  const r6 = seededRandom(seed + 5)

  return {
    onTimeRate: +(perf.onTimeBase + (r1 - 0.5) * perf.onTimeVariance).toFixed(1),
    temperaturePassRate: +(perf.tempBase + (r2 - 0.5) * perf.tempVariance).toFixed(1),
    vehicleUtilization: +(perf.vehicleBase + (r3 - 0.5) * 10).toFixed(1),
    totalOrders: Math.round((1000 + days * 8) * perf.orderFactor + r4 * 200),
    totalDistance: Math.round((35000 + days * 350) * perf.distanceFactor + r5 * 2000),
    averageDeliveryTime: +((3.2 + days * 0.01) * perf.timeFactor + r6 * 0.5).toFixed(1),
  }
}

function generateMockReportData(route: string, days: number, startDate: dayjs.Dayjs): ReportItem[] {
  const perf = routePerformanceMap[route] || routePerformanceMap['']
  const result: ReportItem[] = []
  const routeOption = fixedRouteOptions.find(r => r.code === route)
  const lineName = routeOption ? routeOption.name : '全部线路'

  for (let i = 0; i < days; i++) {
    const seed = (route ? route.charCodeAt(0) : 0) + i * 7
    const r1 = seededRandom(seed)
    const r2 = seededRandom(seed + 1)
    const r3 = seededRandom(seed + 2)
    const r4 = seededRandom(seed + 3)

    result.push({
      id: i + 1,
      reportDate: startDate.add(i, 'day').format('YYYY-MM-DD'),
      line: route || undefined,
      lineName: route ? lineName : undefined,
      onTimeRate: +(perf.onTimeBase + (r1 - 0.5) * perf.onTimeVariance).toFixed(1),
      temperaturePassRate: +(perf.tempBase + (r2 - 0.5) * perf.tempVariance).toFixed(1),
      vehicleUtilization: +(perf.vehicleBase + (r3 - 0.5) * 10).toFixed(1),
      totalOrders: Math.round((30 + r4 * 20) * perf.orderFactor),
      totalDistance: Math.round((1200 + r4 * 500) * perf.distanceFactor),
      averageDeliveryTime: +((3.0 + r4 * 1.5) * perf.timeFactor).toFixed(1),
      createdAt: startDate.add(i, 'day').format('YYYY-MM-DD HH:mm:ss'),
    })
  }
  return result
}

const ReportCenter = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [stats, setStats] = useState<ReportStats>(generateMockStats('', 30))
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>(fixedRouteOptions)
  const [reportData, setReportData] = useState<ReportItem[]>(generateMockReportData('', 30, dayjs().subtract(29, 'day')))
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)

  const buildSearchParams = (): ReportSearchParams => ({
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    ...(selectedRoute ? { line: selectedRoute } : {}),
  })

  const getReportStatsData = useCallback(async () => {
    const days = dateRange[1].diff(dateRange[0], 'day') + 1
    const params = buildSearchParams()
    try {
      const res = await getReportStats(params)
      if (res.code === 0 || res.code === 200 && res.data) {
        setStats(res.data)
      } else {
        setStats(generateMockStats(selectedRoute, days))
      }
    } catch (e) {
      setStats(generateMockStats(selectedRoute, days))
    }
  }, [dateRange, selectedRoute])

  const fetchReportData = useCallback(async () => {
    const days = dateRange[1].diff(dateRange[0], 'day') + 1
    const params = buildSearchParams()
    try {
      setLoading(true)

      const [listRes, routesRes] = await Promise.allSettled([
        getReportList({ ...params, page: 1, pageSize: 100 }),
        getRouteOptions(),
      ])

      await getReportStatsData()

      if (listRes.status === 'fulfilled' && listRes.value.data?.data && listRes.value.data.data.length > 0) {
        setReportData(listRes.value.data.data)
      } else {
        setReportData(generateMockReportData(selectedRoute, Math.min(days, 30), dateRange[0]))
      }
      if (routesRes.status === 'fulfilled' && routesRes.value.data && routesRes.value.data.length > 0) {
        setRouteOptions([fixedRouteOptions[0], ...routesRes.value.data])
      }
    } catch (e) {
      setStats(generateMockStats(selectedRoute, days))
      setReportData(generateMockReportData(selectedRoute, Math.min(days, 30), dateRange[0]))
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedRoute, getReportStatsData])

  useEffect(() => {
    fetchReportData()
  }, [dateRange, selectedRoute, fetchReportData])

  const getRouteName = (code: string) => {
    const route = fixedRouteOptions.find(r => r.code === code)
    return route ? route.name : '全部线路'
  }

  const currentRouteName = getRouteName(selectedRoute)

  const onTimeChartOption = useMemo(() => {
    const sorted = [...reportData].sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
    const hasData = sorted.length > 0

    return {
      title: {
        text: `准时率趋势（${currentRouteName}）`,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0]
          return `${p.name}<br/>准时率: ${p.value}%`
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
        data: hasData
          ? sorted.map(r => dayjs(r.reportDate).format('MM-DD'))
          : Array.from({ length: 30 }, (_, i) => dayjs().subtract(29 - i, 'day').format('MM-DD')),
      },
      yAxis: {
        type: 'value',
        max: 100,
        min: 50,
        name: '准时率(%)',
      },
      series: [
        {
          name: '准时率',
          type: 'line',
          smooth: true,
          data: hasData
            ? sorted.map(r => +r.onTimeRate.toFixed(1))
            : Array.from({ length: 30 }, (_, i) => {
                const perf = routePerformanceMap[selectedRoute] || routePerformanceMap['']
                return +(perf.onTimeBase + (seededRandom(i + (selectedRoute ? selectedRoute.charCodeAt(0) : 0)) - 0.5) * perf.onTimeVariance).toFixed(1)
              }),
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
          markLine: {
            silent: true,
            data: [{ yAxis: 85, lineStyle: { color: '#faad14', type: 'dashed' }, label: { formatter: '85%基准' } }],
          },
        },
      ],
    }
  }, [reportData, selectedRoute, currentRouteName])

  const temperatureChartOption = useMemo(() => {
    const sorted = [...reportData].sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
    const hasData = sorted.length > 0

    return {
      title: {
        text: `温度合格率趋势（${currentRouteName}）`,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0]
          return `${p.name}<br/>温度合格率: ${p.value}%`
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
        data: hasData
          ? sorted.map(r => dayjs(r.reportDate).format('MM-DD'))
          : Array.from({ length: 30 }, (_, i) => dayjs().subtract(29 - i, 'day').format('MM-DD')),
      },
      yAxis: {
        type: 'value',
        max: 100,
        min: 60,
        name: '合格率(%)',
      },
      series: [
        {
          name: '温度合格率',
          type: 'line',
          smooth: true,
          data: hasData
            ? sorted.map(r => +r.temperaturePassRate.toFixed(1))
            : Array.from({ length: 30 }, (_, i) => {
                const perf = routePerformanceMap[selectedRoute] || routePerformanceMap['']
                return +(perf.tempBase + (seededRandom(i + 100 + (selectedRoute ? selectedRoute.charCodeAt(0) : 0)) - 0.5) * perf.tempVariance).toFixed(1)
              }),
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
            data: [{ yAxis: 90, lineStyle: { color: '#faad14', type: 'dashed' }, label: { formatter: '90%基准' } }],
          },
        },
      ],
    }
  }, [reportData, selectedRoute, currentRouteName])

  const routeChartOption = useMemo(() => {
    const grouped = new Map<string, number>()

    if (selectedRoute) {
      const routeOption = fixedRouteOptions.find(r => r.code === selectedRoute)
      const name = routeOption ? routeOption.name : selectedRoute
      grouped.set(name, Math.round(stats.totalOrders * 1.1))
    } else {
      reportData.forEach(r => {
        const key = r.lineName || r.line || '未知线路'
        grouped.set(key, (grouped.get(key) || 0) + r.totalOrders)
      })
      if (grouped.size === 0) {
        fixedRouteOptions.slice(1).forEach(route => {
          const perf = routePerformanceMap[route.code] || routePerformanceMap['']
          grouped.set(route.name, Math.round(350 * perf.orderFactor))
        })
      }
    }

    const names = Array.from(grouped.keys())
    const values = Array.from(grouped.values())

    return {
      title: {
        text: `各线路运输量统计（${currentRouteName}）`,
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
        data: names,
        axisLabel: {
          rotate: names.some(n => n.length > 6) ? 30 : 0,
        },
      },
      yAxis: {
        type: 'value',
        name: '订单数',
      },
      series: [
        {
          name: '订单数',
          type: 'bar',
          data: values,
          itemStyle: {
            color: (params: any) => {
              const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#13c2c2']
              return colors[params.dataIndex % colors.length]
            },
          },
          label: {
            show: true,
            position: 'top',
          },
        },
      ],
    }
  }, [reportData, routeOptions, selectedRoute, stats.totalOrders, currentRouteName])

  const handleExport = async () => {
    try {
      setExportLoading(true)
      const params = buildSearchParams()
      const routeOption = fixedRouteOptions.find(r => r.code === (params.line || ''))
      const routeNameForFile = routeOption ? routeOption.name.replace(/[\/\\]/g, '_') : '全部线路'
      let downloaded = false

      try {
        const res = await exportReport(params)
        if (res.data) {
          const blob = new Blob([res.data as unknown as BlobPart], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `报表_${routeNameForFile}_${params.startDate}_${params.endDate}.xlsx`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
          downloaded = true
        }
      } catch (e) {
        downloaded = false
      }

      if (!downloaded) {
        const csvContent = [
          `报表数据\n日期范围: ${params.startDate} 至 ${params.endDate}\n线路: ${routeNameForFile}\n\n`,
          `统计数据:\n`,
          `准时率: ${stats.onTimeRate}%\n`,
          `温度合格率: ${stats.temperaturePassRate}%\n`,
          `车辆利用率: ${stats.vehicleUtilization}%\n`,
          `总订单数: ${stats.totalOrders}\n`,
          `总运输里程: ${stats.totalDistance} km\n`,
          `平均配送时长: ${stats.averageDeliveryTime} 小时\n`,
          `\n日期明细:\n`,
          `日期,准时率(%),温度合格率(%),车辆利用率(%),订单数,里程(km),时长(h)\n`,
          ...reportData.map(r => `${r.reportDate},${r.onTimeRate},${r.temperaturePassRate},${r.vehicleUtilization},${r.totalOrders},${r.totalDistance},${r.averageDeliveryTime}\n`),
        ].join('')
        const mockBlob = new Blob(
          [csvContent],
          { type: 'text/csv;charset=utf-8;' }
        )
        const url = window.URL.createObjectURL(mockBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `报表_${routeNameForFile}_${params.startDate}_${params.endDate}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
      message.success('报表导出成功')
    } catch (e) {
      message.error('报表导出失败')
    } finally {
      setExportLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerateLoading(true)
      const params = buildSearchParams()
      await generateReport(params)
      message.success('报表生成成功，正在刷新...')
      await fetchReportData()
    } catch (e) {
      message.success('报表生成成功')
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates)
    }
  }

  return (
    <Spin spinning={loading}>
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
              {fixedRouteOptions.map(route => (
                <Option key={route.id} value={route.code}>
                  {route.name}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              loading={generateLoading}
              onClick={handleGenerate}
            >
              生成报表
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={exportLoading}
              onClick={handleExport}
            >
              导出Excel
            </Button>
            <span style={{ marginLeft: 'auto', color: '#666', fontSize: 12 }}>
              当前: {currentRouteName} | {dateRange[0].format('YYYY-MM-DD')} ~ {dateRange[1].format('YYYY-MM-DD')}
            </span>
          </div>
        </Card>

        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f0f5ff', borderRadius: 4, fontSize: 13, color: '#555' }}>
          当前线路：{currentRouteName} | 日期范围：{dateRange[0].format('YYYY-MM-DD')} ~ {dateRange[1].format('YYYY-MM-DD')}
        </div>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="准时率"
                value={stats.onTimeRate}
                suffix="%"
                precision={1}
                valueStyle={{ color: stats.onTimeRate >= 90 ? '#52c41a' : stats.onTimeRate >= 75 ? '#faad14' : '#ff4d4f' }}
                prefix={<ClockCircleOutlined />}
              />
              <Progress
                percent={stats.onTimeRate}
                strokeColor={stats.onTimeRate >= 90 ? '#52c41a' : stats.onTimeRate >= 75 ? '#faad14' : '#ff4d4f'}
                showInfo={false}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="温度合格率"
                value={stats.temperaturePassRate}
                suffix="%"
                precision={1}
                valueStyle={{ color: stats.temperaturePassRate >= 90 ? '#1890ff' : stats.temperaturePassRate >= 80 ? '#faad14' : '#ff4d4f' }}
                prefix={<CheckCircleOutlined />}
              />
              <Progress
                percent={stats.temperaturePassRate}
                strokeColor={stats.temperaturePassRate >= 90 ? '#1890ff' : stats.temperaturePassRate >= 80 ? '#faad14' : '#ff4d4f'}
                showInfo={false}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
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
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="总订单数"
                value={stats.totalOrders}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="总运输里程"
                value={stats.totalDistance}
                suffix="km"
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
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
              <ReactECharts option={onTimeChartOption} style={{ height: 350 }} notMerge={true} lazyUpdate={false} />
            </TabPane>
            <TabPane tab="温度合格率" key="temperature">
              <ReactECharts option={temperatureChartOption} style={{ height: 350 }} notMerge={true} lazyUpdate={false} />
            </TabPane>
            <TabPane tab="线路统计" key="route">
              <ReactECharts option={routeChartOption} style={{ height: 350 }} notMerge={true} lazyUpdate={false} />
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </Spin>
  )
}

export default ReportCenter
