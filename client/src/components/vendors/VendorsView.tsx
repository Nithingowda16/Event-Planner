import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Sparkles, Mail, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { VendorQuotationEntity, VendorStatus, EventEntity } from '@celebrateos/shared';
import { Card, CardHeader, CardTitle, CardBody } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { Spinner } from '../ui/Spinner.js';
import { CreateVendorModal } from './CreateVendorModal.js';
import { api, ApiError } from '../../services/api.js';
import { useToast } from '../ui/ToastContext.js';
import './VendorsView.css';

export interface VendorsViewProps {
  eventId?: string;
  currency?: string;
  event?: EventEntity;
}

const statusBadgeConfig: Record<VendorStatus, { label: string; variant: 'blue' | 'purple' | 'emerald' | 'rose' }> = {
  inquired: { label: 'Inquired', variant: 'blue' },
  shortlisted: { label: 'Shortlisted', variant: 'purple' },
  hired: { label: 'Hired & Confirmed', variant: 'emerald' },
  rejected: { label: 'Declined', variant: 'rose' },
};

export const VendorsView: React.FC<VendorsViewProps> = ({ eventId, currency, event }) => {
  const actualEventId = eventId || event?.id || '';
  const actualCurrency = currency || event?.currency || 'USD';
  const { showToast } = useToast();
  const [vendors, setVendors] = useState<VendorQuotationEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [mutatingVendorId, setMutatingVendorId] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    if (!actualEventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.vendors.list(actualEventId);
      setVendors(Array.isArray(result?.vendors) ? result.vendors : []);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load vendor quotations';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [actualEventId]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleStatusChange = async (vendor: VendorQuotationEntity, newStatus: VendorStatus) => {
    setMutatingVendorId(vendor.id);
    try {
      const result = await api.vendors.update(actualEventId, vendor.id, { status: newStatus });
      setVendors((prev) => prev.map((v) => (v.id === vendor.id ? result.vendor : v)));
      showToast(`Updated "${vendor.vendorName}" status to ${statusBadgeConfig[newStatus].label}.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update vendor status';
      showToast(msg, 'error');
    } finally {
      setMutatingVendorId(null);
    }
  };

  const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
    setMutatingVendorId(vendorId);
    try {
      await api.vendors.delete(actualEventId, vendorId);
      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      showToast(`Removed quotation for "${vendorName}".`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete vendor';
      showToast(msg, 'error');
    } finally {
      setMutatingVendorId(null);
    }
  };

  const formatAmount = (amt?: number | null) => {
    const safeAmt = typeof amt === 'number' && !isNaN(amt) ? amt : 0;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 2,
      }).format(safeAmt);
    } catch {
      return `${currency || 'USD'} ${safeAmt.toFixed(2)}`;
    }
  };

  const hiredTotal = useMemo(() => {
    const list = Array.isArray(vendors) ? vendors : [];
    return list
      .filter((v) => v.status === 'hired')
      .reduce((acc, v) => acc + (v.quotedAmount || 0), 0);
  }, [vendors]);

  const hiredCount = useMemo(() => {
    const list = Array.isArray(vendors) ? vendors : [];
    return list.filter((v) => v.status === 'hired').length;
  }, [vendors]);

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center' }} role="status">
        <Spinner size="lg" label="Loading vendor quotations..." color="#f59e0b" />
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--text-secondary)' }}>
          Retrieving verified quotes and contract records...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          backgroundColor: 'var(--accent-rose-soft)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--accent-rose)',
        }}
      >
        <AlertCircle size={32} style={{ marginBottom: 'var(--space-2)' }} aria-hidden="true" />
        <h3 style={{ margin: 0, color: 'inherit' }}>Failed to Load Vendors</h3>
        <p style={{ margin: 'var(--space-2) 0', color: 'inherit', opacity: 0.9 }}>{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchVendors}>
          Retry
        </Button>
      </div>
    );
  }

  const vendorList = Array.isArray(vendors) ? vendors : [];

  return (
    <div className="celebrate-vendors-view">
      {/* Anti-Hallucination Planning Ideas Disclaimer Banner */}
      <div className="celebrate-vendor-disclaimer" role="note">
        <Sparkles size={22} className="celebrate-vendor-disclaimer-icon" aria-hidden="true" />
        <div className="celebrate-vendor-disclaimer-text">
          <strong>AI Planning Guidance vs. Real Vendors:</strong> Generative AI models provide conceptual service ideas
          (e.g., &quot;Live Acoustic Trio&quot; or &quot;Seasonal Botanical Decor&quot;). To prevent fabricated reviews, fake phone
          numbers, or phantom businesses, CelebrateOS stores only user-entered estimates and confirmed quotations below.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <section aria-label="Vendor Quotation Summary" className="celebrate-vendor-summary-cards">
        <Card elevation="elevated" className="celebrate-vendor-card-item">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Quotes Tracked
          </span>
          <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {vendorList.length}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Across all event categories</span>
        </Card>

        <Card elevation="elevated" className="celebrate-vendor-card-item">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Hired Vendors
          </span>
          <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {hiredCount}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Confirmed contract engagements</span>
        </Card>

        <Card elevation="elevated" className="celebrate-vendor-card-item">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Committed Total
          </span>
          <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--accent-gold)' }}>
            {formatAmount(hiredTotal)}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Total contracted expenditures</span>
        </Card>
      </section>

      {/* Quotations Card */}
      <Card elevation="glass">
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <CardTitle as="h3">Verified Vendor Quotations</CardTitle>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsAddModalOpen(true)}
              id="add-vendor-quote-btn"
            >
              Record Quote
            </Button>
          </div>
        </CardHeader>

        <CardBody style={{ padding: 0, overflowX: 'auto' }}>
          {vendorList.length === 0 ? (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No vendor quotations recorded yet. Click &quot;Record Quote&quot; to log vendor proposals and contracts.</p>
            </div>
          ) : (
            <table className="celebrate-vendor-table">
              <thead>
                <tr>
                  <th scope="col">Vendor & Category</th>
                  <th scope="col">Quoted Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">Contract Notes</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorList.map((vendor) => {
                  const statusInfo = statusBadgeConfig[vendor.status];

                  return (
                    <tr key={vendor.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{vendor.vendorName}</span>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                            {vendor.category}
                          </span>
                          {vendor.contactEmail && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Mail size={11} aria-hidden="true" />
                              <span>{vendor.contactEmail}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--accent-gold)', fontSize: 'var(--font-size-base)' }}>
                          {formatAmount(vendor.quotedAmount)}
                        </strong>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Badge variant={statusInfo.variant} size="sm">
                            {statusInfo.label}
                          </Badge>
                          {vendor.status !== 'hired' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(vendor, 'hired')}
                              disabled={mutatingVendorId === vendor.id}
                              title="Mark as hired"
                              aria-label={`Mark ${vendor.vendorName} as hired`}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-emerald)',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'inline-flex',
                              }}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>

                      <td style={{ maxWidth: 280 }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          {vendor.deliverablesNotes || '—'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor.id, vendor.vendorName)}
                          disabled={mutatingVendorId === vendor.id}
                          aria-label={`Delete quote for ${vendor.vendorName}`}
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Create Vendor Modal */}
      <CreateVendorModal
        isOpen={isAddModalOpen}
        eventId={actualEventId}
        currency={actualCurrency}
        onClose={() => setIsAddModalOpen(false)}
        onVendorCreated={(newVendor) => {
          setVendors((prev) => [...prev, newVendor]);
          showToast(`Quotation for "${newVendor.vendorName}" saved successfully.`, 'success');
        }}
      />
    </div>
  );
};
