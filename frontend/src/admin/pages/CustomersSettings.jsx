import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { useAsync, useDebounce, useSEO } from '../../hooks';
import { adminService } from '../../services/adminService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { BrandLoader, Button, EmptyState, ErrorState, Field } from '../../components/ui';
import { formatDate, formatPrice } from '../../utils/format';
import { Card, PageHeader, SearchInput, Table, Td, Th } from '../components/shared';

export function Customers() {
  useSEO('Customers');
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 350);
  const { data, loading, error, reload } = useAsync(() => adminService.customers({ search: q || undefined }), [q]);
  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone who has placed an order (guests are grouped by mobile number)." />
      <Card>
        <div className="border-b border-line p-4"><div className="max-w-md"><SearchInput value={search} onChange={setSearch} placeholder="Search name, mobile or email…" label="Search customers" /></div></div>
        {loading && !data ? <BrandLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" text="Customers appear after their first order." />
        ) : (
          <Table>
            <thead><tr><Th>Customer</Th><Th>Mobile</Th><Th>Email</Th><Th>Location</Th><Th>Orders</Th><Th>Total spent</Th><Th>Last order</Th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.phone} className="hover:bg-surface-alt">
                  <Td className="font-semibold text-ink">{c.name}</Td>
                  <Td className="whitespace-nowrap"><Link to={`/admin/orders?search=${encodeURIComponent(c.phone)}`} className="text-gold-deep hover:underline">{c.phone}</Link></Td>
                  <Td className="break-all">{c.email || '—'}</Td><Td>{[c.city, c.state].filter(Boolean).join(', ')}</Td>
                  <Td>{c.orders}</Td><Td className="font-semibold">{formatPrice(c.spent)}</Td><Td className="whitespace-nowrap text-ink-muted">{formatDate(c.lastOrderAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

export function SettingsPage() {
  useSEO('Settings');
  const { data, loading, error, reload } = useAsync(() => adminService.settings(), []);
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => { if (data) setF(data); }, [data]);
  if (loading || !f) return error ? <ErrorState message={error} onRetry={reload} /> : <BrandLoader />;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const txt = (k, label, { className, ...props } = {}) => (
    <Field label={label} error={errors[k]} htmlFor={`s-${k}`} className={className}><input id={`s-${k}`} value={f[k] ?? ''} onChange={set(k)} className="field" {...props} /></Field>
  );

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const { _id, __v, key, createdAt, updatedAt, ...body } = f;
      body.deliveryCharge = Number(body.deliveryCharge) || 0;
      body.freeDeliveryAbove = Number(body.freeDeliveryAbove) || 0;
      setF(await adminService.updateSettings(body));
      setErrors({});
      toast.success('Settings saved');
    } catch (err) { setErrors(getFieldErrors(err)); toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pwBusy) return;
    const x = {};
    if (!pw.currentPassword) x.currentPassword = 'Required';
    if (pw.newPassword.length < 8) x.newPassword = 'At least 8 characters';
    if (pw.newPassword !== pw.confirm) x.confirm = 'Passwords do not match';
    setPwErr(x);
    if (Object.keys(x).length) return;
    setPwBusy(true);
    try { await adminService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }); toast.success('Password updated'); setPw({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (err) { setPwErr(getFieldErrors(err)); toast.error(getErrorMessage(err)); } finally { setPwBusy(false); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Store configuration and your account." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <form onSubmit={save} noValidate>
          <Card className="p-5 sm:p-6">
            <h2 className="heading text-base">Store</h2><span className="gold-rule mt-3" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {txt('announcement', 'Announcement bar text', { className: 'sm:col-span-2', maxLength: 200 })}
              {txt('deliveryCharge', 'Delivery charge (₹)', { type: 'number', min: 0 })}
              {txt('freeDeliveryAbove', 'Free delivery above (₹)', { type: 'number', min: 0 })}
              {txt('contactPhone', 'Contact phone')}{txt('contactEmail', 'Contact email', { type: 'email' })}
              {txt('whatsapp', 'WhatsApp number (with country code)', { placeholder: '919876543210' })}{txt('address', 'Address')}
              {txt('instagram', 'Instagram URL')}{txt('facebook', 'Facebook URL')}
            </div>
            <p className="mt-3 text-xs text-ink-muted">Set “Free delivery above” to 0 to always charge delivery.</p>
            <Button type="submit" variant="gold" loading={saving} className="mt-6">Save settings</Button>
          </Card>
        </form>

        <form onSubmit={changePw} noValidate>
          <Card className="p-5 sm:p-6">
            <h2 className="heading text-base">Change password</h2><span className="gold-rule mt-3" />
            <div className="mt-6 space-y-4">
              <Field label="Current password" error={pwErr.currentPassword} htmlFor="pw-cur"><input id="pw-cur" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className="field" /></Field>
              <Field label="New password" error={pwErr.newPassword} htmlFor="pw-new"><input id="pw-new" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className="field" /></Field>
              <Field label="Confirm new password" error={pwErr.confirm} htmlFor="pw-conf"><input id="pw-conf" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="field" /></Field>
            </div>
            <Button type="submit" variant="dark" loading={pwBusy} className="mt-6">Update password</Button>
          </Card>
        </form>
      </div>
    </>
  );
}
