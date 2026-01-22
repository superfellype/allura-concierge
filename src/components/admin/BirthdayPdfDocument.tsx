import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Styles for the PDF document
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottom: "1 solid #ddd",
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottom: "1 solid #ddd",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #eee",
    padding: 8,
  },
  colName: {
    width: "35%",
  },
  colPhone: {
    width: "25%",
  },
  colBirthdate: {
    width: "20%",
  },
  colOrders: {
    width: "20%",
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
  emptyMessage: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
    fontSize: 12,
  },
});

interface Customer {
  full_name: string | null;
  phone: string | null;
  ordersCount: number;
  totalSpent: number;
  preferences?: Record<string, unknown> | null;
}

interface BirthdayPdfDocumentProps {
  customers: Customer[];
  monthLabel: string;
}

function formatBirthdate(preferences: Record<string, unknown> | null | undefined): string {
  if (!preferences) return "-";
  
  const birthdate = preferences.birth_date || preferences.birthdate;
  if (typeof birthdate !== "string") return "-";
  
  try {
    const date = parseISO(birthdate);
    return format(date, "dd/MM", { locale: ptBR });
  } catch {
    return "-";
  }
}

export default function BirthdayPdfDocument({
  customers,
  monthLabel,
}: BirthdayPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Aniversariantes de {monthLabel}</Text>
          <Text style={styles.subtitle}>
            {customers.length} cliente{customers.length !== 1 ? "s" : ""} •
            Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </View>

        {/* Table */}
        {customers.length === 0 ? (
          <Text style={styles.emptyMessage}>
            Nenhum aniversariante encontrado para este mês.
          </Text>
        ) : (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.colName}>Nome</Text>
              <Text style={styles.colPhone}>Telefone</Text>
              <Text style={styles.colBirthdate}>Aniversário</Text>
              <Text style={styles.colOrders}>Pedidos</Text>
            </View>

            {/* Table Rows */}
            {customers.map((customer, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colName}>
                  {customer.full_name || "Sem nome"}
                </Text>
                <Text style={styles.colPhone}>{customer.phone || "-"}</Text>
                <Text style={styles.colBirthdate}>
                  {formatBirthdate(customer.preferences)}
                </Text>
                <Text style={styles.colOrders}>{customer.ordersCount}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Allura • Relatório de Aniversariantes
        </Text>
      </Page>
    </Document>
  );
}
