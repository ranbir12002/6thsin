import { Link } from 'react-router';
import { useSiteData } from '../store/SiteDataContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsList() {
  const { products, deleteProduct } = useSiteData();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6 sm:mb-8">
        <h1 className="font-anton text-[clamp(24px,5vw,40px)] text-[#F6F6F6]">Products</h1>
        <Link to="/admin/products/new" className="w-full sm:w-auto">
          <Button className="bg-crimson hover:bg-crimson/90 text-white w-full sm:w-auto">Add Product</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-[#222] overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#222] hover:bg-transparent">
              <TableHead className="text-[rgba(246,246,246,0.5)] whitespace-nowrap">Name</TableHead>
              <TableHead className="text-[rgba(246,246,246,0.5)] whitespace-nowrap hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-[rgba(246,246,246,0.5)] whitespace-nowrap">Price</TableHead>
              <TableHead className="text-[rgba(246,246,246,0.5)] whitespace-nowrap hidden md:table-cell">Colors</TableHead>
              <TableHead className="text-[rgba(246,246,246,0.5)] whitespace-nowrap text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow className="border-[#222] hover:bg-transparent">
                <TableCell colSpan={5} className="text-center text-[rgba(246,246,246,0.4)] py-12">
                  No products yet
                </TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.id} className="border-[#222] hover:bg-[#151515]">
                  <TableCell>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded shrink-0"
                      />
                      <span className="text-sm sm:text-base text-[#F6F6F6] font-medium truncate max-w-[120px] sm:max-w-none">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[rgba(246,246,246,0.7)] text-sm hidden sm:table-cell">{product.category}</TableCell>
                  <TableCell className="text-[#F6F6F6] text-sm whitespace-nowrap">{product.price}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex gap-1">
                      {product.colors?.slice(0, 4).map(c => (
                        <span
                          key={c.hex}
                          className="inline-block w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-[#333] shrink-0"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                      {(product.colors?.length ?? 0) > 4 && (
                        <span className="text-[10px] text-[rgba(246,246,246,0.4)] self-center">+{product.colors!.length - 4}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <Link to={`/admin/products/${product.id}/edit`}>
                        <Button variant="ghost" size="icon" className="size-8 sm:size-9 text-[rgba(246,246,246,0.5)] hover:text-[#F6F6F6]">
                          <Pencil className="size-3.5 sm:size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 sm:size-9 text-[rgba(246,246,246,0.5)] hover:text-red-500"
                        onClick={async () => {
                          if (confirm(`Delete "${product.name}"?`)) {
                            try {
                              await deleteProduct(product.id);
                              toast.success('Product deleted successfully');
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to delete product');
                            }
                          }
                        }}
                      >
                        <Trash2 className="size-3.5 sm:size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
