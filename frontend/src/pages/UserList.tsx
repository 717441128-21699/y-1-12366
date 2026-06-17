import { Table, Space, Button, Input, Tag } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

interface User {
  key: string
  name: string
  age: number
  email: string
  role: string
  status: 'active' | 'inactive'
}

const UserList = () => {
  const data: User[] = [
    {
      key: '1',
      name: '张三',
      age: 32,
      email: 'zhangsan@example.com',
      role: '管理员',
      status: 'active',
    },
    {
      key: '2',
      name: '李四',
      age: 28,
      email: 'lisi@example.com',
      role: '用户',
      status: 'active',
    },
    {
      key: '3',
      name: '王五',
      age: 35,
      email: 'wangwu@example.com',
      role: '用户',
      status: 'inactive',
    },
  ]

  const columns: ColumnsType<User> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">编辑</Button>
          <Button type="link" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Input
          placeholder="搜索用户"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          新增用户
        </Button>
      </div>
      <Table columns={columns} dataSource={data} />
    </div>
  )
}

export default UserList
