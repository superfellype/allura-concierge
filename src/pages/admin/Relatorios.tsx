import { useState, useEffect } from "react";
import { FileSpreadsheet, Download, Calendar, Users, ShoppingCart, Tag, Package } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/price-utils";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/lib/export-utils";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function Relatorios() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  
  const [salesData, setSalesData] = useState<any[]>([]);
  const [clientsData, setClientsData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [couponsData, setCouponsData] = useState<any[]>([]);

  const loadSales = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          unit_price,
          product_id,
          products (name)
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (!error) {
      setSalesData(data || []);
    }
    setLoading(false);
  };

  const loadClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setClientsData(data || []);
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        total_price,
        products (name, price, stock_quantity)
      `);

    if (!error) {
      // Aggregate by product
      const aggregated: Record<string, { name: string; quantity: number; revenue: number; stock: number }> = {};
      data?.forEach(item => {
        const productName = (item.products as any)?.name || 'Produto removido';
        if (!aggregated[item.product_id]) {
          aggregated[item.product_id] = {
            name: productName,
            quantity: 0,
            revenue: 0,
            stock: (item.products as any)?.stock_quantity || 0
          };
        }
        aggregated[item.product_id].quantity += item.quantity;
        aggregated[item.product_id].revenue += Number(item.total_price);
      });
      setProductsData(Object.entries(aggregated).map(([id, data]) => ({ id, ...data })));
    }
    setLoading(false);
  };

  const loadCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupon_uses')
      .select(`
        *,
        coupons (code, discount_type, discount_value)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (!error) {
      setCouponsData(data || []);
    }
    setLoading(false);
  };

  const handleExportClients = () => {
    const dataToExport = clientsData.map(c => ({
      Nome: c.full_name || '-',
      Telefone: c.phone || '-',
      'Criado em': formatDateForExport(c.created_at)
    }));
    exportToCSV(dataToExport, `clientes-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success("Clientes exportados!");
  };

  const handleExportSales = () => {
    const dataToExport = salesData.map(s => ({
      Pedido: s.id.slice(0, 8),
      Status: s.status,
      Subtotal: formatCurrencyForExport(Number(s.subtotal)),
      Frete: formatCurrencyForExport(Number(s.shipping_cost)),
      Total: formatCurrencyForExport(Number(s.total)),
      Data: formatDateForExport(s.created_at)
    }));
    exportToCSV(dataToExport, `vendas-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success("Vendas exportadas!");
  };

  const handleExportProducts = () => {
    const dataToExport = productsData.sort((a, b) => b.quantity - a.quantity).map(p => ({
      Produto: p.name,
      'Quantidade Vendida': p.quantity,
      Receita: formatCurrencyForExport(p.revenue),
      'Estoque Atual': p.stock
    }));
    exportToCSV(dataToExport, `produtos-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success("Produtos exportados!");
  };

  const totalSales = salesData.reduce((sum, s) => sum + Number(s.total), 0);
  const paidOrders = salesData.filter(s => s.status === 'paid' || s.status === 'delivered');
  const totalPaid = paidOrders.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <AdminLayout title="Relatórios">
      <div className="space-y-6">
        {/* Date Filter */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">De:</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Até:</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="sales" onValueChange={(v) => {
          if (v === 'sales') loadSales();
          else if (v === 'clients') loadClients();
          else if (v === 'products') loadProducts();
          else if (v === 'coupons') loadCoupons();
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2">
              <Tag className="w-4 h-4" />
              Cupons
            </TabsTrigger>
          </TabsList>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold">{formatCurrency(totalSales)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Pagos: </span>
                  <span className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportSales} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.slice(0, 50).map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.status === 'paid' || order.status === 'delivered' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-muted'
                          }`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell>{order.order_items?.length || 0}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(order.total))}
                        </TableCell>
                        <TableCell>{format(new Date(order.created_at), 'dd/MM/yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-muted-foreground">Total de clientes: </span>
                <span className="font-bold">{clientsData.length}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportClients} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsData.map(client => (
                      <TableRow key={client.id}>
                        <TableCell>{client.full_name || '-'}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell>{format(new Date(client.created_at), 'dd/MM/yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="text-muted-foreground">Produtos vendidos: </span>
                <span className="font-bold">{productsData.length}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportProducts} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsData.sort((a, b) => b.quantity - a.quantity).map(product => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(product.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={product.stock < 5 ? 'text-destructive font-medium' : ''}>
                            {product.stock}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Cupons utilizados: </span>
              <span className="font-bold">{couponsData.length}</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : couponsData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum cupom utilizado no período</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Desconto Aplicado</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponsData.map(use => (
                      <TableRow key={use.id}>
                        <TableCell className="font-mono">
                          {(use.coupons as any)?.code || '-'}
                        </TableCell>
                        <TableCell>{(use.coupons as any)?.discount_type || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(use.discount_applied))}
                        </TableCell>
                        <TableCell>{format(new Date(use.created_at), 'dd/MM/yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
