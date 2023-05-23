import { theme, Tabs, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { message, Upload } from 'antd';

const { Dragger } = Upload;

const { Title, Text } = Typography;

function Home() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 16, marginTop: 24 }}>
      <div style={{display: 'flex', marginBottom: 16}}>
        <img src='/cloudsnap.png' style={{ width: 64, height: 64, marginRight: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Title style={{lineHeight: '46px', marginBottom:0}}>CloudSnap</Title>
          <Text strong type='secondary' style={{marginBottom: '18px'}}>A Serverless Image Storage System with Object Tagging</Text>
        </div>
      </div>
      <Tabs
        tabBarStyle={{ marginBottom: 0 }}
        type="card"
        items={[{
          key: '1',
          label: 'Search By Image',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: colorBgContainer, padding: 16 }}>
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for a single or bulk upload. Strictly prohibited from uploading company data or other
                  banned files.
                </p>
              </Dragger>
            </div>
          ),
        },{
          key: '2',
          label: 'Search By Tags',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: colorBgContainer, padding: 16 }}>
              <Text>Coming Soon</Text>
            </div>
          ),
        }]}
      />
    </div>
  )
}

const uploadProps: UploadProps = {
  name: 'file',
  multiple: true,
  action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
  onChange(info) {
    const { status } = info.file;
    if (status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (status === 'done') {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
  onDrop(e) {
    console.log('Dropped files', e.dataTransfer.files);
  },
};

export default Home;