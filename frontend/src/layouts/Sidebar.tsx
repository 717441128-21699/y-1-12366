import { Layout, Menu, theme } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  CarOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons'
import { menuItems } from '@/router'

const { Sider } = Layout

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const handleMenuClick = (key: string) => {
    navigate(key)
  }

  const getIcon = (icon?: string) => {
    switch (icon) {
      case 'dashboard':
        return <DashboardOutlined />
      case 'order':
        return <ShoppingCartOutlined />
      case 'vehicle':
        return <CarOutlined />
      case 'temperature':
        return <ThunderboltOutlined />
      case 'workOrder':
        return <ToolOutlined />
      case 'sign':
        return <CheckSquareOutlined />
      case 'report':
        return <BarChartOutlined />
      case 'user':
        return <UserOutlined />
      case 'setting':
        return <SettingOutlined />
      case 'file':
        return <FileTextOutlined />
      case 'chart':
        return <BarChartOutlined />
      default:
        return null
    }
  }

  const items = menuItems.map((item) => ({
    key: item.path,
    icon: getIcon(item.icon),
    label: item.title,
  }))

  return (
    <Sider width={200} style={{ background: colorBgContainer }}>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1890ff',
        }}
      >
        管理系统
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ borderRight: 0 }}
      />
    </Sider>
  )
}

export default Sidebar
