import { useState, useEffect } from 'react'
import { DocumentUpload } from './componentes/DocumentUpload'
import { DocumentList } from './componentes/DocumentList'
import { API_CONFIG } from './api/apiConfig'
import './style.css'

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [activeTab, setActiveTab] = useState<'upload' | 'browse' | 'api-test'>('upload')
  const [apiStats, setApiStats] = useState({
    documents: 0,
    documentTypes: 0,
    tags: 0
  })

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    setApiStatus('checking')
    try {
      // Test múltiples endpoints
      const [docsRes, typesRes] = await Promise.allSettled([
        fetch(`${API_CONFIG.BASE_URL}/api/documents/documents/`, {
          headers: { 'Authorization': `Token ${API_CONFIG.TOKEN}` }
        }),
        fetch(`${API_CONFIG.BASE_URL}/api/document-types/document-types/`, {
          headers: { 'Authorization': `Token ${API_CONFIG.TOKEN}` }
        })
      ])

      const connected = docsRes.status === 'fulfilled' && docsRes.value.ok
      setApiStatus(connected ? 'connected' : 'error')
      
      if (connected) {
        const docsData = await docsRes.value.json()
        const typesData = typesRes.status === 'fulfilled' && typesRes.value.ok 
          ? await typesRes.value.json()
          : { count: 0 }
        
        setApiStats({
          documents: docsData.count || 0,
          documentTypes: typesData.count || 0,
          tags: 0 // Podrías añadir esta petición
        })
      }
    } catch (error) {
      setApiStatus('error')
    }
  }

  return (
    <div className="app">
      {/* Header */}
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

      {/* Stats Bar */}
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

      {/* Main Content */}
      <main className="main-content">
        {/* Navigation Tabs */}
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
        </div>

        {/* Tab Content */}
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
                    <button className="test-btn" onClick={async () => {
                      const res = await fetch(`${API_CONFIG.BASE_URL}/api/documents/documents/`, {
                        headers: { 'Authorization': `Token ${API_CONFIG.TOKEN}` }
                      })
                      alert(`Status: ${res.status}\nCount: ${(await res.json()).count}`)
                    }}>
                      Test GET /documents/
                    </button>
                    <button className="test-btn secondary">
                      Test Metadata
                    </button>
                  </div>
                </div>

                <div className="test-card">
                  <h3>🏷️ Document Types</h3>
                  <div className="test-actions">
                    <button className="test-btn" onClick={async () => {
                      const res = await fetch(`${API_CONFIG.BASE_URL}/api/document-types/document-types/`, {
                        headers: { 'Authorization': `Token ${API_CONFIG.TOKEN}` }
                      })
                      alert(`Document Types: ${(await res.json()).count}`)
                    }}>
                      List Types
                    </button>
                  </div>
                </div>

                <div className="test-card">
                  <h3>⚡ Quick Tests</h3>
                  <div className="test-actions">
                    <button className="test-btn" onClick={checkApiStatus}>
                      Test Connection
                    </button>
                    <button className="test-btn secondary">
                      Validate Token
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="server-info">
            <strong>Server:</strong> {API_CONFIG.BASE_URL}
          </div>
          <div className="footer-actions">
            <button className="footer-btn" onClick={checkApiStatus}>
              🔄 Refresh Status
            </button>
            <button className="footer-btn" onClick={() => console.clear()}>
              🧹 Clear Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App