import React, { useState, useEffect } from 'react';
import { X, Heart, CreditCard, DollarSign, Building2, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { normalizeUrl, isValidUrl } from '../utils/urlHelpers';

interface DonationModalProps {
  onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ onClose }) => {
  const [links, setLinks] = useState<{
    creditCard: string;
    paypal: string;
    bankTransfer: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDonationLinks();
  }, []);

  const loadDonationLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.donation.getLinks();
      setLinks(response.links);
    } catch (err: any) {
      console.error('Failed to load donation links:', err);
      setError(err.message || 'Failed to load donation options');
    } finally {
      setLoading(false);
    }
  };

  const handleDonateClick = (url: string, method: string) => {
    // Use helper function to validate and normalize URL
    if (!isValidUrl(url)) {
      alert(`${method} donations are not currently available. Please try another payment method or contact support.`);
      return;
    }
    
    // Normalize the URL to ensure it has a protocol
    const normalizedUrl = normalizeUrl(url);
    
    // Open the external link in a new tab
    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[1.5px] border-[var(--ispora-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#ff8787] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" strokeWidth={2} fill="white" />
            </div>
            <h2 className="font-syne text-lg font-bold text-[var(--ispora-text)]">Support Ispora</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center text-[var(--ispora-text2)] hover:text-[var(--ispora-text)] transition-all"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5">
            <p className="text-sm text-[var(--ispora-text2)] leading-relaxed">
              Help us keep mentorship <span className="font-semibold text-[var(--ispora-text)]">free for all</span>. Your support maintains our platform and helps connect African diaspora professionals with youth in Nigeria.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mb-3" />
              <p className="text-sm text-[var(--ispora-text3)]">Loading donation options...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={loadDonationLinks}
                className="text-sm text-[var(--ispora-brand)] hover:underline font-medium"
              >
                Try again
              </button>
            </div>
          ) : (() => {
            // Only show active payment methods
            const activePayments = [];
            if (links?.creditCard?.active && links?.creditCard?.url) {
              activePayments.push({
                key: 'creditCard',
                name: 'Credit Card',
                description: 'Pay securely with your credit or debit card',
                url: links.creditCard.url,
                icon: CreditCard,
                colorClass: 'brand',
                hoverBorder: 'hover:border-[var(--ispora-brand)]',
                hoverBg: 'hover:bg-[var(--ispora-brand-light)]',
                iconBg: 'bg-[var(--ispora-brand-light)]',
                iconHover: 'group-hover:bg-[var(--ispora-brand)]',
                iconColor: 'text-[var(--ispora-brand)]',
                iconColorHover: 'group-hover:text-white',
                externalColor: 'group-hover:text-[var(--ispora-brand)]',
              });
            }
            if (links?.paypal?.active && links?.paypal?.url) {
              activePayments.push({
                key: 'paypal',
                name: 'PayPal',
                description: 'Quick and easy payment with PayPal',
                url: links.paypal.url,
                icon: DollarSign,
                colorClass: 'paypal',
                hoverBorder: 'hover:border-[#0070ba]',
                hoverBg: 'hover:bg-[#0070ba]/5',
                iconBg: 'bg-[#0070ba]/10',
                iconHover: 'group-hover:bg-[#0070ba]',
                iconColor: 'text-[#0070ba]',
                iconColorHover: 'group-hover:text-white',
                externalColor: 'group-hover:text-[#0070ba]',
              });
            }
            if (links?.bankTransfer?.active && links?.bankTransfer?.url) {
              activePayments.push({
                key: 'bankTransfer',
                name: 'Bank Transfer',
                description: 'Direct bank transfer or wire transfer',
                url: links.bankTransfer.url,
                icon: Building2,
                colorClass: 'success',
                hoverBorder: 'hover:border-[var(--ispora-success)]',
                hoverBg: 'hover:bg-[var(--ispora-success-light)]',
                iconBg: 'bg-[var(--ispora-success-light)]',
                iconHover: 'group-hover:bg-[var(--ispora-success)]',
                iconColor: 'text-[var(--ispora-success)]',
                iconColorHover: 'group-hover:text-white',
                externalColor: 'group-hover:text-[var(--ispora-success)]',
              });
            }

            if (activePayments.length === 0) {
              return (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-gray-400" strokeWidth={2} />
                  </div>
                  <h3 className="font-semibold text-[var(--ispora-text)] mb-2">No Payment Methods Available</h3>
                  <p className="text-sm text-[var(--ispora-text3)]">
                    Donation options are currently being configured. Please check back later.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {activePayments.map((payment) => {
                  const Icon = payment.icon;
                  return (
                    <button
                      key={payment.key}
                      onClick={() => handleDonateClick(payment.url, payment.name)}
                      className={`w-full flex items-center gap-4 p-4 border-[1.5px] border-[var(--ispora-border)] rounded-xl ${payment.hoverBorder} ${payment.hoverBg} transition-all group`}
                    >
                      <div className={`w-12 h-12 rounded-lg ${payment.iconBg} ${payment.iconHover} flex items-center justify-center transition-all`}>
                        <Icon className={`w-6 h-6 ${payment.iconColor} ${payment.iconColorHover} transition-all`} strokeWidth={2} />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-[var(--ispora-text)] text-sm">{payment.name}</h3>
                        <p className="text-xs text-[var(--ispora-text3)]">{payment.description}</p>
                      </div>
                      <ExternalLink className={`w-4 h-4 text-[var(--ispora-text3)] ${payment.externalColor} transition-all`} strokeWidth={2} />
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {!loading && !error && (
            <div className="mt-5 p-4 bg-[var(--ispora-bg)] rounded-lg border border-[var(--ispora-border)]">
              <p className="text-xs text-[var(--ispora-text3)] leading-relaxed">
                <span className="font-semibold text-[var(--ispora-text2)]">Note:</span> You'll be redirected to a secure external payment page. All donations are voluntary and help keep Ispora free for everyone.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-[1.5px] border-[var(--ispora-border)]">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border-[1.5px] border-[var(--ispora-border)] text-[var(--ispora-text2)] rounded-lg text-sm font-semibold hover:bg-[var(--ispora-bg)] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;