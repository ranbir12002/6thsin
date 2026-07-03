import { useState, useEffect } from 'react';
import { useSiteData } from '../store/SiteDataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function FrontpageEditor() {
  const { frontpage, updateFrontpage } = useSiteData();

  const [heroText, setHeroText] = useState(frontpage.hero.text);
  const [fcHeading, setFcHeading] = useState(frontpage.featuredCollections.heading);
  const [fcBody, setFcBody] = useState(frontpage.featuredCollections.body);
  const [fcCta, setFcCta] = useState(frontpage.featuredCollections.ctaText);
  const [naTitle, setNaTitle] = useState(frontpage.newArrivals.title);

  useEffect(() => {
    setHeroText(frontpage.hero.text);
    setFcHeading(frontpage.featuredCollections.heading);
    setFcBody(frontpage.featuredCollections.body);
    setFcCta(frontpage.featuredCollections.ctaText);
    setNaTitle(frontpage.newArrivals.title);
  }, [frontpage]);

  function handleSave() {
    updateFrontpage({
      hero: { text: heroText },
      featuredCollections: {
        heading: fcHeading,
        body: fcBody,
        ctaText: fcCta,
      },
      newArrivals: {
        title: naTitle,
      },
    });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-anton text-[clamp(24px,5vw,40px)] text-[#F6F6F6] mb-1 sm:mb-2">Frontpage Editor</h1>
      <p className="text-xs sm:text-sm text-[rgba(246,246,246,0.5)] mb-6 sm:mb-8">
        Edit the content displayed on the homepage sections.
      </p>

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
        </CardContent>
      </Card>

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

      <Button onClick={handleSave} className="bg-crimson hover:bg-crimson/90 text-white w-full sm:w-auto">
        Save Changes
      </Button>
    </div>
  );
}
