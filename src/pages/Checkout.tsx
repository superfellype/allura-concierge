import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, CreditCard, Truck, ShieldCheck, Tag, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createPaymentGateway, formatPrice } from "@/lib/payment/infinitepay-adapter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { shippingService, ShippingOption, ProductDimensions } from "@/services/shipping.service";
import { couponsService, CouponValidation } from "@/services/coupons.service";
import { paymentsService } from "@/services/payments.service";

type PaymentProvider = 'stripe' | 'infinitepay';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  attributes: Record<string, string> | null;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
    weight_grams?: number;
    height_cm?: number;
    width_cm?: number;
    length_cm?: number;
  };
}

interface ShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const INFINITEPAY_HANDLE = 'andreybern';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; phone: string } | null>(null);
  
  // Address state
  const [address, setAddress] = useState<ShippingAddress>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidation | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Payment provider state
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('stripe');

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          attributes,
          products (id, name, price, images, weight_grams, height_cm, width_cm, length_cm)
        `)
        .eq('user_id', user?.id);

      if (cartError) throw cartError;

      if (!cartData || cartData.length === 0) {
        navigate('/carrinho');
        return;
      }

      setCartItems(cartData.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        attributes: (item.attributes as Record<string, string>) || null,
        product: item.products as any
      })));

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));

        // Calculate shipping after getting address
        calculateShipping(cleanCep);
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    }
  };

  const calculateShipping = async (cep: string) => {
    setLoadingShipping(true);
    
    const productDimensions: ProductDimensions[] = cartItems.map(item => ({
      weight_grams: item.product.weight_grams || 300,
      height_cm: item.product.height_cm || 10,
      width_cm: item.product.width_cm || 20,
      length_cm: item.product.length_cm || 30
    }));

    const { data, error } = await shippingService.calculateShipping(cep, productDimensions);
    
    if (data && !error) {
      setShippingOptions(data);
      // Auto-select cheapest option
      const cheapest = data.reduce((min, opt) => opt.price < min.price ? opt : min, data[0]);
      setSelectedShipping(cheapest);
    }
    
    setLoadingShipping(false);
  };

  const handleCepChange = (value: string) => {
    const formatted = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    setAddress(prev => ({ ...prev, cep: formatted }));
    
    if (formatted.replace(/\D/g, '').length === 8) {
      fetchAddressByCep(formatted);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    const validation = await couponsService.validate(couponCode, subtotal);
    setCouponValidation(validation);
    
    if (validation.valid) {
      toast.success(`Cupom aplicado: ${formatDiscount(validation)}`);
    } else {
      toast.error(validation.error || 'Cupom inválido');
    }
    
    setValidatingCoupon(false);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponValidation(null);
  };

  const formatDiscount = (validation: CouponValidation) => {
    if (!validation.coupon) return '';
    if (validation.coupon.discount_type === 'percentage') {
      return `${validation.coupon.discount_value}% de desconto`;
    }
    return `R$ ${validation.coupon.discount_value.toFixed(2)} de desconto`;
  };

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  const discount = couponValidation?.valid ? couponValidation.discount : 0;
  const shippingCost = shippingService.checkFreeShipping(subtotal) ? 0 : (selectedShipping?.price || 0);
  const total = subtotal - discount + shippingCost;

  const handleCheckout = async () => {
    // Validate address
    if (!address.cep || !address.street || !address.number || !address.city || !address.state) {
      toast.error('Preencha o endereço completo');
      return;
    }

    if (!selectedShipping && shippingCost > 0) {
      toast.error('Selecione uma opção de frete');
      return;
    }

    setProcessing(true);

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id as string,
          status: 'created' as const,
          subtotal,
          discount_total: discount,
          shipping_cost: shippingCost,
          total,
          shipping_address: JSON.parse(JSON.stringify(address)),
          payment_method: paymentProvider,
          coupon_id: couponValidation?.coupon?.id || null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        attributes: item.attributes
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Register coupon use if applied
      if (couponValidation?.valid && couponValidation.coupon) {
        await couponsService.incrementUse(
          couponValidation.coupon.id,
          user?.id as string,
          order.id,
          discount
        );
      }

      // Create payment record
      await paymentsService.create({
        order_id: order.id,
        amount: total,
        method: paymentProvider === 'stripe' ? 'card' : 'checkout_link',
        provider: paymentProvider
      });

      // Clear cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user?.id);

      if (paymentProvider === 'stripe') {
        // Call Stripe checkout edge function
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            order_id: order.id,
            items: cartItems.map(item => ({
              product_id: item.product_id,
              product_name: item.product.name,
              quantity: item.quantity,
              unit_price: item.product.price,
              image_url: item.product.images?.[0] ? `https://comallura.com${item.product.images[0]}` : undefined
            }))
          }
        });

        if (stripeError) throw stripeError;
        
        if (stripeData?.url) {
          window.location.href = stripeData.url;
        } else {
          throw new Error('Falha ao criar sessão de pagamento');
        }
      } else {
        // InfinitePay checkout
        const paymentGateway = createPaymentGateway(INFINITEPAY_HANDLE);
        
        const checkoutUrl = paymentGateway.createCheckoutLink({
          handle: INFINITEPAY_HANDLE,
          items: cartItems.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price
          })),
          redirect_url: `https://comallura.com/pedido/sucesso?orderId=${order.id}`
        });

        window.location.href = checkoutUrl;
      }

    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error('Erro ao processar pedido');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100/50 to-secondary/20 noise-bg">
        <Navbar />
        <main className="pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="liquid-glass-card p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100/50 to-secondary/20 noise-bg">
      <Navbar />
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-morph" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl animate-morph" style={{ animationDelay: "-4s" }} />
      </div>
      
      <main className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/carrinho"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Carrinho
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-serif mb-8"
          >
            Finalizar Compra
          </motion.h1>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-2 gap-8"
          >
            {/* Shipping Form */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Address Section */}
              <div className="liquid-glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="glass-icon w-10 h-10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-serif">Endereço de Entrega</h2>
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={address.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        className="mt-1 glass-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={address.state}
                        onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="MG"
                        maxLength={2}
                        className="mt-1 glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Uberlândia"
                      className="mt-1 glass-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={address.neighborhood}
                      onChange={(e) => setAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                      placeholder="Centro"
                      className="mt-1 glass-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={address.street}
                      onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Rua das Flores"
                      className="mt-1 glass-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        value={address.number}
                        onChange={(e) => setAddress(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="123"
                        className="mt-1 glass-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={address.complement}
                        onChange={(e) => setAddress(prev => ({ ...prev, complement: e.target.value }))}
                        placeholder="Apto 101"
                        className="mt-1 glass-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              <div className="liquid-glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass-icon w-10 h-10">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-serif">Frete</h2>
                </div>

                {shippingService.checkFreeShipping(subtotal) ? (
                  <div className="p-4 bg-green-50/80 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-400 text-sm backdrop-blur-sm border border-green-200/50">
                    🎉 Parabéns! Você ganhou <strong>frete grátis</strong> nesta compra.
                  </div>
                ) : loadingShipping ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculando frete...
                  </div>
                ) : shippingOptions.length > 0 ? (
                  <RadioGroup
                    value={selectedShipping?.service}
                    onValueChange={(value) => {
                      const option = shippingOptions.find(o => o.service === value);
                      if (option) setSelectedShipping(option);
                    }}
                    className="space-y-3"
                  >
                    {shippingOptions.map((option) => (
                      <div
                        key={option.service}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          selectedShipping?.service === option.service
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border/50 hover:border-primary/50 bg-background/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={option.service} id={option.service} />
                          <label htmlFor={option.service} className="cursor-pointer">
                            <p className="font-medium">{option.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {option.days} dias úteis
                            </p>
                          </label>
                        </div>
                        <span className="font-medium">{formatPrice(option.price)}</span>
                      </div>
                    ))}
                  </RadioGroup>
                ) : address.cep.length === 9 ? (
                  <p className="text-sm text-muted-foreground">
                    Digite um CEP válido para calcular o frete
                  </p>
                ) : null}
              </div>

              {/* Coupon */}
              <div className="liquid-glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass-icon w-10 h-10">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-serif">Cupom de Desconto</h2>
                </div>

                {couponValidation?.valid ? (
                  <div className="flex items-center justify-between p-4 bg-green-50/80 dark:bg-green-900/20 rounded-xl backdrop-blur-sm border border-green-200/50">
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        {couponValidation.coupon?.code}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        {formatDiscount(couponValidation)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="text-destructive hover:text-destructive"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="uppercase glass-input"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      variant="outline"
                      className="glass-btn-secondary"
                    >
                      {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Options */}
              <div className="liquid-glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="glass-icon w-10 h-10">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-serif">Forma de Pagamento</h2>
                </div>

                <RadioGroup
                  value={paymentProvider}
                  onValueChange={(value) => setPaymentProvider(value as PaymentProvider)}
                  className="space-y-3"
                >
                  {/* Stripe Option */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      paymentProvider === 'stripe'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/50 hover:border-primary/50 bg-background/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <label htmlFor="stripe" className="cursor-pointer flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" />
                          <p className="font-medium">Cartão de Crédito</p>
                          <span className="text-xs bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Recomendado
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pague de forma segura com Stripe
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* InfinitePay Option */}
                  <div
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      paymentProvider === 'infinitepay'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/50 hover:border-primary/50 bg-background/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="infinitepay" id="infinitepay" />
                      <label htmlFor="infinitepay" className="cursor-pointer flex-1">
                        <p className="font-medium">Pix ou Cartão (InfinitePay)</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pague com Pix ou cartão via InfinitePay
                        </p>
                      </label>
                    </div>
                  </div>
                </RadioGroup>

                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span>Pagamento Seguro</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div variants={itemVariants}>
              <div className="liquid-glass-card p-6 lg:sticky lg:top-32">
                <h2 className="text-xl font-serif mb-6">Resumo do Pedido</h2>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/50 flex-shrink-0 border border-border/30">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                        <p className="text-sm font-medium text-primary">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-divider mb-4" />

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>- {formatPrice(discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-green-600">Grátis</span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>

                  <div className="glass-divider" />
                  
                  <div className="flex justify-between text-lg font-medium pt-2">
                    <span>Total</span>
                    <span className="glass-kpi text-2xl">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full glass-btn py-4 disabled:opacity-50"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </span>
                  ) : paymentProvider === 'stripe' ? (
                    <span className="flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Pagar com Cartão
                    </span>
                  ) : (
                    'Pagar com InfinitePay'
                  )}
                </button>

                <p className="mt-4 text-xs text-center text-muted-foreground">
                  Ao finalizar, você concorda com nossos termos de uso
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
