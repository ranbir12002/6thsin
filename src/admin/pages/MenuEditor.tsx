import { useState } from 'react';
import { useSiteData } from '../store/SiteDataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuEditor() {
  const { navMenu, addCategory, updateCategory, deleteCategory, addMenuItem, updateMenuItem, deleteMenuItem } = useSiteData();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryLabel, setCategoryLabel] = useState('');
  const [editingItem, setEditingItem] = useState<{ categoryId: string; itemId: string } | null>(null);
  const [itemLabel, setItemLabel] = useState('');
  const [itemHref, setItemHref] = useState('');

  async function handleAddCategory() {
    const label = prompt('Category label:');
    if (label && label.trim()) {
      try {
        await addCategory({ label: label.trim(), children: [] });
        toast.success('Category added successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to add category');
      }
    }
  }

  function handleStartEditCategory(cat: { id: string; label: string }) {
    setEditingCategory(cat.id);
    setCategoryLabel(cat.label);
  }

  async function handleSaveCategory(id: string) {
    if (categoryLabel.trim()) {
      try {
        await updateCategory(id, { label: categoryLabel.trim() });
        toast.success('Category updated successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update category');
      }
    }
    setEditingCategory(null);
    setCategoryLabel('');
  }

  async function handleDeleteCategory(id: string) {
    if (confirm('Delete this category and all its items?')) {
      try {
        await deleteCategory(id);
        toast.success('Category deleted successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete category');
      }
    }
  }

  async function handleAddItem(categoryId: string) {
    const label = prompt('Item label:');
    if (label && label.trim()) {
      const href = prompt('Item href (e.g. /category/sub):', '#');
      try {
        await addMenuItem(categoryId, { label: label.trim(), href: href || '#' });
        toast.success('Item added successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to add item');
      }
    }
  }

  function handleStartEditItem(categoryId: string, item: { id: string; label: string; href: string }) {
    setEditingItem({ categoryId, itemId: item.id });
    setItemLabel(item.label);
    setItemHref(item.href);
  }

  async function handleSaveItem() {
    if (editingItem && itemLabel.trim()) {
      try {
        await updateMenuItem(editingItem.categoryId, editingItem.itemId, {
          label: itemLabel.trim(),
          href: itemHref || '#',
        });
        toast.success('Item updated successfully');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update item');
      }
    }
    setEditingItem(null);
    setItemLabel('');
    setItemHref('');
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
        <div>
          <h1 className="font-anton text-[clamp(24px,5vw,40px)] text-[#F6F6F6]">Navigation Menu</h1>
          <p className="text-xs sm:text-sm text-[rgba(246,246,246,0.5)] mt-1">
            Manage the main navigation categories and their sub-items.
          </p>
        </div>
        <Button onClick={handleAddCategory} className="bg-crimson hover:bg-crimson/90 text-white w-full sm:w-auto">
          <Plus className="size-4 mr-2" /> Add Category
        </Button>
      </div>

      <Card className="bg-[#111] border-[#222]">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Menu Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 sm:px-6 pb-3 sm:pb-6">
          {navMenu.length === 0 ? (
            <p className="text-sm text-[rgba(246,246,246,0.4)] py-8 text-center">No menu categories yet.</p>
          ) : (
            navMenu.map(category => (
              <div key={category.id} className="border border-[#222] rounded-lg overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-3 bg-[#0a0a0a] gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => setExpandedCategory(
                        expandedCategory === category.id ? null : category.id
                      )}
                      className="text-[rgba(246,246,246,0.5)] hover:text-[#F6F6F6] shrink-0"
                    >
                      {expandedCategory === category.id ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                    {editingCategory === category.id ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
                        <Input
                          value={categoryLabel}
                          onChange={e => setCategoryLabel(e.target.value)}
                          className="bg-[#151515] border-[#333] text-[#F6F6F6] h-8 text-sm w-full"
                          autoFocus
                        />
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" onClick={() => handleSaveCategory(category.id)} className="h-8 text-xs bg-crimson hover:bg-crimson/90 text-white">
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)} className="h-8 text-xs">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <span className="font-anton text-base sm:text-lg text-[#F6F6F6] truncate">{category.label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <span className="text-xs text-[rgba(246,246,246,0.4)] mr-1 sm:mr-2 hidden sm:inline">{category.children.length} items</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-[rgba(246,246,246,0.5)] hover:text-[#F6F6F6]"
                      onClick={() => handleStartEditCategory(category)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-[rgba(246,246,246,0.5)] hover:text-red-500"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-[rgba(246,246,246,0.5)] hover:text-crimson"
                      onClick={() => handleAddItem(category.id)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {expandedCategory === category.id && (
                  <div className="border-t border-[#222] divide-y divide-[#222]">
                    {category.children.length === 0 ? (
                      <p className="text-xs text-[rgba(246,246,246,0.3)] px-4 py-4 text-center">
                        No sub-items. Click + to add one.
                      </p>
                    ) : (
                      category.children.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2.5 sm:pl-12 gap-2 sm:gap-0">
                          {editingItem?.categoryId === category.id && editingItem?.itemId === item.id ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 min-w-0 w-full">
                              <Input
                                value={itemLabel}
                                onChange={e => setItemLabel(e.target.value)}
                                className="bg-[#151515] border-[#333] text-[#F6F6F6] h-8 text-sm w-full sm:max-w-[180px]"
                                placeholder="Label"
                                autoFocus
                              />
                              <Input
                                value={itemHref}
                                onChange={e => setItemHref(e.target.value)}
                                className="bg-[#151515] border-[#333] text-[#F6F6F6] h-8 text-sm w-full sm:max-w-[180px]"
                                placeholder="/path"
                              />
                              <div className="flex gap-1 shrink-0">
                                <Button size="sm" onClick={handleSaveItem} className="h-8 text-xs bg-crimson hover:bg-crimson/90 text-white">
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="h-8 text-xs">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <span className="text-sm text-[#F6F6F6] truncate">{item.label}</span>
                                <span className="text-xs text-[rgba(246,246,246,0.3)] truncate hidden sm:inline">{item.href}</span>
                              </div>
                              <div className="flex items-center gap-1 self-end sm:self-auto">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-[rgba(246,246,246,0.5)] hover:text-[#F6F6F6]"
                                  onClick={() => handleStartEditItem(category.id, item)}
                                >
                                  <Pencil className="size-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-[rgba(246,246,246,0.5)] hover:text-red-500"
                                  onClick={async () => {
                                    if (confirm(`Delete "${item.label}"?`)) {
                                      try {
                                        await deleteMenuItem(category.id, item.id);
                                        toast.success('Item deleted successfully');
                                      } catch (err: any) {
                                        toast.error(err.message || 'Failed to delete item');
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
