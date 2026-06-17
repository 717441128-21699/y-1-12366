import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppRouter from './router'
import { NotificationProvider } from '@/contexts/NotificationContext'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <NotificationProvider>
        <AppRouter />
      </NotificationProvider>
    </ConfigProvider>
  )
}

export default App
