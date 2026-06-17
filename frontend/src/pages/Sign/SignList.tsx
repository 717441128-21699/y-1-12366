import { useState } from 'react'
import { Table, Space, Button, Input, Select, Tag, Modal, Descriptions, Card, DatePicker, Form, Badge, Alert } from 'antd'
import { SearchOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { SignRecord, SignStatus } from '@/types'

const { RangePicker } = DatePicker

const SignList = () => {
  const [data] = useState<SignRecord[]>([
    { id: 1, signNo: 'SG20240115001', orderId: 1, orderNo: 'ORD20240101001', customer: '华润万家', goods: '冷冻猪肉', signer: '张经理', signTime: '2024-01-15 11:50:00', signStatus: 'normal', temperature: -15.2, humidity: 62, weightDiff: 0, quantityDiff: 0, hasDamage: false, receiverName: '张经理', receiverPhone: '13800138001', signAddress: '北京市海淀区XX路XX号', createdAt: '2024-01-15 11:50:00' },
    { id: 2, signNo: 'SG20240115002', orderId: 2, orderNo: 'ORD20240101002', customer: '永辉超市', goods: '冷藏蔬菜', signer: '李主管', signTime: '2024-01-15 13:20:00', signStatus: 'delayed', temperature: 4.5, humidity: 70, weightDiff: 0, quantityDiff: 0, hasDamage: false, receiverName: '李主管', receiverPhone: '13800138002', signAddress: '北京市西城区XX街XX号', remark: '因交通拥堵延迟20分钟送达', createdAt: '2024-01-15 13:20:00' },
    { id: 3, signNo: 'SG20240114003', orderId: 4, orderNo: 'ORD20240101004', customer: '物美超市', goods: '冰淇淋', signer: '王店长', signTime: '2024-01-14 16:50:00', signStatus: 'abnormal', temperature: -10.5, humidity: 55, weightDiff: -5, quantityDiff: -2, hasDamage: true, damageDescription: '外包装轻微破损，有2盒冰淇淋变形', receiverName: '王店长', receiverPhone: '13800138003', signAddress: '北京市石景山区XX路XX号', remark: '客户已签收，提出质量异议', createdAt: '2024-01-14 16:50:00' },
    { id: 4, signNo: 'SG20240114004', orderId: 3, orderNo: 'ORD20240101003', customer: '盒马鲜生', goods: '生鲜水果', signer: '赵收货', signTime: '2024-01-14 10:45:00', signStatus: 'normal', temperature: 3.2, humidity: 68, weightDiff: 0, quantityDiff: 0, hasDamage: false, receiverName: '赵收货', receiverPhone: '13800138004', signAddress: '北京市朝阳区XX路XX号', createdAt: '2024-01-14 10:45:00' },
  ])

  const [searchForm] = Form.useForm()
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<SignRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 4 })

  const statusMap: Record<SignStatus, { text: string; color: string }> = {
    normal: { text: '正常', color: 'success' },
    abnormal: { text: '异常', color: 'error' },
    delayed: { text: '延迟', color: 'warning' },
  }

  const columns: ColumnsType<SignRecord> = [
    {
      title: '签收单号',
      dataIndex: 'signNo',
      key: 'signNo',
      width: 140,
    },
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
      title: '状态',
      dataIndex: 'signStatus',
      key: 'signStatus',
      width: 90,
      render: (status: SignStatus) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      ),
    },
    {
      title: '差异预警',
      key: 'warning',
      width: 100,
      render: (_, record) => (
        record.signStatus === 'abnormal' || record.hasDamage || (record.weightDiff !== undefined && record.weightDiff !== 0)
          ? <Badge status="error" text={<span style={{ color: '#ff4d4f' }}><WarningOutlined /> 有差异</span>} />
          : <Badge status="success" text="正常" />
      ),
    },
    {
      title: '签收人',
      dataIndex: 'signer',
      key: 'signer',
      width: 100,
    },
    {
      title: '签收时间',
      dataIndex: 'signTime',
      key: 'signTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  const handleDetail = (record: SignRecord) => {
    setCurrentRecord(record)
    setDetailModalVisible(true)
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

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="orderNo" label="订单号">
            <Input placeholder="请输入订单号" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="signStatus" label="状态">
            <Select placeholder="请选择状态" style={{ width: 130 }} allowClear>
              <Select.Option value="normal">正常</Select.Option>
              <Select.Option value="abnormal">异常</Select.Option>
              <Select.Option value="delayed">延迟</Select.Option>
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
            {currentRecord.signStatus === 'abnormal' && (
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
                <Tag color={statusMap[currentRecord.signStatus].color}>
                  {statusMap[currentRecord.signStatus].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单号">{currentRecord.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{currentRecord.customer}</Descriptions.Item>
              <Descriptions.Item label="货物">{currentRecord.goods}</Descriptions.Item>
              <Descriptions.Item label="签收人">{currentRecord.signer}</Descriptions.Item>
              <Descriptions.Item label="签收时间">{currentRecord.signTime}</Descriptions.Item>
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
              <Descriptions.Item label="联系电话">{currentRecord.receiverPhone}</Descriptions.Item>
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
    </div>
  )
}

export default SignList
