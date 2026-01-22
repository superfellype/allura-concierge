import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatCurrency, formatInstallment } from "@/lib/price-utils";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "1 solid #eee",
    textAlign: "center",
  },
  brandName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  tagline: {
    fontSize: 10,
    color: "#666",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  productCard: {
    width: "48%",
    marginBottom: 15,
    padding: 10,
    border: "1 solid #eee",
    borderRadius: 8,
  },
  productImage: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    marginBottom: 8,
    borderRadius: 4,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  productName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B5A2B",
    marginBottom: 2,
  },
  productInstallment: {
    fontSize: 9,
    color: "#666",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: "1 solid #eee",
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#666",
  },
  contactInfo: {
    flexDirection: "column",
    gap: 2,
  },
});

interface Product {
  id: string;
  name: string;
  price: number;
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
  // Split products into pages (6 per page)
  const productsPerPage = 6;
  const pages: Product[][] = [];
  
  for (let i = 0; i < products.length; i += productsPerPage) {
    pages.push(products.slice(i, i + productsPerPage));
  }

  return (
    <Document>
      {pages.map((pageProducts, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {/* Header - only on first page */}
          {pageIndex === 0 && (
            <View style={styles.header}>
              <Text style={styles.brandName}>{storeInfo.name}</Text>
              <Text style={styles.tagline}>Catálogo de Produtos</Text>
            </View>
          )}

          {/* Products Grid */}
          <View style={styles.productsGrid}>
            {pageProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                {product.images?.[0] ? (
                  <Image src={product.images[0]} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={{ fontSize: 8, color: "#999" }}>Sem imagem</Text>
                  </View>
                )}
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>
                  {formatCurrency(product.price)}
                </Text>
                <Text style={styles.productInstallment}>
                  ou {formatInstallment(product.price, 3)} s/ juros
                </Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.contactInfo}>
              <Text>WhatsApp: {storeInfo.whatsapp}</Text>
              <Text>Instagram: {storeInfo.instagram}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text>{storeInfo.address}</Text>
              <Text>Página {pageIndex + 1} de {pages.length}</Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}
