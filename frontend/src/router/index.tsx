import { Routes, Route, Navigate } from 'react-router-dom'
import BasicLayout from '@/layouts/BasicLayout'
import Dashboard from '@/pages/Dashboard/Dashboard'
import OrderList from '@/pages/Order/OrderList'
import VehicleList from '@/pages/Vehicle/VehicleList'
import TemperatureMonitor from '@/pages/Temperature/TemperatureMonitor'
import WorkOrderList from '@/pages/WorkOrder/WorkOrderList'
import SignList from '@/pages/Sign/SignList'
import ReportCenter from '@/pages/Report/ReportCenter'
import UserList from '@/pages/UserList'
import Settings from '@/pages/Settings'

export interface MenuItem {
  path: string
  title: string
  icon?: string
  element?: React.ReactNode
  children?: MenuItem[]
}

export const menuItems: MenuItem[] = [
  { path: '/dashboard', title: '仪表盘', icon: 'dashboard' },
  { path: '/orders', title: '订单管理', icon: 'order' },
  { path: '/vehicles', title: '车辆管理', icon: 'vehicle' },
  { path: '/temperature', title: '温控监控', icon: 'temperature' },
  { path: '/work-orders', title: '工单管理', icon: 'workOrder' },
  { path: '/signs', title: '签收管理', icon: 'sign' },
  { path: '/reports', title: '报表中心', icon: 'report' },
  { path: '/users', title: '用户管理', icon: 'user' },
  { path: '/settings', title: '系统设置', icon: 'setting' },
]

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<BasicLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="temperature" element={<TemperatureMonitor />} />
        <Route path="work-orders" element={<WorkOrderList />} />
        <Route path="signs" element={<SignList />} />
        <Route path="reports" element={<ReportCenter />} />
        <Route path="users" element={<UserList />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default AppRouter
