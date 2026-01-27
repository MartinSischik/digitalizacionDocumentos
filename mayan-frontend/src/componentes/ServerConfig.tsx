import React, { useState } from 'react';
import { API_CONFIG } from '../api/apiConfig';

interface ServerConfigProps {
  onConfigUpdate: (config: any) => void;
}

export const ServerConfig: React.FC<ServerConfigProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState({
    baseUrl: localStorage.getItem('mayan_base_url') || API_CONFIG.BASE_URL,
    token: localStorage.getItem('mayan_token') || API_CONFIG.TOKEN,
    username: localStorage.getItem('mayan_username') || '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${config.baseUrl}/api/about/`, {
        headers: {
          'Authorization': `Token ${config.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `Conectado a Mayan EDMS v${data.version}`
        });
      } else {
        setTestResult({
          success: false,
          message: `Error ${response.status}: ${response.statusText}`
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Error de conexión: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfig = () => {
    localStorage.setItem('mayan_base_url', config.baseUrl);
    localStorage.setItem('mayan_token', config.token);
    localStorage.setItem('mayan_username', config.username);
    
    // Aquí deberías actualizar API_CONFIG
    (API_CONFIG as any).BASE_URL = config.baseUrl;
    (API_CONFIG as any).TOKEN = config.token;
    
    onConfigUpdate(config);
  };

  return (
    <div className="config-form">
      <div className="form-group">
        <label className="form-label" htmlFor="baseUrl">
          Server Base URL
        </label>
        <input
          type="text"
          id="baseUrl"
          name="baseUrl"
          value={config.baseUrl}
          onChange={handleChange}
          className="form-input"
          placeholder="http://localhost:8000"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="token">
          API Token
        </label>
        <input
          type="text"
          id="token"
          name="token"
          value={config.token}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter your API token"
        />
        <small className="form-hint">
          Generate token from Mayan EDMS → Settings → Authentication → Tokens
        </small>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="username">
          Username (optional)
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={config.username}
          onChange={handleChange}
          className="form-input"
          placeholder="admin"
        />
      </div>

      <div className="form-group password-input">
        <label className="form-label" htmlFor="password">
          Password (optional)
        </label>
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          name="password"
          value={config.password}
          onChange={handleChange}
          className="form-input"
          placeholder="••••••••"
        />
        <button
          type="button"
          className="toggle-password"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>

      <div className="config-actions">
        <button
          type="button"
          className="btn-test"
          onClick={testConnection}
          disabled={isTesting}
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          type="button"
          className="btn-save"
          onClick={saveConfig}
        >
          Save Configuration
        </button>
      </div>

      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          {testResult.success ? '✅' : '❌'} {testResult.message}
        </div>
      )}
    </div>
  );
};
