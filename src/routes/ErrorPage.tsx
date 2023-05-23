import { Typography } from 'antd';

const { Title, Link } = Typography;

function ErrorPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection:'column', backgroundColor: '#f5f5f5', height: '100%' }}>
      <Title>Opps!</Title>
      <Title level={5} type='secondary'>Something went wrong.</Title>
      <Link href='/'>Go back to home</Link>
    </div>
  )
}

export default ErrorPage;