import { theme } from 'antd'

function Browse() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: colorBgContainer }}>
      Browse
    </div>
  )
}

export default Browse;