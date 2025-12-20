import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Minus, Trash2, Check, Package, User, CreditCard, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProductSearch, formatFullPrice } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CartItem {
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  stock: number;
  image: string | null;
}

interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  user_id: string;
}

const PAYMENT_METHODS = [
  { id: "pix", label: "PIX" },
  { id: "credit_card", label: "Cartão de Crédito" },
  { id: "debit_card", label: "Cartão de Débito" },
  { id: "cash", label: "Dinheiro" },
];

const VendaManual = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [tempCustomerName, setTempCustomerName] = useState("");
  const [tempCustomerPhone, setTempCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { results: searchResults, searching, search } = useProductSearch();

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone, user_id")
        .order("full_name");
      
      if (data) {
        setCustomers(data);
      }
    };
    loadCustomers();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        search(searchQuery);
        setShowProductSearch(true);
      } else {
        setShowProductSearch(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  const addToCart = (product: typeof searchResults[0]) => {
    const existing = cart.find(item => item.product_id === product.id);
    
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        toast.error("Estoque insuficiente");
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock_quantity < 1) {
        toast.error("Produto sem estoque");
        return;
      }
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: 1,
        stock: product.stock_quantity,
        image: product.images?.[0] || null,
      }]);
    }
    
    setSearchQuery("");
    setShowProductSearch(false);
    toast.success("Produto adicionado");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.stock) {
          toast.error("Estoque insuficiente");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal; // Add shipping logic if needed

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao pedido");
      return;
    }

    if (!selectedCustomer && !tempCustomerName) {
      toast.error("Selecione ou crie um cliente");
      return;
    }

    setSubmitting(true);

    try {
      let userId = selectedCustomer;

      // If using temporary customer, we need to handle this differently
      // For now, we'll require an existing customer
      if (!userId) {
        toast.error("Por favor, selecione um cliente existente");
        setSubmitting(false);
        return;
      }

      // Validate stock before creating order
      for (const item of cart) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (!product || product.stock_quantity < item.quantity) {
          toast.error(`Estoque insuficiente para ${item.name}`);
          setSubmitting(false);
          return;
        }
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          subtotal,
          total,
          shipping_cost: 0,
          status: "paid", // Manual orders are immediately paid
          payment_method: paymentMethod,
          origin: "manual",
          notes: notes || null,
          shipping_address: {
            street: "Retirada na loja",
            number: "",
            neighborhood: "",
            city: "Uberlândia",
            state: "MG",
            zip: "",
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items (trigger will update stock)
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          amount: total,
          method: paymentMethod,
          status: "paid",
          provider: "manual",
        });

      if (paymentError) throw paymentError;

      toast.success("Pedido criado com sucesso!");
      
      // Reset form
      setCart([]);
      setSelectedCustomer("");
      setTempCustomerName("");
      setTempCustomerPhone("");
      setPaymentMethod("pix");
      setNotes("");

    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Venda Manual">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product Search & Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome ou SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showProductSearch && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 z-50 mt-2 liquid-card-strong p-2 max-h-80 overflow-y-auto"
              >
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium truncate">{product.name}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {product.sku && `SKU: ${product.sku} • `}
                        Estoque: {product.stock_quantity}
                      </p>
                    </div>
                    <span className="font-body font-medium text-primary">
                      {formatFullPrice(product.price)}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Cart */}
          <div className="liquid-card">
            <h3 className="font-display text-lg font-medium mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Itens do Pedido
            </h3>

            {cart.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground font-body">
                Busque e adicione produtos ao pedido
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium truncate">{item.name}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {item.sku && `#${item.sku} • `}
                        {formatFullPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-body font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-body font-medium min-w-[80px] text-right">
                      {formatFullPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="liquid-card">
            <h3 className="font-display text-lg font-medium mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Cliente
            </h3>

            <div className="space-y-4">
              <div>
                <Label>Cliente Existente</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.user_id} value={customer.user_id}>
                        {customer.full_name || "Sem nome"} {customer.phone && `(${customer.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedCustomer && (
                <>
                  <div className="text-center text-sm text-muted-foreground">ou</div>
                  <div>
                    <Label>Nome do Cliente</Label>
                    <Input
                      value={tempCustomerName}
                      onChange={(e) => setTempCustomerName(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={tempCustomerPhone}
                      onChange={(e) => setTempCustomerPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="liquid-card">
            <h3 className="font-display text-lg font-medium mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pagamento
            </h3>

            <div className="space-y-4">
              <div>
                <Label>Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações do pedido..."
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="liquid-card-strong">
            <h3 className="font-display text-lg font-medium mb-4">Resumo</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatFullPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-green-600">Grátis</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-display text-xl font-medium">
                <span>Total</span>
                <span className="text-primary">{formatFullPrice(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar e Abater Estoque
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default VendaManual;
