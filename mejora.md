# 🎯 Design System – POS Tablet (Tokens + Componentes)

## 1. 🎨 Design Tokens

### 📦 1.1 Colores (Tailwind config)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: "#1E293B",
        surfaceLight: "#334155",

        primary: "#F59E0B",
        primaryHover: "#D97706",

        secondary: "#38BDF8",

        success: "#22C55E",
        error: "#EF4444",

        text: "#FFFFFF",
        textMuted: "#94A3B8",

        border: "#334155"
      }
    }
  }
}
```

---

### 🔤 1.2 Tipografía

```ts
fontFamily: {
  sans: ["Inter", "sans-serif"]
}
```

```css
/* tamaños base */
.title {
  @apply text-xl font-semibold;
}

.button {
  @apply text-base font-medium;
}

.product {
  @apply text-sm font-medium;
}
```

---

### 📏 1.3 Espaciado y tamaños

```ts
spacing: {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px"
}
```

---

### 🔲 1.4 Bordes y sombras

```css
.card {
  @apply rounded-2xl shadow-md;
}

.button-base {
  @apply rounded-xl shadow-sm;
}
```

---

## 2. 🧱 Layout Base

```tsx
<div className="flex h-screen bg-background text-text">
  
  {/* Categorías */}
  <aside className="w-[20%] bg-surface p-md flex flex-col gap-md">
    {/* botones */}
  </aside>

  {/* Productos */}
  <main className="w-[50%] p-md grid grid-cols-3 gap-md">
    {/* tarjetas */}
  </main>

  {/* Orden */}
  <section className="w-[30%] bg-surface p-md flex flex-col">
    {/* lista */}
  </section>

</div>
```

---

## 3. 🧩 Componentes Base

---

### 🔘 3.1 Botón (Base reutilizable)

```tsx
type ButtonProps = {
  variant?: "primary" | "secondary" | "danger"
}

export function Button({ variant = "primary", children }: ButtonProps) {
  const styles = {
    primary: "bg-primary text-black",
    secondary: "bg-secondary text-black",
    danger: "bg-error text-white"
  }

  return (
    <button
      className={`
        button-base
        h-14 w-full
        transition
        active:scale-95
        ${styles[variant]}
      `}
    >
      {children}
    </button>
  )
}
```

---

### 🍔 3.2 Tarjeta de Producto

```tsx
export function ProductCard({ name, price }) {
  return (
    <div
      className="
        bg-surfaceLight
        rounded-2xl
        p-md
        flex flex-col
        justify-between
        h-28
        active:scale-95
        transition
      "
    >
      <span className="product">{name}</span>
      <span className="text-primary font-bold">${price}</span>
    </div>
  )
}
```

---

### 📂 3.3 Categoría

```tsx
export function CategoryButton({ active, label }) {
  return (
    <button
      className={`
        h-14
        rounded-xl
        text-left px-md
        transition
        ${active ? "bg-primary text-black" : "bg-surfaceLight"}
      `}
    >
      {label}
    </button>
  )
}
```

---

### 🧾 3.4 Item de Orden

```tsx
export function OrderItem({ name, qty, price }) {
  return (
    <div className="flex justify-between items-center py-sm border-b border-border">
      <div>
        <div className="text-sm">{name}</div>
        <div className="text-xs text-textMuted">x{qty}</div>
      </div>

      <div className="font-bold">${price}</div>
    </div>
  )
}
```

---

### 💵 3.5 Panel de Cobro

```tsx
export function CheckoutPanel({ total }) {
  return (
    <div className="mt-auto flex flex-col gap-md">
      
      <div className="text-2xl font-bold text-right">
        ${total}
      </div>

      <Button variant="danger">Cancelar</Button>
      <Button variant="primary">Cobrar</Button>

    </div>
  )
}
```

---

## 4. ⚡ Animaciones (configurable)

```css
/* global.css */

button {
  transition: all 0.15s ease;
}

button:active {
  transform: scale(0.95);
}

.card-hover {
  transition: 0.2s;
}

.card-hover:active {
  transform: scale(0.97);
}
```

---

## 5. 🧠 Estados UI

### Loading (skeleton)

```tsx
<div className="animate-pulse bg-surfaceLight h-28 rounded-xl" />
```

---

### Error

```tsx
<div className="bg-error text-white p-md rounded-xl">
  Error al procesar
</div>
```

---

## 6. 🎱 Módulo Billar (base)

```tsx
export function TableCard({ number, status }) {
  return (
    <div className="
      bg-surfaceLight
      rounded-xl
      p-md
      flex flex-col
      justify-between
      h-24
    ">
      <span>Mesa {number}</span>
      <span className={
        status === "ocupada" ? "text-error" : "text-success"
      }>
        {status}
      </span>
    </div>
  )
}
```

---

## 7. 📱 Reglas de implementación

- NO usar modales complejos innecesarios
- Evitar navegación profunda
- Todo debe estar a 1–2 taps
- Mantener estado global ligero (Zustand recomendado)
- Optimizar renders (memo, keys)

---

## 8. 🚀 Stack sugerido

- UI: Tailwind + shadcn/ui (adaptado)
- Estado: Zustand
- Animaciones: Framer Motion (ligero)
- Backend: NestJS
- API: REST simple

---

## 9. 🧩 Estructura recomendada

```bash
/components
  /ui
    Button.tsx
    Card.tsx
  /pos
    ProductCard.tsx
    CategoryButton.tsx
    OrderItem.tsx
    CheckoutPanel.tsx

/pages
  POS.tsx

/store
  useOrderStore.ts
```

---

## 🔥 Regla final

> Si algo no se puede programar en 1–2 días, está mal diseñado.

Este sistema está pensado para crecer, pero primero debe ser **ultra simple y ultra rápido**.