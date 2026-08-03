import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSiteData } from '../store/SiteDataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  price: '',
  description: '',
  category: 'MENSWEAR',
  subcategory: '',
  color: '',
  material: '',
  fit: '',
  articleNumber: '',
  countryOfProduction: '',
};

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addProduct, updateProduct, getProductById, token, navMenu } = useSiteData();
  const isEditing = !!id;

  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);

  // Advanced fields states
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');
  
  const [productColors, setProductColors] = useState<{ name: string; hex: string }[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subcategory management state
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);
  const [customSubcategory, setCustomSubcategory] = useState('');

  // Load existing product values on edit mode
  useEffect(() => {
    if (id) {
      const product = getProductById(id);
      if (product) {
        setForm({
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          color: product.color || '',
          material: product.material || '',
          fit: product.fit || '',
          articleNumber: product.articleNumber || '',
          countryOfProduction: product.countryOfProduction || '',
        });
        setSelectedSizes(product.sizes || []);
        setProductColors(product.colors || []);
        setUploadedImages(product.images || []);

        // Check if current subcategory fits the default children of this category
        const categoryData = navMenu.find(c => c.label.toUpperCase() === product.category.toUpperCase());
        const isStandardSub = categoryData?.children.some(i => i.label.toLowerCase() === product.subcategory.toLowerCase());
        
        if (product.subcategory && !isStandardSub) {
          setIsCustomSubcategory(true);
          setCustomSubcategory(product.subcategory);
        } else {
          setIsCustomSubcategory(false);
        }
      }
    }
  }, [id, getProductById, navMenu]);

  // Handle standard text inputs changes
  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // --- Sizes Logic ---
  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const addCustomSize = () => {
    const trimmed = customSize.trim();
    if (!trimmed) return;
    if (selectedSizes.includes(trimmed)) {
      setCustomSize('');
      return;
    }
    setSelectedSizes(prev => [...prev, trimmed]);
    setCustomSize('');
  };

  // --- Colors Logic ---
  const addColor = () => {
    const name = newColorName.trim();
    if (!name) {
      toast.error('Please enter a color name');
      return;
    }
    if (productColors.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Color already added');
      return;
    }
    setProductColors(prev => [...prev, { name, hex: newColorHex }]);
    setNewColorName('');
    setNewColorHex('#000000');
  };

  const removeColor = (nameToRemove: string) => {
    setProductColors(prev => prev.filter(c => c.name !== nameToRemove));
  };

  // --- Image Upload (Proxy through backend to R2) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('images', file));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.sixthsin.com/api'}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to upload image files');
      }

      const uploadedUrls: string[] = data.files.map((f: { publicUrl: string }) => f.publicUrl);
      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image files');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const finalSubcategory = isCustomSubcategory ? customSubcategory.trim() : form.subcategory;

      if (uploadedImages.length === 0) {
        throw new Error('Please upload at least one image');
      }

      const productData = {
        name: form.name,
        price: form.price,
        description: form.description,
        category: form.category,
        subcategory: finalSubcategory,
        color: form.color,
        colors: productColors,
        sizes: selectedSizes,
        material: form.material,
        careInstructions: ['Machine wash cold', 'Do not bleach', 'Tumble dry low'],
        fit: form.fit,
        articleNumber: form.articleNumber,
        countryOfProduction: form.countryOfProduction,
        images: uploadedImages,
      };

      if (isEditing && id) {
        await updateProduct(id, productData);
        toast.success('Product updated successfully');
      } else {
        await addProduct(productData);
        toast.success('Product created successfully');
      }

      navigate('/admin/products');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while saving the product');
    } finally {
      setLoading(false);
    }
  }

  // Calculate dynamic subcategories based on chosen category
  const categoryData = navMenu.find(c => c.label.toUpperCase() === form.category.toUpperCase());
  const subcategoryOptions = categoryData ? categoryData.children.map(i => i.label) : [];

  return (
    <div className="max-w-3xl pb-12">
      <h1 className="font-anton text-[clamp(24px,5vw,40px)] text-[#F6F6F6] mb-6 sm:mb-8">
        {isEditing ? 'Edit Product' : 'New Product'}
      </h1>

      <form onSubmit={handleSubmit}>
        {/* --- Card 1: Basic Info --- */}
        <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[rgba(246,246,246,0.7)] text-sm">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] focus-visible:ring-crimson"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-[rgba(246,246,246,0.7)] text-sm">Price (e.g. £89.00)</Label>
                <Input
                  id="price"
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] focus-visible:ring-crimson"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[rgba(246,246,246,0.7)] text-sm">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] min-h-[100px] focus-visible:ring-crimson"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[rgba(246,246,246,0.7)] text-sm">Category Menu</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={e => {
                    const newCat = e.target.value;
                    handleChange('category', newCat);
                    // Reset subcategory selection
                    handleChange('subcategory', '');
                    setIsCustomSubcategory(false);
                  }}
                  className="flex h-10 w-full rounded-md border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F6F6F6] outline-none focus:ring-1 focus:ring-crimson focus:border-crimson"
                >
                  {navMenu.map(cat => (
                    <option key={cat.id} value={cat.label.toUpperCase()}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-[rgba(246,246,246,0.7)] text-sm">Subcategory</Label>
                {!isCustomSubcategory ? (
                  <select
                    id="subcategory"
                    value={form.subcategory}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setIsCustomSubcategory(true);
                      } else {
                        handleChange('subcategory', e.target.value);
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F6F6F6] outline-none focus:ring-1 focus:ring-crimson focus:border-crimson"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategoryOptions.map(subName => (
                      <option key={subName} value={subName}>{subName}</option>
                    ))}
                    <option value="__custom__" className="text-crimson font-medium">+ Add Custom Subcategory...</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom subcategory"
                      value={customSubcategory}
                      onChange={e => setCustomSubcategory(e.target.value)}
                      className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] focus-visible:ring-crimson"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#333] text-[#F6F6F6] hover:bg-[#222]"
                      onClick={() => {
                        setIsCustomSubcategory(false);
                        setCustomSubcategory('');
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Card 2: Sizes & Colors --- */}
        <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Sizes & Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-3 sm:px-6 pb-3 sm:pb-6">
            {/* Sizes selector */}
            <div className="space-y-3">
              <Label className="text-[rgba(246,246,246,0.7)] text-sm">Sizes (Select standard or add custom)</Label>
              <div className="flex flex-wrap gap-3">
                {STANDARD_SIZES.map(sz => {
                  const active = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`px-4 py-2 border transition-all duration-200 text-xs font-semibold cursor-pointer ${
                        active 
                          ? 'bg-crimson border-crimson text-white' 
                          : 'border-[#333] bg-[#0a0a0a] text-[rgba(246,246,246,0.7)] hover:text-white hover:border-[#555]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              {/* Custom Size field */}
              <div className="flex max-w-xs gap-2 pt-2">
                <Input
                  placeholder="Custom Size (e.g. UK 9)"
                  value={customSize}
                  onChange={e => setCustomSize(e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] text-xs h-9 focus-visible:ring-crimson"
                />
                <Button
                  type="button"
                  onClick={addCustomSize}
                  className="bg-[#222] hover:bg-[#333] text-[#F6F6F6] text-xs h-9"
                >
                  Add
                </Button>
              </div>

              {selectedSizes.length > 0 && (
                <p className="text-xs text-[rgba(246,246,246,0.4)] mt-1">
                  Selected: <span className="text-[#F6F6F6] font-medium">{selectedSizes.join(', ')}</span>
                </p>
              )}
            </div>

            {/* Colors selector */}
            <div className="space-y-3 border-t border-[rgba(246,246,246,0.05)] pt-6">
              <Label className="text-[rgba(246,246,246,0.7)] text-sm">Colors Options</Label>
              
              {/* Color creator */}
              <div className="flex flex-wrap gap-4 items-end bg-[#0a0a0a] p-3 border border-[#222]">
                <div className="space-y-1.5 flex-1 min-w-[140px]">
                  <Label className="text-[rgba(246,246,246,0.5)] text-xs">Color Name</Label>
                  <Input
                    placeholder="e.g. Midnight Black"
                    value={newColorName}
                    onChange={e => setNewColorName(e.target.value)}
                    className="bg-[#111] border-[#333] text-[#F6F6F6] text-xs h-9 focus-visible:ring-crimson"
                  />
                </div>
                <div className="space-y-1.5 w-16">
                  <Label className="text-[rgba(246,246,246,0.5)] text-xs">Color Code</Label>
                  <div className="relative h-9 w-full rounded border border-[#333] overflow-hidden bg-[#111] flex items-center justify-center">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={e => setNewColorHex(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div 
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ backgroundColor: newColorHex }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addColor}
                  className="bg-crimson hover:bg-crimson/90 text-white text-xs h-9 px-4"
                >
                  Add Color
                </Button>
              </div>

              {/* Colors List */}
              {productColors.length > 0 ? (
                <div className="flex flex-wrap gap-3 mt-3">
                  {productColors.map(c => (
                    <div
                      key={c.name}
                      className="flex items-center gap-2 border border-[#333] bg-[#0a0a0a] pl-2.5 pr-1.5 py-1.5 text-xs text-[#F6F6F6]"
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-[rgba(246,246,246,0.2)]"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name} ({c.hex})</span>
                      <button
                        type="button"
                        onClick={() => removeColor(c.name)}
                        className="text-[rgba(246,246,246,0.4)] hover:text-crimson ml-1.5 cursor-pointer text-sm font-semibold"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[rgba(246,246,246,0.3)]">No custom colors defined yet.</p>
              )}

              <div className="space-y-2 pt-2">
                <Label htmlFor="color" className="text-[rgba(246,246,246,0.7)] text-sm">Default Main Color Text (e.g. Charcoal)</Label>
                <Input
                  id="color"
                  placeholder="Primary color shown in details list"
                  value={form.color}
                  onChange={e => handleChange('color', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] focus-visible:ring-crimson"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Card 3: Image Gallery & Upload --- */}
        <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
            {/* Upload Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#333] hover:border-crimson hover:bg-[#0c0c0c] transition-all duration-300 py-10 flex flex-col items-center justify-center cursor-pointer text-center bg-[#0a0a0a]"
            >
              <svg className="w-8 h-8 text-[rgba(246,246,246,0.35)] mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="text-sm font-medium text-[#F6F6F6] mb-1">
                {uploading ? 'UPLOADING...' : 'UPLOAD NEW IMAGES'}
              </span>
              <span className="text-xs text-[rgba(246,246,246,0.4)]">
                Supports multiple JPG, PNG, WEBP files
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>

            {/* Uploading progress bar */}
            {uploading && (
              <div className="w-full bg-[#222] h-[2px] overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-crimson w-1/3 animate-scroll-dot" style={{ animationDuration: '1s' }} />
              </div>
            )}

            {/* Thumbnail Previews */}
            {uploadedImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-4">
                {uploadedImages.map((url, index) => (
                  <div 
                    key={index}
                    className="relative aspect-[3/4] bg-[#0c0c0c] border border-[#222] group overflow-hidden"
                  >
                    <img 
                      src={url} 
                      alt={`Product image ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    {/* Hover delete action overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1.5 bg-crimson text-white rounded hover:bg-crimson/95 transition-colors cursor-pointer text-xs font-semibold uppercase tracking-wider"
                      >
                        Delete
                      </button>
                    </div>
                    {/* Index marker */}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-[10px] text-[rgba(246,246,246,0.6)] font-bold">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[rgba(246,246,246,0.3)] italic pt-2">No product images uploaded yet. Minimum 1 image required to submit.</p>
            )}
          </CardContent>
        </Card>

        {/* --- Card 4: Other Details --- */}
        <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Fabric & Fit Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material" className="text-[rgba(246,246,246,0.7)] text-sm">Material</Label>
                <Input
                  id="material"
                  value={form.material}
                  onChange={e => handleChange('material', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] focus-visible:ring-crimson"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fit" className="text-[rgba(246,246,246,0.7)] text-sm">Fit</Label>
                <Input
                  id="fit"
                  value={form.fit}
                  onChange={e => handleChange('fit', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] focus-visible:ring-crimson"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="articleNumber" className="text-[rgba(246,246,246,0.7)] text-sm">Article Number</Label>
                <Input
                  id="articleNumber"
                  value={form.articleNumber}
                  onChange={e => handleChange('articleNumber', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] focus-visible:ring-crimson"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryOfProduction" className="text-[rgba(246,246,246,0.7)] text-sm">Country of Production</Label>
                <Input
                  id="countryOfProduction"
                  value={form.countryOfProduction}
                  onChange={e => handleChange('countryOfProduction', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] focus-visible:ring-crimson"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" className="bg-crimson hover:bg-crimson/90 text-white w-full sm:w-auto font-medium" disabled={loading || uploading}>
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Product')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[#333] text-[#F6F6F6] hover:bg-[#222] w-full sm:w-auto"
            onClick={() => navigate('/admin/products')}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
