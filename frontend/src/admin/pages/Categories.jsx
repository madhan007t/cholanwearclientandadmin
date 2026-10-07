import { useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useAsync, useSEO } from '../../hooks';
import { adminService } from '../../services/adminService';
import { getErrorMessage, getFieldErrors } from '../../services/api';
import { BrandLoader, Button, ConfirmDialog, EmptyState, ErrorState, Field, Modal } from '../../components/ui';
import { assetUrl, slugify } from '../../utils/format';
import { Card, PageHeader, StatusBadge, Toggle } from '../components/shared';
import ImageManager from '../components/ImageManager';

const blank = { name: '', slug: '', description: '', image: '', isActive: true };

function CategoryForm({ category, onClose, onSaved }) {
  const [f, setF] = useState(category ? { ...blank, ...category } : blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!category);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (f.name.trim().length < 2) return setErrors({ name: 'Category name is required' });
    setSaving(true);
    try {
      const body = { name: f.name.trim(), slug: slugify(f.slug || f.name), description: f.description, image: f.image, isActive: f.isActive };
      if (category) await adminService.updateCategory(category._id, body); else await adminService.createCategory(body);
      toast.success(category ? 'Category updated' : 'Category created');
      onSaved();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal open onClose={saving ? () => {} : onClose} title={category ? 'Edit category' : 'Add category'} labelledBy="cat-title">
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <Field label="Name" required error={errors.name} htmlFor="cat-name"><input id="cat-name" autoFocus maxLength={80} value={f.name} aria-invalid={!!errors.name} onChange={(e) => setF({ ...f, name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} className={`field ${errors.name ? 'field-error' : ''}`} /></Field>
        <Field label="Slug" error={errors.slug} hint={`URL: /category/${f.slug || 'slug'}`} htmlFor="cat-slug"><input id="cat-slug" value={f.slug} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: slugify(e.target.value) }); }} className="field" /></Field>
        <Field label="Description" htmlFor="cat-desc"><textarea id="cat-desc" rows={3} maxLength={500} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="field" /></Field>
        <div>
          <span className="label">Image</span>
          <div className="max-w-[200px]"><ImageManager images={f.image ? [f.image] : []} max={1} folder="categories" onChange={(imgs) => setF({ ...f, image: imgs[0] || '' })} /></div>
        </div>
        <div className="flex items-center justify-between border-t border-line pt-4"><span className="text-sm font-semibold text-ink">Active</span><Toggle checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} label="Active" /></div>
        <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancel</button><Button type="submit" variant="gold" size="sm" loading={saving}>{category ? 'Save' : 'Create'}</Button></div>
      </form>
    </Modal>
  );
}

export default function Categories() {
  useSEO('Categories');
  const { data, loading, error, reload } = useAsync(() => adminService.categories(), []);
  const [editing, setEditing] = useState(null); // null | 'new' | category
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toggle = async (c, v) => {
    try { await adminService.updateCategory(c._id, { name: c.name, slug: c.slug, description: c.description, image: c.image, isActive: v }); reload(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };
  const remove = async () => {
    setDeleting(true);
    try { await adminService.deleteCategory(toDelete._id); toast.success('Category deleted'); setToDelete(null); reload(); }
    catch (err) { toast.error(getErrorMessage(err)); setToDelete(null); }
    finally { setDeleting(false); }
  };

  return (
    <>
      <PageHeader title="Categories" subtitle="Organise your catalogue." actions={<button className="btn-gold" onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Add category</button>} />
      {loading ? <BrandLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
        <Card><EmptyState icon={Tags} title="No categories yet" text="Create a category before adding products." action={<button className="btn-gold" onClick={() => setEditing('new')}>Add category</button>} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <Card key={c._id} className="flex flex-col">
              <div className="flex gap-4 p-4">
                <img src={assetUrl(c.image)} alt="" className="h-28 w-24 shrink-0 bg-surface-alt object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2"><h2 className="font-semibold text-ink">{c.name}</h2><StatusBadge status={c.isActive ? 'Active' : 'Inactive'} /></div>
                  <p className="mt-1 text-xs text-ink-muted">/category/{c.slug}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-ink-soft">{c.description || 'No description'}</p>
                  <p className="mt-2 text-xs font-semibold text-gold-deep">{c.productCount} product{c.productCount === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-line px-4 py-3">
                <div className="flex items-center gap-2 text-xs"><Toggle checked={c.isActive} onChange={(v) => toggle(c, v)} label={`${c.name} active`} /> Active</div>
                <div className="flex gap-2">
                  <button className="btn-outline btn-sm" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button className="btn-outline btn-sm hover:!border-danger hover:!bg-danger" onClick={() => setToDelete(c)} aria-label={`Delete ${c.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <CategoryForm category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      <ConfirmDialog open={!!toDelete} loading={deleting} title="Delete category" message={`Delete “${toDelete?.name}”? Categories that still contain products cannot be deleted - deactivate them instead.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  );
}
