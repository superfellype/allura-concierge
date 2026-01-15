import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Minus, Trash2, Check, Package, User, CreditCard, Loader2, MapPin, UserPlus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProductSearch, formatFullPrice } from "@/hooks/useProducts";
import { calculateNetAmount, formatCurrency } from "@/lib/price-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { id: "pix", label: "PIX", defaultTax: 0 },
  { id: "credit_card", label: "Cartão de Crédito", defaultTax: 3.5 },
  { id: "debit_card", label: "Cartão de Débito", defaultTax: 1.5 },
  { id: "cash", label: "Dinheiro", defaultTax: 0 },
  { id: "payment_link", label: "Link de Pagamento", defaultTax: 4.0 },
];

const VendaManual = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [tempCustomerName, setTempCustomerName] = useState("");
  const [tempCustomerPhone, setTempCustomerPhone] = useState("");
  const [tempCustomerCpf, setTempCustomerCpf] = useState("");
  const [tempCustomerBirthDate, setTempCustomerBirthDate] = useState("");
  const [tempCustomerAddress, setTempCustomerAddress] = useState({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [manualTaxPercentage, setManualTaxPercentage] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const { results: searchResults, searching, search } = useProductSearch();

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
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
  const effectiveTax = manualTaxPercentage || selectedMethod?.defaultTax || 0;
  const { gross, tax, net } = calculateNetAmount(subtotal, effectiveTax);
  const total = subtotal; // Net amount for display, but we charge full subtotal

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    const m = PAYMENT_METHODS.find(p => p.id === method);
    setManualTaxPercentage(m?.defaultTax || 0);
  };

  const handleCreateCustomer = async () => {
    if (!tempCustomerName.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    setCreatingCustomer(true);

    try {
      // Create a temporary user ID for manual sales (not a real auth user)
      const tempUserId = crypto.randomUUID();

      // Create profile for this customer
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: tempUserId,
          full_name: tempCustomerName.trim(),
          phone: tempCustomerPhone || null,
          preferences: {
            cpf: tempCustomerCpf || null,
            birth_date: tempCustomerBirthDate || null,
            address: tempCustomerAddress.street ? tempCustomerAddress : null,
            is_manual_customer: true
          }
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Update customers list and select the new customer
      const newCustomer: Customer = {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        user_id: profile.user_id
      };

      setCustomers(prev => [newCustomer, ...prev]);
      setSelectedCustomer(tempUserId);
      setTempCustomerName("");
      setTempCustomerPhone("");
      setTempCustomerCpf("");
      setTempCustomerBirthDate("");
      setTempCustomerAddress({ street: "", number: "", neighborhood: "", city: "", state: "", zip: "" });

      toast.success("Cliente criado com sucesso!");
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Erro ao criar cliente");
    } finally {
      setCreatingCustomer(false);
    }
  };

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

      // If no customer selected but has temp data, create customer first
      if (!userId && tempCustomerName) {
        await handleCreateCustomer();
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        userId = selectedCustomer;
      }

      if (!userId) {
        toast.error("Erro ao criar cliente. Tente novamente.");
        setSubmitting(false);
        return;
      }

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

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          subtotal,
          total,
          shipping_cost: 0,
          status: "paid",
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
      
      setCart([]);
      setSelectedCustomer("");
      setTempCustomerName("");
      setTempCustomerPhone("");
      setTempCustomerCpf("");
      setTempCustomerBirthDate("");
      setTempCustomerAddress({ street: "", number: "", neighborhood: "", city: "", state: "", zip: "" });
      setPaymentMethod("pix");
      setManualTaxPercentage(0);
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
                className="pl-11 glass-input"
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
                className="absolute top-full left-0 right-0 z-50 mt-2 liquid-glass-card p-2 max-h-80 overflow-y-auto"
              >
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted/30 overflow-hidden flex-shrink-0">
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
          <div className="liquid-glass-card p-6">
            <h3 className="font-display text-lg font-medium mb-5 flex items-center gap-2">
              <div className="glass-icon w-9 h-9">
                <Package className="w-4 h-4 text-primary" />
              </div>
              Itens do Pedido
            </h3>

            {cart.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground font-body">
                Busque e adicione produtos ao pedido
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/20">
                    <div className="w-14 h-14 rounded-lg bg-muted/30 overflow-hidden flex-shrink-0">
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
                        className="w-8 h-8 rounded-full glass-btn-secondary flex items-center justify-center"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-body font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="w-8 h-8 rounded-full glass-btn-secondary flex items-center justify-center"
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
          <div className="liquid-glass-card p-6">
            <h3 className="font-display text-lg font-medium mb-5 flex items-center gap-2">
              <div className="glass-icon w-9 h-9">
                <User className="w-4 h-4 text-primary" />
              </div>
              Cliente
            </h3>

            <Tabs defaultValue="existing" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="existing" className="flex-1">Cliente Existente</TabsTrigger>
                <TabsTrigger value="new" className="flex-1">Novo Cliente</TabsTrigger>
              </TabsList>

              <TabsContent value="existing">
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="glass-input">
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
              </TabsContent>

              <TabsContent value="new" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="font-body text-xs">Nome Completo *</Label>
                    <Input
                      value={tempCustomerName}
                      onChange={(e) => setTempCustomerName(e.target.value)}
                      placeholder="Nome completo"
                      className="glass-input mt-1"
                    />
                  </div>
                  <div>
                    <Label className="font-body text-xs">Telefone</Label>
                    <Input
                      value={tempCustomerPhone}
                      onChange={(e) => setTempCustomerPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="glass-input mt-1"
                    />
                  </div>
                  <div>
                    <Label className="font-body text-xs">CPF</Label>
                    <Input
                      value={tempCustomerCpf}
                      onChange={(e) => setTempCustomerCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="glass-input mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="font-body text-xs">Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={tempCustomerBirthDate}
                      onChange={(e) => setTempCustomerBirthDate(e.target.value)}
                      className="glass-input mt-1"
                    />
                  </div>
                </div>

                <details className="group">
                  <summary className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    <MapPin className="w-4 h-4" />
                    Endereço (opcional)
                  </summary>
                  <div className="mt-3 space-y-3 pl-6">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Label className="font-body text-xs">Rua</Label>
                        <Input
                          value={tempCustomerAddress.street}
                          onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, street: e.target.value }))}
                          placeholder="Rua"
                          className="glass-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-body text-xs">Nº</Label>
                        <Input
                          value={tempCustomerAddress.number}
                          onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, number: e.target.value }))}
                          placeholder="Nº"
                          className="glass-input mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="font-body text-xs">Bairro</Label>
                        <Input
                          value={tempCustomerAddress.neighborhood}
                          onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                          placeholder="Bairro"
                          className="glass-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-body text-xs">Cidade</Label>
                        <Input
                          value={tempCustomerAddress.city}
                          onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Cidade"
                          className="glass-input mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="font-body text-xs">Estado</Label>
                        <Input
                          value={tempCustomerAddress.state}
                          onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="UF"
                          className="glass-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="font-body text-xs">CEP</Label>
                        <Input
                          value={tempCustomerAddress.zip}
                          onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, zip: e.target.value }))}
                          placeholder="00000-000"
                          className="glass-input mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </details>

                <Button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={creatingCustomer || !tempCustomerName.trim()}
                  className="w-full mt-2"
                  variant="outline"
                >
                  {creatingCustomer ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Criar Cliente
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Payment */}
          <div className="liquid-glass-card p-6">
            <h3 className="font-display text-lg font-medium mb-5 flex items-center gap-2">
              <div className="glass-icon w-9 h-9">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              Pagamento
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="font-body">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <SelectTrigger className="glass-input mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.label} {method.defaultTax > 0 && `(${method.defaultTax}%)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-body">Taxa Manual (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={manualTaxPercentage}
                  onChange={(e) => setManualTaxPercentage(parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="glass-input mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Taxa do gateway ou maquininha
                </p>
              </div>

              <div>
                <Label className="font-body">Observações</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações do pedido..."
                  className="glass-input mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="liquid-glass-card p-6">
            <h3 className="font-display text-lg font-medium mb-5">Resumo</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Valor Bruto</span>
                <span>{formatFullPrice(gross)}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Taxa ({effectiveTax}%)</span>
                <span className="text-destructive">-{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span className="status-badge status-badge-success">Grátis</span>
              </div>
              <div className="glass-divider" />
              <div className="flex justify-between items-center">
                <span className="font-display text-sm text-muted-foreground">Valor Líquido</span>
                <span className="font-body text-emerald-600 font-medium">{formatCurrency(net)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-display text-lg">Total Cobrado</span>
                <span className="glass-kpi text-2xl">{formatFullPrice(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              className="w-full glass-btn py-4"
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