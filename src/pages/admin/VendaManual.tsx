import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Minus, Trash2, Check, Package, User, CreditCard, Loader2, MapPin, UserPlus, Percent, ChevronDown, Settings, ChevronsUpDown, Tag, Users } from "lucide-react";
import { Link } from "react-router-dom";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { paymentSettingsService, PaymentSetting, Installment } from "@/services/payment-settings.service";
import { cn } from "@/lib/utils";

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

interface Seller {
  id: string;
  name: string;
  is_active: boolean;
}

// Fallback payment methods if database is not available
const FALLBACK_PAYMENT_METHODS = [
  { 
    id: "pix", 
    method_id: "pix",
    method_label: "PIX", 
    icon: "💳",
    is_active: true,
    installments: [{ qty: 1, tax: 0, label: "À vista" }]
  },
  { 
    id: "credit_card", 
    method_id: "credit_card",
    method_label: "Cartão de Crédito",
    icon: "💳",
    is_active: true,
    installments: [
      { qty: 1, tax: 2.5, label: "À vista" },
      { qty: 2, tax: 3.5, label: "2x" },
      { qty: 3, tax: 4.0, label: "3x" },
      { qty: 4, tax: 4.5, label: "4x" },
      { qty: 5, tax: 5.0, label: "5x" },
      { qty: 6, tax: 5.5, label: "6x" },
    ]
  },
  { 
    id: "debit_card", 
    method_id: "debit_card",
    method_label: "Cartão de Débito",
    icon: "💳",
    is_active: true,
    installments: [{ qty: 1, tax: 1.5, label: "À vista" }]
  },
  { 
    id: "cash", 
    method_id: "cash",
    method_label: "Dinheiro",
    icon: "💵",
    is_active: true,
    installments: [{ qty: 1, tax: 0, label: "À vista" }]
  },
];

