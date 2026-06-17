import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const { Content } = Layout

const BasicLayout = () => {
  return (
    <Layout style={{ height: '100vh' }}>
      <Sidebar />
      <Layout>
        <Topbar />
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: '#fff',
            borderRadius: 4,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default BasicLayout
