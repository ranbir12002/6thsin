import { useState, useEffect } from 'react';
import { useSiteData } from '../store/SiteDataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Upload, X } from 'lucide-react';

export default function FrontpageEditor() {
  const { frontpage, updateFrontpage, token } = useSiteData();

  const [heroText, setHeroText] = useState(frontpage.hero.text);
  const [fcHeading, setFcHeading] = useState(frontpage.featuredCollections.heading);
  const [fcBody, setFcBody] = useState(frontpage.featuredCollections.body);
  const [fcCta, setFcCta] = useState(frontpage.featuredCollections.ctaText);
  const [fcImages, setFcImages] = useState<string[]>(frontpage.featuredCollections.images || []);
  const [lbImages, setLbImages] = useState<string[]>(frontpage.lookbook?.images || []);
  const [naTitle, setNaTitle] = useState(frontpage.newArrivals.title);
  const [saving, setSaving] = useState(false);

  const [uploadingFc, setUploadingFc] = useState<boolean[]>([false, false]);
  const [uploadingLb, setUploadingLb] = useState(false);

  useEffect(() => {
    setHeroText(frontpage.hero.text);
    setFcHeading(frontpage.featuredCollections.heading);
    setFcBody(frontpage.featuredCollections.body);
    setFcCta(frontpage.featuredCollections.ctaText);
    setFcImages(frontpage.featuredCollections.images || []);
    setLbImages(frontpage.lookbook?.images || []);
    setNaTitle(frontpage.newArrivals.title);
  }, [frontpage]);

  const handleFcImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFc(prev => {
      const next = [...prev];
      next[slotIndex] = true;
      return next;
    });

    try {
      const formData = new FormData();
      formData.append('images', files[0]);

      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to upload image');
      }

      const newUrl = data.files[0].publicUrl;
      setFcImages(prev => {
        const next = [...prev];
        next[slotIndex] = newUrl;
        return next;
      });
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploadingFc(prev => {
        const next = [...prev];
        next[slotIndex] = false;
        return next;
      });
      e.target.value = '';
    }
  };

  const handleLbImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingLb(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to upload images');
      }

      const newUrls = data.files.map((f: { publicUrl: string }) => f.publicUrl);
      setLbImages(prev => [...prev, ...newUrls]);
      toast.success(`${data.files.length} lookbook image(s) uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload images');
    } finally {
      setUploadingLb(false);
      e.target.value = '';
    }
  };

  const removeLbImage = (indexToRemove: number) => {
    setLbImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  async function handleSave() {
    setSaving(true);
    try {
      await updateFrontpage({
        hero: { text: heroText },
        featuredCollections: {
          heading: fcHeading,
          body: fcBody,
          ctaText: fcCta,
          images: fcImages,
        },
        newArrivals: {
          title: naTitle,
        },
        lookbook: {
          images: lbImages,
        },
      });
      toast.success('Frontpage settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl pb-16">
      <h1 className="font-anton text-[clamp(24px,5vw,40px)] text-[#F6F6F6] mb-1 sm:mb-2">Frontpage Editor</h1>
      <p className="text-xs sm:text-sm text-[rgba(246,246,246,0.5)] mb-6 sm:mb-8">
        Edit the content and upload custom images displayed on the homepage sections.
      </p>

      {/* Hero Section */}
      <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="space-y-2">
            <Label htmlFor="heroText" className="text-[rgba(246,246,246,0.7)] text-sm">Hero Text (3D animation)</Label>
            <Input
              id="heroText"
              value={heroText}
              onChange={e => setHeroText(e.target.value)}
              className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
            />
            <p className="text-xs text-[rgba(246,246,246,0.4)]">
              Note: The hero text is rendered as a 3D animation. Changing it requires a full page reload to see the THREE.js text update.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Featured Collections */}
      <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Featured Collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="space-y-2">
            <Label htmlFor="fcHeading" className="text-[rgba(246,246,246,0.7)] text-sm">Heading</Label>
            <Input
              id="fcHeading"
              value={fcHeading}
              onChange={e => setFcHeading(e.target.value)}
              className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fcBody" className="text-[rgba(246,246,246,0.7)] text-sm">Body Text</Label>
            <Textarea
              id="fcBody"
              value={fcBody}
              onChange={e => setFcBody(e.target.value)}
              className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6] min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fcCta" className="text-[rgba(246,246,246,0.7)] text-sm">CTA Text</Label>
            <Input
              id="fcCta"
              value={fcCta}
              onChange={e => setFcCta(e.target.value)}
              className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
            />
          </div>
          
          {/* Featured Collections Images */}
          <div className="space-y-2 pt-2">
            <Label className="text-[rgba(246,246,246,0.7)] text-sm">Featured Images (2 side-by-side images)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1].map(idx => (
                <div key={idx} className="relative bg-[#0a0a0a] border border-[#222] rounded p-2 flex flex-col items-center">
                  <div className="w-full aspect-[4/3] bg-[#151515] overflow-hidden rounded mb-2 relative">
                    {fcImages[idx] ? (
                      <img
                        src={fcImages[idx]}
                        alt={`Featured Collection ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[rgba(246,246,246,0.3)]">
                        No Image
                      </div>
                    )}
                    {uploadingFc[idx] && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-crimson" />
                      </div>
                    )}
                  </div>
                  <Label
                    htmlFor={`fc-file-${idx}`}
                    className="cursor-pointer bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-xs text-[#F6F6F6] px-3 py-1.5 rounded transition w-full text-center flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingFc[idx] ? 'Uploading...' : fcImages[idx] ? 'Change Image' : 'Upload Image'}
                  </Label>
                  <input
                    id={`fc-file-${idx}`}
                    type="file"
                    accept="image/*"
                    onChange={e => handleFcImageUpload(e, idx)}
                    className="hidden"
                    disabled={uploadingFc[idx]}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Arrivals Title */}
      <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">New Arrivals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="space-y-2">
            <Label htmlFor="naTitle" className="text-[rgba(246,246,246,0.7)] text-sm">Section Title</Label>
            <Input
              id="naTitle"
              value={naTitle}
              onChange={e => setNaTitle(e.target.value)}
              className="bg-[#0a0a0a] border-[#333] text-[#F6F6F6]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lookbook Images */}
      <Card className="bg-[#111] border-[#222] mb-4 sm:mb-6">
        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Lookbook Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="space-y-2">
            <Label className="text-[rgba(246,246,246,0.7)] text-sm">Gallery Images</Label>
            
            {/* Grid of existing images */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {lbImages.map((url, idx) => (
                <div key={idx} className="relative bg-[#0a0a0a] border border-[#222] rounded p-2 flex flex-col group">
                  <div className="w-full aspect-[3/4] bg-[#151515] overflow-hidden rounded relative">
                    <img
                      src={url}
                      alt={`Look ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeLbImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-crimson text-white rounded-full p-1 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-[rgba(246,246,246,0.8)] font-mono">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              ))}

              {/* Upload Card */}
              <label className="border border-dashed border-[#333] hover:border-crimson/50 rounded p-2 aspect-[3/4] flex flex-col items-center justify-center cursor-pointer transition bg-[#0a0a0a] hover:bg-[#0d0d0d]">
                {uploadingLb ? (
                  <Loader2 className="w-8 h-8 animate-spin text-crimson mb-2" />
                ) : (
                  <Plus className="w-8 h-8 text-[rgba(246,246,246,0.4)] mb-2" />
                )}
                <span className="text-xs text-[rgba(246,246,246,0.6)] text-center font-medium">
                  {uploadingLb ? 'Uploading...' : 'Upload Images'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleLbImagesUpload}
                  className="hidden"
                  disabled={uploadingLb}
                />
              </label>
            </div>
            <p className="text-xs text-[rgba(246,246,246,0.4)]">
              Lookbook images are laid out in a 3-column parallax gallery on the desktop homepage. Standard size is 3:4 aspect ratio.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-crimson hover:bg-crimson/90 text-white w-full sm:w-auto" disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
