import type {
  User, Application, ApplicationDocument, ExtractedField,
  ValidationFinding, ValidationRun, OfficialAlert, AuditEvent,
  DashboardStats
} from '../types';

const API_BASE = 'http://localhost:8000/api';

class ApiService {
  private token: string | null = localStorage.getItem('aicte_token');

  setToken(t: string | null) {
    this.token = t;
    if (t) localStorage.setItem('aicte_token', t);
    else localStorage.removeItem('aicte_token');
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errDetail = 'Request failed';
      try {
        const errJson = await res.json();
        errDetail = errJson.detail || JSON.stringify(errJson);
      } catch (e) {
        errDetail = res.statusText;
      }
      throw new Error(errDetail);
    }

    return res.json();
  }

  // --- Auth ---
  async login(email: string, password: string):Promise<any> {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // --- Dashboard ---
  async getDashboardSummary(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/summary');
  }

  // --- Applications ---
  async getApplications(params: Record<string, any> = {}): Promise<Application[]> {
    const qs = new URLSearchParams(params).toString();
    return this.request<Application[]>(`/applications?${qs}`);
  }

  async getApplication(id: number): Promise<Application> {
    return this.request<Application>(`/applications/${id}`);
  }

  async createApplication(data: any): Promise<Application> {
    return this.request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async overrideCategory(id: number, newCategory: string, justification: string): Promise<Application> {
    return this.request<Application>(`/applications/${id}/category?new_category=${encodeURIComponent(newCategory)}&justification=${encodeURIComponent(justification)}`, {
      method: 'PATCH'
    });
  }

  // --- Documents ---
  async uploadDocument(applicationId: number, file: File, documentType: string): Promise<ApplicationDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return this.request<ApplicationDocument>(`/applications/${applicationId}/documents`, {
      method: 'POST',
      body: formData
    });
  }

  async getDocuments(applicationId: number): Promise<ApplicationDocument[]> {
    return this.request<ApplicationDocument[]>(`/applications/${applicationId}/documents`);
  }

  async getExtractedFields(applicationId: number): Promise<ExtractedField[]> {
    return this.request<ExtractedField[]>(`/applications/${applicationId}/extracted-fields`);
  }

  getDocumentFileUrl(docId: number): string {
    return `${API_BASE}/documents/${docId}/file`;
  }

  // --- Validation ---
  async triggerValidation(applicationId: number, idempotencyKey?: string): Promise<ValidationRun> {
    const qs = idempotencyKey ? `?idempotency_key=${encodeURIComponent(idempotencyKey)}` : '';
    return this.request<ValidationRun>(`/applications/${applicationId}/validate${qs}`, {
      method: 'POST'
    });
  }

  async getValidationStatus(applicationId: number): Promise<ValidationRun> {
    return this.request<ValidationRun>(`/applications/${applicationId}/validation-status`);
  }

  async getFindings(applicationId: number): Promise<ValidationFinding[]> {
    return this.request<ValidationFinding[]>(`/applications/${applicationId}/findings`);
  }

  async updateFindingDisposition(findingId: number, disposition: string, notes?: string): Promise<ValidationFinding> {
    return this.request<ValidationFinding>(`/findings/${findingId}/disposition`, {
      method: 'PATCH',
      body: JSON.stringify({ disposition, notes })
    });
  }

  // --- Reports & Evidence ---
  async getReport(applicationId: number): Promise<any> {
    return this.request<any>(`/applications/${applicationId}/report`);
  }

  getReportPdfUrl(applicationId: number): string {
    return `${API_BASE}/applications/${applicationId}/report/pdf`;
  }

  async getEvidence(applicationId: number): Promise<any> {
    return this.request<any>(`/applications/${applicationId}/evidence`);
  }

  // --- Alerts ---
  async getAlerts(unresolvedOnly: boolean = false): Promise<OfficialAlert[]> {
    return this.request<OfficialAlert[]>(`/alerts?unresolved_only=${unresolvedOnly}`);
  }

  async updateAlert(alertId: number, isResolved: boolean, notes?: string): Promise<OfficialAlert> {
    return this.request<OfficialAlert>(`/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_resolved: isResolved, resolution_notes: notes })
    });
  }

  // --- Reviews & Decisions ---
  async recordDecision(applicationId: number, decision: { decision_type: string; notes: string; clarification_details?: string; official_signature: string }): Promise<any> {
    return this.request<any>(`/applications/${applicationId}/review`, {
      method: 'POST',
      body: JSON.stringify(decision)
    });
  }

  async getDecisions(applicationId: number): Promise<any[]> {
    return this.request<any[]>(`/applications/${applicationId}/reviews`);
  }

  async addComment(applicationId: number, commentText: string): Promise<any> {
    return this.request<any>(`/applications/${applicationId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment_text: commentText })
    });
  }

  async getComments(applicationId: number): Promise<any[]> {
    return this.request<any[]>(`/applications/${applicationId}/comments`);
  }

  // --- Checklists & Rules ---
  async getChecklistTemplates(): Promise<any> {
    return this.request<any>('/checklists');
  }

  async getApplicationChecklist(applicationId: number): Promise<any> {
    return this.request<any>(`/checklists/applications/${applicationId}`);
  }

  async getAllRules(): Promise<any> {
    return this.request<any>('/admin/rules');
  }

  // --- Audit ---
  async getAuditTrail(entityType?: string, entityId?: string): Promise<AuditEvent[]> {
    const params: Record<string, string> = {};
    if (entityType) params.entity_type = entityType;
    if (entityId) params.entity_id = entityId;
    const qs = new URLSearchParams(params).toString();
    return this.request<AuditEvent[]>(`/audit?${qs}`);
  }

  async verifyAuditChain(): Promise<{ is_valid: boolean; total_events_checked: number; error_explanation?: string }> {
    return this.request<any>('/audit/verify', { method: 'POST' });
  }

  // --- History & System ---
  async getInstitutionalHistory(applicationId: number): Promise<any> {
    return this.request<any>(`/history/applications/${applicationId}`);
  }

  async getSystemHealth(): Promise<any> {
    return this.request<any>('/system/health');
  }
}

export const api = new ApiService();
