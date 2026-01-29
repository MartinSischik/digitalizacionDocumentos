import React, { useState, useEffect } from 'react';
import { documentApi, Document, DocumentFile } from '../api/documentApi';

export const DocumentList: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [files, setFiles] = useState<Record<number, DocumentFile[]>>({});
  const [loading, setLoading] = useState(true);

  const [preview, setPreview] = useState<{
    url: string;
    name: string;
    mimetype?: string;
  } | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const res = await documentApi.getAllDocuments();
    setDocuments(res.data.results || []);
    setLoading(false);
  };

  const loadFiles = async (docId: number) => {
    if (files[docId]) return;
    const res = await documentApi.getDocumentFiles(docId);
    setFiles(prev => ({ ...prev, [docId]: res.data.results || [] }));
  };

  const openPreview = (docId: number, file: DocumentFile) => {
    const url = documentApi.getFilePreviewUrl(docId, file.id);
    setPreview({
      url,
      name: file.filename,
      mimetype: file.mimetype
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>📚 Documentos</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
        gap: 16
      }}>
        {documents.map(doc => (
          <div key={doc.id} style={{
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            background: 'white'
          }}>
            <h3>{doc.label}</h3>

            <div style={{ fontSize: 13, opacity: 0.7 }}>
              ID {doc.id} • {new Date(doc.datetime_created).toLocaleDateString()}
            </div>

            <button onClick={() => loadFiles(doc.id)}>
              📁 Ver archivos
            </button>

            {files[doc.id] && files[doc.id].map(file => (
              <div key={file.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                padding: 8,
                borderRadius: 8,
                background: '#f6f6f6'
              }}>
                <span>{file.filename}</span>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openPreview(doc.id, file)}>
                    👁️
                  </button>

                  <a
                    href={documentApi.getFileDownloadUrl(doc.id, file.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ⬇️
                  </a>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ✅ MODAL PREVIEW */}
      {preview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: '90%',
            height: '90%',
            background: 'white',
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <strong>{preview.name}</strong>
              <button onClick={() => setPreview(null)}>✕</button>
            </div>

            {/* preview inteligente */}
            {preview.mimetype?.includes('image') ? (
              <img
                src={preview.url}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <iframe
                src={preview.url}
                style={{ flex: 1, border: 'none' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
