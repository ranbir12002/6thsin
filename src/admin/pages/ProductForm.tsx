import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSiteData } from '../store/SiteDataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';


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
  sizes: '',
  colors: '',
  images: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addProduct, updateProduct, getProductById } = useSiteData();
  const isEditing = !!id;

  const [form, setForm] = useState({ ...emptyForm });

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
          color: product.color,
          material: product.material,
          fit: product.fit,
          articleNumber: product.articleNumber,
          countryOfProduction: product.countryOfProduction || '',
          sizes: product.sizes.join(', '),
          colors: product.colors?.map(c => `${c.name}:${c.hex}`).join(', ') || '',
          images: product.images.filter(Boolean).join(', ') || '/images/product-1.jpg',
        });
      }
    }
  }, [id]);

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const sizes = form.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const colors = form.colors.split(',').map(c => {
      const [name, hex] = c.split(':').map(x => x.trim());
      return { name, hex };
    }).filter(c => c.name && c.hex);
    const images = form.images.split(',').map(s => s.trim()).filter(Boolean);

    const productData = {
      name: form.name,
      price: form.price,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      color: form.color,
      colors,
      sizes,
      material: form.material,
      careInstructions: ['Machine wash cold', 'Do not bleach', 'Tumble dry low'],
      fit: form.fit,
      articleNumber: form.articleNumber,
      countryOfProduction: form.countryOfProduction,
      images,
    };

    if (isEditing && id) {
      updateProduct(id, productData);
    } else {
      addProduct(productData);
    }

    navigate('/admin/products');
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-anton text-[clamp(24px,5vw,40px)] text-[#F6F6F6] mb-6 sm:mb-8">
        {isEditing ? 'Edit Product' : 'New Product'}
      </h1>

      <form onSubmit={handleSubmit}>
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
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-[rgba(246,246,246,0.7)] text-sm">Price (e.g. £89.00)</Label>
                <Input
                  id="price"
                  value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
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
                className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[rgba(246,246,246,0.7)] text-sm">Category</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={e => handleChange('category', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F6F6F6] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option>MENSWEAR</option>
                  <option>WOMENSWEAR</option>
                  <option>ACCESSORIES</option>
                  <option>ACTIVEWEAR</option>
                  <option>HOME</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-[rgba(246,246,246,0.7)] text-sm">Subcategory</Label>
                <Input
                  id="subcategory"
                  value={form.subcategory}
                  onChange={e => handleChange('subcategory', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color" className="text-[rgba(246,246,246,0.7)] text-sm">Default Color</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={e => handleChange('color', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="colors" className="text-[rgba(246,246,246,0.7)] text-sm">Colors (Name:hex, ...)</Label>
                <Input
                  id="colors"
                  value={form.colors}
                  onChange={e => handleChange('colors', e.target.value)}
                  placeholder="Black:#050505, White:#F6F6F6"
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sizes" className="text-[rgba(246,246,246,0.7)] text-sm">Sizes (comma separated)</Label>
              <Input
                id="sizes"
                value={form.sizes}
                onChange={e => handleChange('sizes', e.target.value)}
                placeholder="XS, S, M, L, XL"
                className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material" className="text-[rgba(246,246,246,0.7)] text-sm">Material</Label>
                <Input
                  id="material"
                  value={form.material}
                  onChange={e => handleChange('material', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fit" className="text-[rgba(246,246,246,0.7)] text-sm">Fit</Label>
                <Input
                  id="fit"
                  value={form.fit}
                  onChange={e => handleChange('fit', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
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
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countryOfProduction" className="text-[rgba(246,246,246,0.7)] text-sm">Country of Production</Label>
                <Input
                  id="countryOfProduction"
                  value={form.countryOfProduction}
                  onChange={e => handleChange('countryOfProduction', e.target.value)}
                  className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images" className="text-[rgba(246,246,246,0.7)] text-sm">Images (comma separated paths)</Label>
              <Input
                id="images"
                value={form.images}
                onChange={e => handleChange('images', e.target.value)}
                placeholder="/images/product-1.jpg, /images/product-2.jpg"
                className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" className="bg-crimson hover:bg-crimson/90 text-white w-full sm:w-auto">
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[#333] text-[#F6F6F6] hover:bg-[#222] w-full sm:w-auto"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
