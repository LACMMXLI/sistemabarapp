import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
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

  const {
    data: bootstrapOrder,
    isError: bootstrapIsError,
    error: bootstrapErrorObj,
    refetch: refetchBootstrap,
    isFetching: bootstrapFetching,
  } = useQuery({
    queryKey: ["quick-sale-bootstrap"],
    queryFn: createOrRecoverQuickSale,
    staleTime: Infinity,
    retry: 1,
  });

  const {
    data: order,
    isError: orderIsError,
    error: orderErrorObj,
    refetch: refetchOrder,
    isFetching: orderFetching,
  } = useQuery({
    queryKey: ["order", bootstrapOrder?.id],
    queryFn: () => fetchOrder(bootstrapOrder!.id),
    enabled: !!bootstrapOrder?.id,
    refetchInterval: ORDER_POLL_INTERVAL_MS,
    retry: 1,
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

  if (bootstrapIsError || orderIsError) {
    const err = bootstrapIsError ? bootstrapErrorObj : orderErrorObj;
    const message = err instanceof ApiError ? err.message : "No se pudo conectar con el servidor.";
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-pos-bg/70 px-6 text-center backdrop-blur-sm">
        <WifiOff className="h-9 w-9 text-pos-textMuted" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-pos-textPrimary">No se pudo abrir la venta rápida</p>
        <p className="max-w-sm text-xs text-pos-textMuted">{message}</p>
        <button
          type="button"
          onClick={() => (bootstrapIsError ? refetchBootstrap() : refetchOrder())}
          disabled={bootstrapFetching || orderFetching}
          className="mt-2 flex h-11 items-center gap-2 rounded-posMd border border-pos-amber/40 bg-pos-amber/10 px-4 text-sm font-semibold text-pos-amber transition hover:bg-pos-amber/15 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${bootstrapFetching || orderFetching ? "animate-spin" : ""}`} />
          Reintentar
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-pos-bg/70 backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-pos-textMuted" />
      </div>
    );
  }

  const canEdit = order.status === "OPEN";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-b from-pos-bg/70 via-pos-bg/50 to-pos-bg/80 text-pos-textPrimary backdrop-blur-sm">
      <div className="flex min-h-0 flex-1 flex-col">
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
