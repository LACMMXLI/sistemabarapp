import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { ProductOperational } from "@barapp/contracts";
import { createOrRecoverQuickSale } from "../lib/quickSaleApi";
import { fetchOrder, addOrderItem, updateOrderItemQuantity } from "../lib/ordersApi";
import { fetchCategories, fetchProducts } from "../lib/catalogApi";
import { fetchTables } from "../lib/tablesApi";
import { ApiError } from "../lib/api";
import { ORDER_POLL_INTERVAL_MS } from "@barapp/config";
import { useToast } from "../hooks/useToast";
import { OfflineBanner } from "../components/OfflineBanner";
import { QuickSaleHeader, type StockFilter } from "../components/quick-sale/QuickSaleHeader";
import { CategoryTabs } from "../components/quick-sale/CategoryTabs";
import { QuickSaleProductGrid } from "../components/quick-sale/QuickSaleProductGrid";
import { PersistentCart } from "../components/quick-sale/PersistentCart";

export function QuickSalePage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const { data: bootstrapOrder } = useQuery({
    queryKey: ["quick-sale-bootstrap"],
    queryFn: createOrRecoverQuickSale,
    staleTime: Infinity,
  });

  const { data: order } = useQuery({
    queryKey: ["order", bootstrapOrder?.id],
    queryFn: () => fetchOrder(bootstrapOrder!.id),
    enabled: !!bootstrapOrder?.id,
    refetchInterval: ORDER_POLL_INTERVAL_MS,
  });

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const {
    data: products,
    isLoading: loadingProducts,
    isError: productsError,
  } = useQuery({ queryKey: ["products", categoryId], queryFn: () => fetchProducts(categoryId ?? undefined) });
  const { data: tables } = useQuery({ queryKey: ["tables"], queryFn: fetchTables });

  const filteredProducts = useMemo(() => {
    let list = products ?? [];
    const term = search.trim().toLowerCase();
    if (term) list = list.filter((p) => p.name.toLowerCase().includes(term));
    if (stockFilter === "AVAILABLE") list = list.filter((p) => p.stockStatus !== "OUT_OF_STOCK");
    if (stockFilter === "OUT_OF_STOCK") list = list.filter((p) => p.stockStatus === "OUT_OF_STOCK");
    return list;
  }, [products, search, stockFilter]);

  const cartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of order?.items ?? []) {
      if (item.cancelledAt) continue;
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
    }
    return map;
  }, [order]);

  function resetQuickSale() {
    setSelectedTableId(null);
    queryClient.removeQueries({ queryKey: ["quick-sale-bootstrap"] });
    queryClient.invalidateQueries({ queryKey: ["quick-sale-bootstrap"] });
  }

  async function handleSelectProduct(product: ProductOperational) {
    if (!order) return;
    const existing = order.items.find((i) => i.productId === product.id && !i.cancelledAt);
    try {
      if (existing) {
        await updateOrderItemQuantity(order.id, existing.id, existing.quantity + 1);
      } else {
        await addOrderItem(order.id, product.id);
      }
      queryClient.invalidateQueries({ queryKey: ["order", order.id] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo agregar el producto.");
    }
  }

  if (!order) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-pos-bg">
        <Loader2 className="h-8 w-8 animate-spin text-pos-textMuted" />
      </div>
    );
  }

  const canEdit = order.status === "OPEN";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-pos-bg text-pos-textPrimary">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 blur-md"
        style={{ backgroundImage: "url(/brand/fondo.png)" }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-pos-bg/85" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <OfflineBanner />
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,72%)_minmax(320px,28%)]">
          <div className="flex min-h-0 flex-col border-b border-pos-borderSoft md:border-b-0 md:border-r">
            <QuickSaleHeader search={search} onSearchChange={setSearch} stockFilter={stockFilter} onStockFilterChange={setStockFilter} />
            <CategoryTabs categories={categories} categoryId={categoryId} onSelect={setCategoryId} />
            <QuickSaleProductGrid
              products={filteredProducts}
              cartQuantities={cartQuantities}
              isLoading={loadingProducts}
              isError={productsError}
              disabled={!canEdit}
              searchActive={search.trim().length > 0}
              onSelect={handleSelectProduct}
            />
          </div>

          <PersistentCart
            order={order}
            tables={tables ?? []}
            selectedTableId={selectedTableId}
            onSelectTableId={setSelectedTableId}
            onOrderSettled={resetQuickSale}
          />
        </div>
      </div>
    </div>
  );
}
