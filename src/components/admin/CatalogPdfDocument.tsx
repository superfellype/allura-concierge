import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatCurrency, formatInstallment } from "@/lib/price-utils";

// Professional WhatsApp-friendly catalog design
const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontFamily: "Helvetica",
    backgroundColor: "#FEFDFB",
  },
  // Header styles
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "2 solid #D4A574",
    alignItems: "center",
  },
  brandName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#8B5A2B",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 11,
    color: "#A67C52",
    marginTop: 4,
    letterSpacing: 1,
  },
  catalogTitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
  },
  // Products grid - 3x3 layout for WhatsApp
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
  // Individual product card
  productCard: {
    width: "31%",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    border: "1 solid #E8E0D8",
  },
  productImageContainer: {
    width: "100%",
    height: 100,
    backgroundColor: "#F5F0EB",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: 100,
    objectFit: "cover",
  },
  productImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#F5F0EB",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 8,
    color: "#BFAE9F",
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4A3728",
    marginBottom: 4,
    lineHeight: 1.3,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8B5A2B",
  },
  originalPrice: {
    fontSize: 8,
    color: "#999",
    textDecoration: "line-through",
  },
  productInstallment: {
    fontSize: 7,
    color: "#7A6B5C",
  },
  // Badge for discounts
  discountBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#C75050",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 7,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 25,
    right: 25,
    borderTop: "1 solid #E8E0D8",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "column",
    gap: 3,
  },
  footerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 3,
  },
  footerText: {
    fontSize: 8,
    color: "#7A6B5C",
  },
  footerHighlight: {
    fontSize: 9,
    color: "#8B5A2B",
    fontWeight: "bold",
  },
  pageNumber: {
    fontSize: 8,
    color: "#999",
  },
  // Call to action
  ctaContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F5F0EB",
    borderRadius: 8,
    alignItems: "center",
  },
  ctaText: {
    fontSize: 10,
    color: "#4A3728",
    textAlign: "center",
  },
  ctaHighlight: {
    fontSize: 11,
    color: "#8B5A2B",
    fontWeight: "bold",
    marginTop: 4,
  },
});

interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  images: string[] | null;
}

interface CatalogPdfDocumentProps {
  products: Product[];
  storeInfo: {
    name: string;
    whatsapp: string;
    instagram: string;
    address: string;
  };
}

export default function CatalogPdfDocument({
  products,
  storeInfo,
}: CatalogPdfDocumentProps) {
  // Split products into pages (9 per page for 3x3 grid - WhatsApp friendly)
  const productsPerPage = 9;
  const pages: Product[][] = [];
  
  for (let i = 0; i < products.length; i += productsPerPage) {
    pages.push(products.slice(i, i + productsPerPage));
  }

  const calculateDiscount = (price: number, originalPrice: number | null | undefined) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  return (
    <Document>
      {pages.map((pageProducts, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <View style={styles.header}>
              <Text style={styles.brandName}>{storeInfo.name.toUpperCase()}</Text>
              <Text style={styles.tagline}>Acessórios que contam histórias</Text>
              <Text style={styles.catalogTitle}>Catálogo de Produtos</Text>
            </View>
          )}

          {/* Products Grid - 3x3 */}
          <View style={styles.productsGrid}>
            {pageProducts.map((product) => {
              const discount = calculateDiscount(product.price, product.original_price);
              
              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImageContainer}>
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} style={styles.productImage} />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.placeholderText}>Sem imagem</Text>
                      </View>
                    )}
                    {discount && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{discount}%</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {product.name.length > 30 
                        ? `${product.name.substring(0, 30)}...` 
                        : product.name}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.productPrice}>
                        {formatCurrency(product.price)}
                      </Text>
                      {product.original_price && product.original_price > product.price && (
                        <Text style={styles.originalPrice}>
                          {formatCurrency(product.original_price)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.productInstallment}>
                      ou {formatInstallment(product.price, 3)} s/ juros
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Call to action - last page only */}
          {pageIndex === pages.length - 1 && (
            <View style={styles.ctaContainer}>
              <Text style={styles.ctaText}>
                Gostou de alguma peça? Entre em contato!
              </Text>
              <Text style={styles.ctaHighlight}>
                WhatsApp: {storeInfo.whatsapp}
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerHighlight}>@{storeInfo.instagram.replace('@', '')}</Text>
              <Text style={styles.footerText}>{storeInfo.whatsapp}</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerText}>{storeInfo.address}</Text>
              <Text style={styles.pageNumber}>
                Página {pageIndex + 1} de {pages.length}
              </Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}
