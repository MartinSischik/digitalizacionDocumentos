import { useState, useEffect } from 'react'
import { DocumentUpload } from './componentes/DocumentUpload'
import { DocumentList } from './componentes/DocumentList'
import { ServerConfig } from './componentes/ServerConfig'
import { API_CONFIG } from './api/apiConfig'
import './style.css'
import mayanClient from './api/mayanClient'

interface Notification {
  show: boolean
  message: string
  type: 'success' | 'error' | 'info'
}

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [activeTab, setActiveTab] = useState<'upload' | 'browse' | 'api-test' | 'config'>('upload')
  const [apiStats, setApiStats] = useState({
    documents: 0,
    documentTypes: 0,
    tags: 0
  })
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'info'
  })

  useEffect(() => {
    checkApiStatus()
  }, [])

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  const checkApiStatus = async () => {
  setApiStatus('checking')
  try {
    // Usa mayanClient para consistencia
    const [docsRes, typesRes] = await Promise.allSettled([
      mayanClient.get('/documents/'),
      mayanClient.get('/document_types/')
    ])

    const connected = docsRes.status === 'fulfilled' && docsRes.value.status === 200
    setApiStatus(connected ? 'connected' : 'error')

    if (connected) {
      const docsData = docsRes.value.data
      const typesData = typesRes.status === 'fulfilled' ? typesRes.value.data : { count: 0 }

      setApiStats({
        documents: docsData.count || 0,
        documentTypes: typesData.count || 0,
        tags: 0
      })
      showNotification('API conectada correctamente', 'success')
    } else {
      showNotification('Error al conectar con la API', 'error')
    }
  } catch (error) {
    setApiStatus('error')
    showNotification('Error de conexión', 'error')
  }
}

  const handleConfigUpdate = (newConfig: any) => {
    showNotification('Configuración actualizada', 'success')
    checkApiStatus()
  }

  const runAPITest = async (endpoint: string) => {
  try {
    // Usa mayanClient en lugar de fetch directo
    const response = await mayanClient.get(endpoint)
    
    showNotification(
      `✅ Test exitoso: ${response.data.count || 0} items encontrados`, 
      'success'
    )
    
    // Muestra datos en consola para debugging
    console.log(`📊 Test ${endpoint}:`, {
      status: response.status,
      count: response.data.count,
      data: response.data.results ? response.data.results.slice(0, 3) : 'N/A'
    })
    
    return response.data
  } catch (error: any) {
    console.error(`❌ Test error ${endpoint}:`, error)
    showNotification(
      `Error en test ${endpoint}: ${error.response?.status || error.message}`, 
      'error'
    )
  }
}

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">📁</span>
            <h1>Mayan EDMS</h1>
            <span className="logo-subtitle">API Testing Interface</span>
          </div>
        </div>

        <div className="header-right">
          <div className={`api-status ${apiStatus}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {apiStatus === 'checking' ? 'Checking API...' :
               apiStatus === 'connected' ? 'API Connected' : 'API Error'}
            </span>
          </div>

          <div className="token-display">
            <span className="token-label">API Token:</span>
            <code className="token-value">{API_CONFIG.TOKEN.substring(0, 12)}...</code>
          </div>
        </div>
      </header>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <div className="stat-value">{apiStats.documents}</div>
            <div className="stat-label">Documents</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <div className="stat-value">{apiStats.documentTypes}</div>
            <div className="stat-label">Document Types</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <div className="stat-value">{apiStatus === 'connected' ? 'Online' : 'Offline'}</div>
            <div className="stat-label">API Status</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">v1.0</div>
            <div className="stat-label">Test Interface</div>
          </div>
        </div>
      </div>

      <main className="main-content">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <span className="tab-icon">📤</span>
            Upload Documents
          </button>

          <button
            className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <span className="tab-icon">📋</span>
            Browse Documents
          </button>

          <button
            className={`tab ${activeTab === 'api-test' ? 'active' : ''}`}
            onClick={() => setActiveTab('api-test')}
          >
            <span className="tab-icon">🔧</span>
            API Tests
          </button>

          <button
            className={`tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <span className="tab-icon">⚙️</span>
            Configuration
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'upload' && (
            <div className="upload-section">
              <div className="section-header">
                <h2>Upload Test Documents</h2>
                <p>Upload medical documents to test Mayan EDMS API integration</p>
              </div>
              <DocumentUpload onUploadSuccess={checkApiStatus} />
            </div>
          )}

          {activeTab === 'browse' && (
            <div className="browse-section">
              <div className="section-header">
                <h2>Document Browser</h2>
                <p>Browse and manage documents stored in Mayan EDMS</p>
              </div>
              <DocumentList />
            </div>
          )}

          {activeTab === 'api-test' && (
  <div className="api-test-section">
    <div className="section-header">
      <h2>API Test Suite</h2>
      <p>Run automated tests against Mayan EDMS API endpoints</p>
    </div>

    <div className="test-cards">
      <div className="test-card">
        <h3>📄 Documents API</h3>
        <div className="test-actions">
          <button className="test-btn" onClick={() => runAPITest('/documents/')}>
            Test GET /documents/
          </button>
          <button className="test-btn secondary" onClick={() => runAPITest('/document_types/')}>
            Test Document Types
          </button>
        </div>
      </div>

      <div className="test-card">
        <h3>🏷️ Tags & Metadata</h3>
        <div className="test-actions">
          <button className="test-btn" onClick={() => runAPITest('/tags/')}>
            List Tags
          </button>
          <button className="test-btn secondary" onClick={() => runAPITest('/metadata_types/')}>
            Metadata Types
          </button>
        </div>
      </div>

      <div className="test-card">
        <h3>⚡ Quick Tests</h3>
        <div className="test-actions">
          <button className="test-btn" onClick={checkApiStatus}>
            Test Connection
          </button>
          <button className="test-btn secondary" onClick={() => runAPITest('/about/')}>
            API Info
          </button>
        </div>
      </div>

      <div className="test-card">
        <h3>🔍 Search & Workflow</h3>
        <div className="test-actions">
          <button className="test-btn" onClick={() => runAPITest('/search/')}>
            Test Search
          </button>
          <button className="test-btn secondary" onClick={() => runAPITest('/workflows/')}>
            Workflows
          </button>
        </div>
      </div>
    </div>

    {/* Test avanzado */}
    <div className="advanced-tests" style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h4>🔧 Advanced Tests</h4>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
        <button className="test-btn small" onClick={() => runAPITest('/cabinets/')}>
          Cabinets
        </button>
        <button className="test-btn small" onClick={() => runAPITest('/checkouts/')}>
          Checkouts
        </button>
        <button className="test-btn small" onClick={() => runAPITest('/statistics/')}>
          Statistics
        </button>
        <button className="test-btn small" onClick={() => runAPITest('/permissions/')}>
          Permissions
        </button>
      </div>
    </div>
  </div>
)}

          {activeTab === 'config' && (
            <div className="config-section">
              <div className="section-header">
                <h2>Server Configuration</h2>
                <p>Configure your Mayan EDMS server connection settings</p>
              </div>
              <ServerConfig onConfigUpdate={handleConfigUpdate} />
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="server-info">
            <strong>Server:</strong> {API_CONFIG.BASE_URL}
          </div>
          <div className="footer-actions">
            <button className="footer-btn" onClick={checkApiStatus}>
              🔄 Refresh Status
            </button>
            <button className="footer-btn" onClick={() => {
              localStorage.clear()
              showNotification('Cache cleared', 'info')
            }}>
              🧹 Clear Cache
            </button>
          </div>
        </div>
      </footer>

      <div className={`notification ${notification.type} ${notification.show ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  )
  
}
export default App