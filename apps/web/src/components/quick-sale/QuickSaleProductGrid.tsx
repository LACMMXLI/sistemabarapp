import { Loader2, PackageX, WifiOff } from "lucide-react";
import type { ProductOperational } from "@barapp/contracts";
import { ProductCard } from "./ProductCard";

export function QuickSaleProductGrid({
  products,
  cartQuantities,
  isLoading,
  isError,
  disabled,
  searchActive,
  onSelect,
}: {
  products: ProductOperational[];
  cartQuantities: Map<string, number>;
  isLoading: boolean;
  isError: boolean;
  disabled?: boolean;
  searchActive: boolean;
  onSelect: (product: ProductOperational) => void;
}) {
  if (isError) {
    return (
      <EmptyState
        icon={WifiOff}
        title="No se pudieron cargar los productos"
        description="Verifica tu conexión e intenta de nuevo."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pos-textMuted" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageX}
        title={searchActive ? "Sin resultados" : "Sin productos"}
        description={searchActive ? "No encontramos productos que coincidan con tu búsqueda." : "Esta categoría no tiene productos disponibles."}
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            cartQuantity={cartQuantities.get(product.id) ?? 0}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof PackageX; title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <Icon className="h-9 w-9 text-pos-textMuted" strokeWidth={1.5} />
      <p className="text-sm font-semibold text-pos-textPrimary">{title}</p>
      <p className="text-xs text-pos-textMuted">{description}</p>
    </div>
  );
}
