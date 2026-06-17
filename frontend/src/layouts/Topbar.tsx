import { Layout, Breadcrumb, Avatar, Dropdown, Space } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { menuItems } from '@/router'
import NotificationCenter from '@/components/NotificationCenter'

const { Header } = Layout

const Topbar = () => {
  const location = useLocation()

  const getBreadcrumbItems = () => {
    const currentRoute = menuItems.find((item) => item.path === location.pathname)
    if (currentRoute) {
      return [{ title: currentRoute.title }]
    }
    return [{ title: '首页' }]
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  return (
    <Header
      style={{
        padding: '0 16px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Breadcrumb items={getBreadcrumbItems()} />
      <Space size={8}>
        <NotificationCenter />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
            <Avatar icon={<UserOutlined />} />
            <span>管理员</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}

export default Topbar
