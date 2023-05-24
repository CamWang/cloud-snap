import { Layout, Menu } from 'antd'
import { Content, Header, Footer } from 'antd/es/layout/layout'
import { Outlet, useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

function Root() {
  const navigate = useNavigate();
  const onClick = useCallback((e: {key: string}) => {
    menuItems.forEach(item => {
      if (item.key == parseInt(e.key)) {
        navigate(item.href);
      }
    });
  }, [navigate]);

  return (
    <Layout style={{display: 'flex', height:'100%'}}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Menu
          onClick={onClick}
          style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center' }}
          theme='dark'
          mode='horizontal'
          defaultSelectedKeys={['1']}
          items={menuItems} />
      </Header>
      <Content style={{ alignSelf: 'center', maxWidth: 990, minWidth: 890, overflow: 'hidden'  }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>Monash University ©2023 Created by Clayton A2 Group 23</Footer>
    </Layout>
  )
}

const menuItems = [{
  key: 1,
  label: 'Home',
  href: '/'
}, {
  key: 2,
  label: 'Browse',
  href: '/browse'
}]

export default Root;