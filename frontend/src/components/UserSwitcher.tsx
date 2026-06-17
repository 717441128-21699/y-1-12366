import { Select, Space, Tag } from 'antd'
import { UserOutlined, SwapOutlined } from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'

const roleLabelMap: Record<string, string> = {
  ADMIN: '管理员',
  SUPERVISOR: '主管',
  DISPATCHER: '调度员',
  DRIVER: '司机',
  CUSTOMER: '客户',
}

const roleColorMap: Record<string, string> = {
  ADMIN: 'red',
  SUPERVISOR: 'orange',
  DISPATCHER: 'blue',
  DRIVER: 'green',
  CUSTOMER: 'purple',
}

const UserSwitcher = () => {
  const { currentUser, setCurrentUser, users } = useAuth()

  return (
    <Space size={8}>
      <UserOutlined />
      <Select
        value={currentUser.id}
        onChange={(userId) => {
          const user = users.find(u => u.id === userId)
          if (user) setCurrentUser(user)
        }}
        style={{ width: 180 }}
        size="small"
        suffixIcon={<SwapOutlined />}
        options={users.map(u => ({
          value: u.id,
          label: (
            <Space size={4}>
              <span>{u.name}</span>
              <Tag color={roleColorMap[u.role] || 'default'} style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>
                {roleLabelMap[u.role] || u.role}
              </Tag>
            </Space>
          ),
        }))}
      />
    </Space>
  )
}

export default UserSwitcher
