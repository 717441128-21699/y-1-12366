import { Card, Form, Input, Switch, Button, Space } from 'antd'

const Settings = () => {
  const [form] = Form.useForm()

  const onFinish = (values: any) => {
    console.log('设置已更新:', values)
  }

  return (
    <Card title="系统设置">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          siteName: '管理系统',
          enableNotification: true,
          autoSave: true,
        }}
      >
        <Form.Item label="网站名称" name="siteName">
          <Input placeholder="请输入网站名称" />
        </Form.Item>
        <Form.Item label="网站描述" name="siteDescription">
          <Input.TextArea rows={4} placeholder="请输入网站描述" />
        </Form.Item>
        <Form.Item
          label="开启通知"
          name="enableNotification"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item label="自动保存" name="autoSave" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              保存设置
            </Button>
            <Button htmlType="reset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default Settings
