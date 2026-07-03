import { useSiteData } from '../store/SiteDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function Dashboard() {
  const { products, frontpage } = useSiteData();

  const categories = [...new Set(products.map(p => p.category))];
  const totalProducts = products.length;

  return (
    <div>
      <h1 className="font-anton text-[clamp(28px,5vw,40px)] text-[#F6F6F6] mb-6 sm:mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card className="bg-[#111] border-[#222]">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-[rgba(246,246,246,0.6)]">Total Products</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-2xl sm:text-3xl font-bold text-[#F6F6F6]">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-[#222]">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-[rgba(246,246,246,0.6)]">Categories</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-2xl sm:text-3xl font-bold text-[#F6F6F6]">{categories.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-[#222]">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-[rgba(246,246,246,0.6)]">Frontpage Sections</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-2xl sm:text-3xl font-bold text-[#F6F6F6]">6</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-[#222]">
          <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-[11px] sm:text-sm font-medium text-[rgba(246,246,246,0.6)]">Hero Text</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-xs sm:text-sm text-[#F6F6F6] truncate">{frontpage.hero.text}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-[#111] border-[#222]">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Products by Category</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-3">
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-[rgba(246,246,246,0.8)]">{cat}</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-16 sm:w-32 h-2 bg-[#222] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-crimson rounded-full"
                          style={{ width: `${(count / totalProducts) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-[rgba(246,246,246,0.6)] w-5 sm:w-6 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222]">
          <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-base sm:text-lg text-[#F6F6F6]">Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[rgba(246,246,246,0.8)]">
              <p>Frontpage hero: <span className="text-[#F6F6F6]">{frontpage.hero.text}</span></p>
              <p>New arrivals title: <span className="text-[#F6F6F6]">{frontpage.newArrivals.title}</span></p>
              <p>Featured heading: <span className="text-[#F6F6F6]">{frontpage.featuredCollections.heading.substring(0, 40)}...</span></p>
              <p className="text-[10px] uppercase tracking-wider text-crimson mt-4">
                Admin panel v1.0 &mdash; data persisted in localStorage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
