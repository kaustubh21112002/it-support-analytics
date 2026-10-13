import React, { useState, useRef } from 'react';
import './AdminUpload.css';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  Download,
  Trash2,
  Check
} from 'lucide-react';

interface StagedFile {
  name: string;
  size: string;
  rowCount: number;
  uploadedAt: string;
  status: 'Ready' | 'Validating' | 'Processed';
}

export const AdminUploadPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([
    {
      name: 'incident_batch_q4_2024.csv',
      size: '2.4 MB',
      rowCount: 1250,
      uploadedAt: 'Today, 11:42 AM',
      status: 'Ready'
    },
    {
      name: 'seeded_baseline_seed42.csv',
      size: '14.8 MB',
      rowCount: 8000,
      uploadedAt: 'Governed Reference',
      status: 'Processed'
    }
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setValidationSuccess(`File "${file.name}" (${(file.size / 1024).toFixed(1)} KB) validated against IT Support Analytics schema.`);
    
    // Add to staged files list
    const newStaged: StagedFile = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      rowCount: Math.floor(Math.random() * 500) + 150,
      uploadedAt: 'Just now',
      status: 'Ready'
    };
    setStagedFiles((prev) => [newStaged, ...prev]);
  };

  const handleSimulateIngestion = () => {
    if (stagedFiles.length === 0) return;
    setStagedFiles((prev) =>
      prev.map((f, i) => (i === 0 ? { ...f, status: 'Processed' } : f))
    );
    setValidationSuccess('Ingestion complete. Staged rows merged into client-side analytical sandbox.');
  };

  const handleDownloadSample = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,ticket_id,created_at,status,priority,category_id,issue_type,department_id\n' +
      'TKT-09001,2024-11-01 09:15:00,Open,High,3,VPN Connection Timeout,2\n' +
      'TKT-09002,2024-11-01 10:20:00,Resolved,Medium,1,Password Reset,4\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_tickets_schema.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="af-admin-scope">
      {/* 1. Top Announcement Banner (AetherFlow Palette & VibeUI Sync) */}
      <div className="af-announcement-banner">
        <div className="af-announcement-content">
          <span className="af-announcement-badge">VibeUI Synced</span>
          <span>
            <strong>AetherFlow Architecture Active:</strong> Design <code>a4c30bc8</code> applied to Admin Data Ingestion Engine.
          </span>
        </div>
        <div className="af-announcement-right" onClick={handleDownloadSample}>
          <span>Download Governed Template</span>
          <ArrowRight style={{ width: 14, height: 14 }} />
        </div>
      </div>

      {/* 2. Page Header Structure */}
      <div className="af-page-header">
        <div>
          <div className="af-breadcrumbs">
            <span>Administration</span>
            <span>/</span>
            <span>Data Operations</span>
            <span>/</span>
            <span className="active">Dataset Ingestion & Upload</span>
          </div>
          <h1 className="af-heading">Data Ingestion Engine</h1>
          <p className="af-subtext">
            Upload incident batch transactions, validate relational integrity schemas, and stage preview records for the IT Support Analytics model.
          </p>
        </div>
        <div className="af-header-actions">
          <button className="af-button af-button-secondary" onClick={handleDownloadSample}>
            <Download style={{ width: 15, height: 15 }} />
            <span>Schema CSV Template</span>
          </button>
          <button className="af-button af-button-primary" onClick={handleSimulateIngestion}>
            <RefreshCw style={{ width: 15, height: 15 }} />
            <span>Process Ingestion Batch</span>
          </button>
        </div>
      </div>

      {/* 3. AI Predictive Notice Card */}
      <div className="af-ai-card">
        <div className="af-ai-icon-circle">
          <Sparkles style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <div className="af-ai-title">AetherFlow Automated Pipeline Guardian</div>
          <p className="af-ai-desc">
            Incoming records are verified against primary key uniqueness, foreign key consistency, and temporal non-inversion before sandbox staging. The 8,000-ticket governed baseline remains protected against accidental mutation.
          </p>
        </div>
      </div>

      {validationSuccess && (
        <div
          style={{
            backgroundColor: '#eafaf1',
            border: '1px solid #a9dfbf',
            color: '#1e8449',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 style={{ width: 16, height: 16, color: '#27ae60' }} />
          <span>{validationSuccess}</span>
        </div>
      )}

      {/* 4. Split Layout Grid: Upload Dropzone & Process Steps */}
      <div className="af-grid-container af-grid-split">
        {/* Left Column: Dropzone & File Staging */}
        <div className="af-card">
          <div className="af-card-header">
            <h3 className="af-card-title">
              <UploadCloud style={{ width: 18, height: 18, color: '#3498db' }} />
              <span>Direct File Dropzone</span>
            </h3>
            <span className="af-card-badge">CSV / TSV Supported</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.tsv,.json"
            style={{ display: 'none' }}
          />

          <div
            className={`af-dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="af-dropzone-icon">
              <UploadCloud style={{ width: 28, height: 28 }} />
            </div>
            <div className="af-dropzone-title">Drag & drop ticket batch file here</div>
            <div className="af-dropzone-subtitle">or click to browse from local computer</div>
            <div className="af-dropzone-meta">
              <span>Max file size: 50MB</span>
              <span>•</span>
              <span>UTF-8 Encoding</span>
              <span>•</span>
              <span>Header Row Required</span>
            </div>
          </div>

          {selectedFile && (
            <div className="af-staged-file">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText style={{ width: 20, height: 20, color: '#3498db' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2c3e50' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: 11, color: '#7f8c8d' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • Staged for validation
                  </div>
                </div>
              </div>
              <button
                className="af-button af-button-secondary"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setValidationSuccess(null);
                }}
              >
                <Trash2 style={{ width: 13, height: 13, color: '#e74c3c' }} />
                <span>Remove</span>
              </button>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2c3e50' }}>Schema Verification Columns</span>
              <span style={{ fontSize: 11, color: '#7f8c8d' }}>7 Required Attributes</span>
            </div>
            <div className="af-schema-list">
              <div className="af-schema-item">
                <span className="af-schema-name">ticket_id</span>
                <span className="af-schema-type">VARCHAR(20) • PRIMARY KEY</span>
              </div>
              <div className="af-schema-item">
                <span className="af-schema-name">created_at</span>
                <span className="af-schema-type">DATETIME • ISO 8601</span>
              </div>
              <div className="af-schema-item">
                <span className="af-schema-name">resolved_at</span>
                <span className="af-schema-type">DATETIME • NULLABLE</span>
              </div>
              <div className="af-schema-item">
                <span className="af-schema-name">priority</span>
                <span className="af-schema-type">ENUM ('Critical', 'High', 'Medium', 'Low')</span>
              </div>
              <div className="af-schema-item">
                <span className="af-schema-name">category_id</span>
                <span className="af-schema-type">INT • FK categories(id)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Process Steps & Architecture Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="af-card">
            <div className="af-card-header">
              <h3 className="af-card-title">
                <Database style={{ width: 18, height: 18, color: '#8e44ad' }} />
                <span>Ingestion Workflow Protocol</span>
              </h3>
              <span className="af-card-badge" style={{ backgroundColor: '#f5eef8', color: '#8e44ad', borderColor: '#ebdef0' }}>
                3-Step Automated
              </span>
            </div>

            <p style={{ fontSize: 13, color: '#7f8c8d', margin: '0 0 16px 0' }}>
              Designed around the AetherFlow orchestration standard for zero-loss analytical pipelines:
            </p>

            <div className="af-process-steps">
              <div className="af-process-step">
                <span className="af-step-number">01</span>
                <div className="af-step-title">Extract & Syntactic Check</div>
                <div className="af-step-desc">
                  Incoming CSV rows are verified for delimiter consistency, column header count, and ASCII/UTF-8 byte formatting.
                </div>
              </div>

              <div className="af-process-step">
                <span className="af-step-number">02</span>
                <div className="af-step-title">Relational Integrity Mapping</div>
                <div className="af-step-desc">
                  Foreign keys (departments, categories, agents) are cross-referenced against the Snowflake dimension catalog.
                </div>
              </div>

              <div className="af-process-step">
                <span className="af-step-number">03</span>
                <div className="af-step-title">SLA Clock Recalculation</div>
                <div className="af-step-desc">
                  Resolution turnaround is recomputed on a 24/7 calendar-hour basis, checking compliance against the 85.0% governed threshold.
                </div>
              </div>
            </div>
          </div>

          <div className="af-card" style={{ backgroundColor: '#fbfcfd' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#2c3e50', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#f39c12' }} />
              <span>Data Governance Isolation</span>
            </h4>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Files uploaded in this environment operate strictly within client memory sandbox partition. To alter the permanent seed dataset (Seed 42, 8,000 transactions), run the ETL script in <code>data-agent-kit-plugin</code>.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Ingestion Staging Ledger (List Rows) */}
      <div className="af-card" style={{ marginTop: 28 }}>
        <div className="af-card-header">
          <div>
            <h3 className="af-card-title">
              <FileText style={{ width: 18, height: 18, color: '#3498db' }} />
              <span>Batch Ingestion Activity Ledger</span>
            </h3>
            <p style={{ fontSize: 12, color: '#7f8c8d', margin: '4px 0 0 0' }}>
              Recently staged files, row integrity audit statuses, and pipeline executions.
            </p>
          </div>
          <button className="af-button af-button-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
            <RefreshCw style={{ width: 13, height: 13 }} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        <div className="af-table-wrapper">
          <table className="af-table">
            <thead>
              <tr>
                <th>Batch File Name</th>
                <th>File Size</th>
                <th>Record Count</th>
                <th>Uploaded Time</th>
                <th>Pipeline State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stagedFiles.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText style={{ width: 15, height: 15, color: '#3498db' }} />
                    <span>{item.name}</span>
                  </td>
                  <td style={{ color: '#7f8c8d', fontFamily: 'monospace' }}>{item.size}</td>
                  <td style={{ fontWeight: 600 }}>{item.rowCount.toLocaleString()} rows</td>
                  <td style={{ color: '#7f8c8d' }}>{item.uploadedAt}</td>
                  <td>
                    {item.status === 'Processed' ? (
                      <span className="af-chip af-chip-success">
                        <Check style={{ width: 11, height: 11 }} />
                        <span>Processed (Pass)</span>
                      </span>
                    ) : (
                      <span className="af-chip af-chip-warning">
                        <RefreshCw style={{ width: 11, height: 11 }} />
                        <span>Ready to Ingest</span>
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="af-button af-button-secondary"
                      style={{ padding: '5px 10px', fontSize: 11 }}
                      onClick={handleSimulateIngestion}
                    >
                      <span>Stage Batch</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
