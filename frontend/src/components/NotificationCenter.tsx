import { useState, useMemo, useEffect } from 'react'
import {
  Badge,
  Button,
  Drawer,
  Tabs,
  List,
  Empty,
  Tag,
  Space,
  Typography,
  Divider,
  Tooltip,
  Spin,
} from 'antd'
import {
  BellOutlined,
  ReadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useNotification } from '@/contexts/NotificationContext'
import { notificationSocket } from '@/utils/notification'
import type { Notification, NotificationType } from '@/types'
import dayjs from 'dayjs'

const { Text } = Typography

const TYPE_TABS: { key: NotificationType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <BellOutlined /> },
  { key: 'ORDER_STATUS', label: '订单状态', icon: <FileTextOutlined /> },
  { key: 'TEMPERATURE_ALERT', label: '温控告警', icon: <ExclamationCircleOutlined /> },
  { key: 'SIGN_EXCEPTION', label: '签收异常', icon: <CarOutlined /> },
]

const getTypeColor = (type: NotificationType): string => {
  const map: Record<NotificationType, string> = {
    ORDER_STATUS: 'blue',
    TEMPERATURE_ALERT: 'orange',
    SIGN_EXCEPTION: 'red',
  }
  return map[type]
}

const getTypeText = (type: NotificationType): string => {
  const map: Record<NotificationType, string> = {
    ORDER_STATUS: '订单状态',
    TEMPERATURE_ALERT: '温控告警',
    SIGN_EXCEPTION: '签收异常',
  }
  return map[type]
}

const formatRelativeTime = (dateStr: string): string => {
  const date = dayjs(dateStr)
  const now = dayjs()
  const diffMinutes = now.diff(date, 'minute')

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`
  const diffHours = now.diff(date, 'hour')
  if (diffHours < 24) return `${diffHours} 小时前`
  const diffDays = now.diff(date, 'day')
  if (diffDays < 7) return `${diffDays} 天前`
  return date.format('YYYY-MM-DD HH:mm')
}

interface NotificationItemProps {
  notification: Notification
  onRead: (id: number) => void
}

const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id)
    }
  }

  return (
    <List.Item
      onClick={handleClick}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        background: notification.isRead ? 'transparent' : '#f6ffed',
        borderLeft: notification.isRead ? 'none' : '3px solid #52c41a',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = notification.isRead ? '#f5f5f5' : '#f0ffe0'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = notification.isRead ? 'transparent' : '#f6ffed'
      }}
    >
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <Space size={8} wrap>
            <Tag color={getTypeColor(notification.type)} style={{ margin: 0 }}>
              {getTypeText(notification.type)}
            </Tag>
            <Text strong style={{ fontSize: 14 }}>
              {notification.title}
            </Text>
          </Space>
          {!notification.isRead && (
            <Badge status="processing" color="#52c41a" />
          )}
        </div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
          {notification.content}
        </Text>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={4}>
            <ClockCircleOutlined style={{ color: '#999', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </Space>
          {!notification.isRead && (
            <Button
              type="text"
              size="small"
              icon={<ReadOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                onRead(notification.id)
              }}
              style={{ fontSize: 12, padding: 0 }}
            >
              标为已读
            </Button>
          )}
        </div>
      </div>
    </List.Item>
  )
}

const NotificationCenter = () => {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationType | 'all'>('all')
  const [socketConnected, setSocketConnected] = useState(notificationSocket.isConnected())
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    getNotificationsByType,
  } = useNotification()

  useEffect(() => {
    const interval = setInterval(() => {
      setSocketConnected(notificationSocket.isConnected())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const displayedNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications
    return getNotificationsByType(activeTab)
  }, [activeTab, notifications, getNotificationsByType])

  const unreadByType = useMemo(() => ({
    all: unreadCount,
    ORDER_STATUS: getNotificationsByType('ORDER_STATUS').filter(n => !n.isRead).length,
    TEMPERATURE_ALERT: getNotificationsByType('TEMPERATURE_ALERT').filter(n => !n.isRead).length,
    SIGN_EXCEPTION: getNotificationsByType('SIGN_EXCEPTION').filter(n => !n.isRead).length,
  }), [unreadCount, getNotificationsByType])

  const handleTabClick = (key: string) => {
    setActiveTab(key as NotificationType | 'all')
  }

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const renderTabTitle = (tab: typeof TYPE_TABS[0]) => {
    const count = unreadByType[tab.key as keyof typeof unreadByType]
    const badgeColor = tab.key === 'all'
      ? '#1677ff'
      : tab.key === 'TEMPERATURE_ALERT'
      ? '#fa8c16'
      : tab.key === 'SIGN_EXCEPTION'
      ? '#ff4d4f'
      : '#52c41a'
    return (
      <span>
        {tab.icon} {tab.label}
        {count > 0 && (
          <Badge
            count={count}
            size="small"
            style={{ marginLeft: 4 }}
            color={badgeColor}
          />
        )}
      </span>
    )
  }

  return (
    <>
      <Tooltip title="通知中心">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 18 }} />}
            onClick={handleOpen}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Badge>
      </Tooltip>

      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <BellOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontWeight: 600 }}>通知中心</span>
              {unreadCount > 0 && (
                <Badge count={unreadCount} showZero={false} />
              )}
            </Space>
            {unreadCount > 0 && (
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={markAllAsRead}
                style={{ color: '#52c41a' }}
              >
                全部已读
              </Button>
            )}
          </div>
        }
        placement="right"
        onClose={handleClose}
        open={open}
        width={420}
        headerStyle={{ borderBottom: '1px solid #f0f0f0' }}
        bodyStyle={{ padding: 0 }}
      >
        <Spin spinning={isLoading} tip="加载通知中...">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabClick}
            tabBarStyle={{
              padding: '0 16px',
              margin: 0,
              borderBottom: '1px solid #f0f0f0',
            }}
            items={TYPE_TABS.map(tab => ({
              key: tab.key,
              label: renderTabTitle(tab),
              children: (
                <List
                  style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
                  dataSource={displayedNotifications}
                  locale={{
                    emptyText: (
                      <Empty
                        description="暂无通知"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ padding: '48px 0' }}
                      />
                    ),
                  }}
                  renderItem={(item) => (
                    <NotificationItem
                      key={item.id}
                      notification={item}
                      onRead={markAsRead}
                    />
                  )}
                />
              ),
            }))}
          />
        </Spin>
        <Divider style={{ margin: 0 }} />
        <div style={{ padding: 12, textAlign: 'center', background: '#fafafa' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            实时通知服务 {socketConnected ? '已连接' : '连接中...'}
          </Text>
        </div>
      </Drawer>
    </>
  )
}

export default NotificationCenter