const VendaManual = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
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
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [customTax, setCustomTax] = useState<number | null>(null);
  const [showCustomTax, setShowCustomTax] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentSetting[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  
  // Discount states
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [showDiscount, setShowDiscount] = useState(false);
  
  // Seller states
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [sellerSearchOpen, setSellerSearchOpen] = useState(false);

  const { results: searchResults, searching, search } = useProductSearch();

  // Load payment methods from database
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setLoadingMethods(true);
      const { data, error } = await paymentSettingsService.getAll();
      if (error || !data || data.length === 0) {
        // Use fallback if database is not available
        setPaymentMethods(FALLBACK_PAYMENT_METHODS as unknown as PaymentSetting[]);
      } else {
        setPaymentMethods(data.filter(m => m.is_active));
      }
      setLoadingMethods(false);
    };
    loadPaymentMethods();
  }, []);

  const selectedMethod =
    paymentMethods.find((m) => m.method_id === paymentMethod) ||
    paymentMethods[0] ||
    (FALLBACK_PAYMENT_METHODS[0] as unknown as PaymentSetting);

  const selectedInstallmentData =
    selectedMethod?.installments?.find((i: Installment) => i.qty === selectedInstallment) ||
    selectedMethod?.installments?.[0] ||
    ({ qty: 1, tax: 0, label: "À vista" } as Installment);

  const effectiveTax = customTax !== null ? customTax : (selectedInstallmentData?.tax ?? 0);

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

  // Load sellers
  useEffect(() => {
    const loadSellers = async () => {
      const { data } = await supabase
        .from("sellers")
        .select("id, name, is_active")
        .eq("is_active", true)
        .order("name");
      
      if (data) {
        setSellers(data);
      }
    };
    loadSellers();
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

  // Reset installment when payment method changes
  useEffect(() => {
    setSelectedInstallment(1);
    setCustomTax(null);
    setShowCustomTax(false);
  }, [paymentMethod]);

  // Get selected customer object
  const selectedCustomerObj = useMemo(() => {
    return customers.find(c => c.user_id === selectedCustomer);
  }, [customers, selectedCustomer]);

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

  // Calculate totals with discount
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const discountNumericValue = parseFloat(discountValue) || 0;
  const discountAmount = useMemo(() => {
    if (discountNumericValue <= 0) return 0;
    if (discountType === "percentage") {
      const percentage = Math.min(discountNumericValue, 100);
      return (subtotal * percentage) / 100;
    }
    return Math.min(discountNumericValue, subtotal);
  }, [discountType, discountNumericValue, subtotal]);
  
  const subtotalWithDiscount = Math.max(0, subtotal - discountAmount);
  const total = subtotalWithDiscount;
  const { gross, tax, net } = calculateNetAmount(total, effectiveTax);
  const installmentValue = selectedInstallment > 1 ? total / selectedInstallment : total;

  const handleCreateCustomer = async (): Promise<string | null> => {
    if (!tempCustomerName.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return null;
    }

    setCreatingCustomer(true);

    try {
      const tempUserId = crypto.randomUUID();

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
      return tempUserId;
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Erro ao criar cliente");
      return null;
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

      // If no customer selected but temp name exists, create customer first
      if (!userId && tempCustomerName) {
        const newUserId = await handleCreateCustomer();
        if (!newUserId) {
          setSubmitting(false);
          return;
        }
        userId = newUserId;
      }

      if (!userId) {
        toast.error("Erro ao identificar cliente. Tente novamente.");
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

      const paymentLabel = selectedInstallment > 1 
        ? `${selectedMethod?.method_label || 'Pagamento'} ${selectedInstallment}x`
        : selectedMethod?.method_label || 'Pagamento';

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          subtotal,
          discount_total: discountAmount,
          total,
          shipping_cost: 0,
          status: "paid",
          payment_method: paymentLabel,
          origin: "manual",
          seller_id: selectedSeller || null,
          notes: notes ? `${notes} | Taxa: ${effectiveTax}%` : `Taxa: ${effectiveTax}%`,
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
          method: paymentLabel,
          status: "paid",
          provider: "manual",
          metadata: {
            installments: selectedInstallment,
            tax_percentage: effectiveTax,
            net_amount: net,
            discount_type: discountType,
            discount_value: discountNumericValue,
            discount_amount: discountAmount
          }
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
      setSelectedInstallment(1);
      setCustomTax(null);
      setShowCustomTax(false);
      setDiscountType("percentage");
      setDiscountValue("");
      setShowDiscount(false);
      setSelectedSeller("");
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
                className="pl-11 h-12 text-base"
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
                className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border rounded-xl shadow-xl p-2 max-h-80 overflow-y-auto"
              >
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
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
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku && `SKU: ${product.sku} • `}
                        Estoque: {product.stock_quantity}
                      </p>
                    </div>
                    <span className="font-medium text-primary">
                      {formatFullPrice(product.price)}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              Itens do Pedido
              {cart.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({cart.reduce((sum, item) => sum + item.quantity, 0)} itens)
                </span>
              )}
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Busque e adicione produtos ao pedido</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <motion.div 
                    key={item.product_id} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50"
                  >
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
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku && `#${item.sku} • `}
                        {formatFullPrice(item.price)} cada
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product_id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product_id, 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <span className="font-semibold min-w-[90px] text-right">
                      {formatFullPrice(item.price * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              Cliente
            </h3>

            <Tabs defaultValue="existing" className="w-full">
              <TabsList className="w-full mb-4 h-10">
                <TabsTrigger value="existing" className="flex-1 text-sm">Existente</TabsTrigger>
                <TabsTrigger value="new" className="flex-1 text-sm">Novo</TabsTrigger>
              </TabsList>

              <TabsContent value="existing">
                <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerSearchOpen}
                      className="w-full h-11 justify-between font-normal"
                    >
                      {selectedCustomerObj ? (
                        <span className="truncate">
                          {selectedCustomerObj.full_name || "Sem nome"}
                          {selectedCustomerObj.phone && (
                            <span className="text-muted-foreground ml-1">
                              ({selectedCustomerObj.phone})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Buscar cliente...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Digite nome ou telefone..." />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.user_id}
                              value={`${customer.full_name || ''} ${customer.phone || ''}`}
                              onSelect={() => {
                                setSelectedCustomer(customer.user_id);
                                setCustomerSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCustomer === customer.user_id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {customer.full_name || "Sem nome"}
                                </p>
                                {customer.phone && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {customer.phone}
                                  </p>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {selectedCustomerObj && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-muted-foreground"
                    onClick={() => setSelectedCustomer("")}
                  >
                    Limpar seleção
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome Completo *</Label>
                  <Input
                    value={tempCustomerName}
                    onChange={(e) => setTempCustomerName(e.target.value)}
                    placeholder="Nome completo"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                    <Input
                      value={tempCustomerPhone}
                      onChange={(e) => setTempCustomerPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CPF</Label>
                    <Input
                      value={tempCustomerCpf}
                      onChange={(e) => setTempCustomerCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={tempCustomerBirthDate}
                    onChange={(e) => setTempCustomerBirthDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Collapsible open={addressOpen} onOpenChange={setAddressOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full py-2">
                    <MapPin className="w-4 h-4" />
                    Endereço (opcional)
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${addressOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input
                          value={tempCustomerAddress.street}
                          onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, street: e.target.value }))}
                          placeholder="Rua"
                        />
                      </div>
                      <div>
                        <Input
                          value={tempCustomerAddress.number}
                          onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, number: e.target.value }))}
                          placeholder="Nº"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={tempCustomerAddress.neighborhood}
                        onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                        placeholder="Bairro"
                      />
                      <Input
                        value={tempCustomerAddress.city}
                        onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={tempCustomerAddress.state}
                        onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="UF"
                      />
                      <Input
                        value={tempCustomerAddress.zip}
                        onChange={(e) => setTempCustomerAddress(prev => ({ ...prev, zip: e.target.value }))}
                        placeholder="CEP"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={creatingCustomer || !tempCustomerName.trim()}
                  className="w-full"
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

          {/* Seller Selection */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                Vendedor
              </h3>
              <Link 
                to="/admin/vendedores" 
                className="text-xs text-primary hover:underline"
              >
                Gerenciar
              </Link>
            </div>

            {sellers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum vendedor cadastrado</p>
                <Link 
                  to="/admin/vendedores" 
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Cadastrar vendedores
                </Link>
              </div>
            ) : (
              <Popover open={sellerSearchOpen} onOpenChange={setSellerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={sellerSearchOpen}
                    className="w-full h-11 justify-between font-normal"
                  >
                    {selectedSeller ? (
                      <span className="truncate">
                        {sellers.find(s => s.id === selectedSeller)?.name || "Vendedor não encontrado"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Selecionar vendedor (opcional)</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar vendedor..." />
                    <CommandList>
                      <CommandEmpty>Nenhum vendedor encontrado.</CommandEmpty>
                      <CommandGroup>
                        {sellers.map((seller) => (
                          <CommandItem
                            key={seller.id}
                            value={seller.name}
                            onSelect={() => {
                              setSelectedSeller(seller.id === selectedSeller ? "" : seller.id);
                              setSellerSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSeller === seller.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {seller.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            {selectedSeller && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-muted-foreground"
                onClick={() => setSelectedSeller("")}
              >
                Limpar seleção
              </Button>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              Pagamento
            </h3>

            <div className="space-y-4">
              {/* Payment Method Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Método</Label>
                  <Link 
                    to="/admin/configuracoes" 
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    Configurar taxas
                  </Link>
                </div>
                {loadingMethods ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.method_id}
                        type="button"
                        onClick={() => setPaymentMethod(method.method_id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === method.method_id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-lg">{method.icon}</span>
                        <p className="text-sm font-medium mt-1">{method.method_label}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Installments Selection */}
              {(selectedMethod?.installments?.length ?? 0) > 1 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Parcelamento</Label>
                  <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto p-1">
                    {(selectedMethod?.installments ?? []).map((inst) => {
                      const instValue = total / inst.qty;
                      return (
                        <button
                          key={inst.qty}
                          type="button"
                          onClick={() => {
                            setSelectedInstallment(inst.qty);
                            setCustomTax(null);
                            setShowCustomTax(false);
                          }}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            selectedInstallment === inst.qty && customTax === null
                              ? 'border-primary bg-primary/10 ring-1 ring-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="text-sm font-semibold">{inst.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {inst.qty > 1 ? formatCurrency(instValue) : 'À vista'}
                          </p>
                          <p className="text-xs text-primary font-medium">{inst.tax}%</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Tax */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCustomTax(!showCustomTax)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Percent className="w-4 h-4" />
                  Taxa personalizada
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCustomTax ? 'rotate-180' : ''}`} />
                </button>
                
                {showCustomTax && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-2"
                  >
                    <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={customTax ?? ''}
                          onChange={(e) => setCustomTax(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder={String(selectedInstallmentData?.tax ?? 0)}
                          className="w-24"
                        />
                      <span className="text-sm text-muted-foreground">%</span>
                      {customTax !== null && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCustomTax(null)}
                          className="text-xs"
                        >
                          Usar padrão
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Discount Section */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDiscount(!showDiscount)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Tag className="w-4 h-4" />
                  Desconto manual
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDiscount ? 'rotate-180' : ''}`} />
                </button>

                {showDiscount && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3 space-y-3"
                  >
                    <ToggleGroup
                      type="single"
                      value={discountType}
                      onValueChange={(value) => {
                        if (value) setDiscountType(value as "percentage" | "fixed");
                      }}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="percentage" aria-label="Porcentagem" className="text-sm">
                        <Percent className="w-4 h-4 mr-1" />
                        %
                      </ToggleGroupItem>
                      <ToggleGroupItem value="fixed" aria-label="Valor fixo" className="text-sm">
                        R$
                      </ToggleGroupItem>
                    </ToggleGroup>

                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        step={discountType === "percentage" ? "1" : "0.01"}
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === "percentage" ? "10" : "50.00"}
                        className="w-28"
                      />
                      <span className="text-sm text-muted-foreground">
                        {discountType === "percentage" ? "%" : "reais"}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-sm bg-emerald-500/10 text-emerald-600 rounded-lg px-3 py-2">
                        <span>Desconto aplicado:</span>
                        <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs text-muted-foreground">Observações</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações do pedido..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-4">Resumo</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatFullPrice(subtotal)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="flex items-center gap-1">
                    Desconto
                    <span className="text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {discountType === "percentage" 
                        ? `${discountNumericValue}%` 
                        : "fixo"
                      }
                    </span>
                  </span>
                  <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="h-px bg-border" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatFullPrice(total)}</span>
              </div>
              
              {selectedInstallment > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{selectedInstallment}x de</span>
                  <span className="font-medium">{formatCurrency(installmentValue)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  Taxa da maquininha
                  <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                    {effectiveTax}%
                  </span>
                </span>
                <span className="text-destructive">-{formatCurrency(tax)}</span>
              </div>

              <div className="h-px bg-border my-3" />

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-muted-foreground block">Você recebe</span>
                  <span className="text-xl font-bold text-emerald-600">{formatCurrency(net)}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground block">Total cobrado</span>
                  <span className="text-2xl font-bold">{formatFullPrice(total)}</span>
                  {discountAmount > 0 && (
                    <span className="text-xs text-muted-foreground block">
                      (original: {formatFullPrice(subtotal)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              className="w-full mt-6 h-12 text-base"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Finalizar Venda
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
